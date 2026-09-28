import { ConflictException, Injectable, UnauthorizedException, BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

const client = new OAuth2Client({
  clientId: '228295306473-t6cv4gac9pn81pbcgk6av05roi9j2662.apps.googleusercontent.com',
  transporterOptions: { timeout: 8_000 },
});

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email.trim().toLowerCase());
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async validateGoogleUser(idToken: string): Promise<any> {
    try {
      const identity = await this.verifyGoogleIdentity(idToken);
      const [user] = await this.prisma.$queryRaw<Array<{ id: string; email: string; role: Role; schoolId: string }>>(Prisma.sql`
        SELECT "id", "email", "role", "schoolId" FROM "User" WHERE "googleSubject" = ${identity.subject} LIMIT 1
      `);
      if (!user) throw new UnauthorizedException('This Google account is not linked. Sign in with your school email and password, then link Google in Settings.');
      return user;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid Google sign-in token. Please try again.');
    }
  }

  async getGoogleLinkStatus(userId: string) {
    const [link] = await this.prisma.$queryRaw<Array<{ googleEmail: string | null }>>(Prisma.sql`
      SELECT "googleEmail" FROM "User" WHERE "id" = ${userId} LIMIT 1
    `);
    if (!link) throw new NotFoundException('User not found');
    return { linked: Boolean(link.googleEmail), email: link.googleEmail };
  }

  async linkGoogleAccount(userId: string, idToken: string) {
    const identity = await this.verifyGoogleIdentity(idToken);
    try {
      const [currentUser] = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "User" WHERE "id" = ${userId} LIMIT 1`);
      if (!currentUser) throw new NotFoundException('User not found');
      const [existing] = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "User" WHERE "googleSubject" = ${identity.subject} LIMIT 1`);
      if (existing && existing.id !== userId) throw new ConflictException('This Google account is already linked to another school account.');
      await this.prisma.$executeRaw(Prisma.sql`UPDATE "User" SET "googleSubject" = ${identity.subject}, "googleEmail" = ${identity.email} WHERE "id" = ${userId}`);
      return { linked: true, email: identity.email };
    } catch (error: any) {
      if (error instanceof ConflictException || error instanceof NotFoundException) throw error;
      if (error?.code === 'P2010' || error?.code === 'P2021' || error?.code === 'P2022') {
        throw new ServiceUnavailableException('Google linking is not enabled in the database yet. Apply the pending Prisma migrations, then try again.');
      }
      throw error;
    }
  }

  async unlinkGoogleAccount(userId: string) {
    const result = await this.prisma.$executeRaw(Prisma.sql`UPDATE "User" SET "googleSubject" = NULL, "googleEmail" = NULL WHERE "id" = ${userId}`);
    if (!result) throw new NotFoundException('User not found');
    return { linked: false, email: null };
  }

  private async verifyGoogleIdentity(idToken: string) {
    try {
      const ticket = await client.verifyIdToken({ idToken, audience: '228295306473-t6cv4gac9pn81pbcgk6av05roi9j2662.apps.googleusercontent.com' });
      const payload = ticket.getPayload();
      const email = payload?.email?.trim().toLowerCase();
      if (!payload?.sub || !email || payload.email_verified !== true) throw new UnauthorizedException('Use a verified Google account to continue.');
      return { subject: payload.sub, email };
    } catch (error: any) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid Google sign-in token. Please try again.');
    }
  }

  async login(user: any) {
    return this.createSession(user);
  }

  async refreshSession(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken);
    } catch {
      throw new UnauthorizedException('Your saved sign-in expired. Please sign in with your password again.');
    }
    if (payload.tokenUse !== 'refresh' || !payload.sub) {
      throw new UnauthorizedException('Invalid saved sign-in. Please sign in with your password again.');
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('This account is no longer available.');
    return this.createSession(user);
  }

  private createSession(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role, schoolId: user.schoolId };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign({ ...payload, tokenUse: 'refresh' }, { expiresIn: '30d' }),
      user: payload,
    };
  }

}
