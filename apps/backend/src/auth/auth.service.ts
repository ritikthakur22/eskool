import { ConflictException, Injectable, UnauthorizedException, BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { createHash, randomBytes } from 'node:crypto';

const client = new OAuth2Client({
  clientId: '615870071152-rgua2dekn9bk7s537ippt172u9ktgcgr.apps.googleusercontent.com',
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
      const ticket = await client.verifyIdToken({ idToken, audience: '615870071152-rgua2dekn9bk7s537ippt172u9ktgcgr.apps.googleusercontent.com' });
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
    const [session] = await this.prisma.$queryRaw<Array<{ id: string; userId: string; tokenHash: string; expiresAt: Date; revokedAt: Date | null; email: string; role: Role; schoolId: string }>>(Prisma.sql`
      SELECT s."id", s."userId", s."tokenHash", s."expiresAt", s."revokedAt", u."email", u."role", u."schoolId"
      FROM "AuthSession" s JOIN "User" u ON u."id" = s."userId"
      WHERE s."tokenHash" = ${this.hashRefreshToken(refreshToken)} LIMIT 1
    `);
    if (!session || session.revokedAt || session.expiresAt <= new Date()) throw new UnauthorizedException('Your saved sign-in expired. Please sign in with your password again.');
    const next = await this.createSession({ id: session.userId, email: session.email, role: session.role, schoolId: session.schoolId });
    const [replacement] = await this.prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "AuthSession" WHERE "tokenHash" = ${this.hashRefreshToken(next.refresh_token)} LIMIT 1`);
    const revoked = await this.prisma.$executeRaw(Prisma.sql`UPDATE "AuthSession" SET "revokedAt" = NOW(), "lastUsedAt" = NOW(), "replacedById" = ${replacement?.id || null} WHERE "id" = ${session.id} AND "revokedAt" IS NULL`);
    if (!revoked) {
      await this.prisma.$executeRaw(Prisma.sql`UPDATE "AuthSession" SET "revokedAt" = NOW() WHERE "id" = ${replacement!.id}`);
      throw new UnauthorizedException('This saved sign-in was already used. Please sign in again.');
    }
    return next;
  }

  async logout(refreshToken: string) {
    await this.prisma.$executeRaw(Prisma.sql`UPDATE "AuthSession" SET "revokedAt" = NOW() WHERE "tokenHash" = ${this.hashRefreshToken(refreshToken)} AND "revokedAt" IS NULL`);
    return { success: true };
  }

  private hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async createSession(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role, schoolId: user.schoolId };
    const refreshToken = randomBytes(48).toString('base64url');
    await this.prisma.$executeRaw(Prisma.sql`INSERT INTO "AuthSession" ("id", "userId", "tokenHash", "expiresAt") VALUES (${randomBytes(16).toString('hex')}, ${user.id}, ${this.hashRefreshToken(refreshToken)}, ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)})`);
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refresh_token: refreshToken,
      user: payload,
    };
  }

}
