import { ConflictException, Injectable, UnauthorizedException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { createHash, randomBytes } from 'node:crypto';
import { AuditService } from '../audit/audit.service.js';

const googleWebClientId = process.env.GOOGLE_WEB_CLIENT_ID?.trim() || '';
const client = new OAuth2Client({
  clientId: googleWebClientId,
  transporterOptions: { timeout: 8_000 },
});

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async validateUser(identifier: string, pass: string): Promise<any> {
    try {
      const trimmed = identifier.trim();
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: trimmed.toLowerCase() },
            { userId: trimmed },
            { emisId: trimmed }
          ]
        },
        include: { school: { select: { status: true } } },
      });
      if (user && user.status === 'ACTIVE' && user.school.status === 'ACTIVE' && await bcrypt.compare(pass, user.password)) {
        const { password: _password, ...result } = user;
        return result;
      }
      return null;
    } catch (error) {
      console.error('auth_login_lookup_failed', error);
      throw new ServiceUnavailableException('Authentication service is temporarily unavailable. Please try again later.');
    }
  }

  async validateGoogleUser(idToken: string): Promise<any> {
    try {
      const identity = await this.verifyGoogleIdentity(idToken);
      const [user] = await this.prisma.$queryRaw<Array<{ id: string; email: string; role: Role; schoolId: string; tokenVersion: number }>>(Prisma.sql`
        SELECT u."id", u."email", u."role", u."schoolId", u."tokenVersion"
        FROM "User" u JOIN "School" s ON s."id" = u."schoolId"
        WHERE u."googleSubject" = ${identity.subject} AND u."status" = 'ACTIVE' AND s."status" = 'ACTIVE' LIMIT 1
      `);
      if (!user) throw new UnauthorizedException('This Google account is not linked. Sign in with your school email and password, then link Google in Settings.');
      return user;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) throw error;
      if (error instanceof ServiceUnavailableException) throw error;
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
      if (!googleWebClientId) throw new ServiceUnavailableException('Google sign-in is not configured on the school server.');
      const ticket = await client.verifyIdToken({ idToken, audience: googleWebClientId });
      const payload = ticket.getPayload();
      const email = payload?.email?.trim().toLowerCase();
      if (!payload?.sub || !email || payload.email_verified !== true) throw new UnauthorizedException('Use a verified Google account to continue.');
      return { subject: payload.sub, email };
    } catch (error: any) {
      if (error instanceof ServiceUnavailableException) throw error;
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid Google sign-in token. Please try again.');
    }
  }

  async login(user: any) {
    const session = await this.createSession(user);
    void this.audit.record({ action: 'LOGIN_SUCCESS', entity: 'User', entityId: user.id, userId: user.id, schoolId: user.schoolId });
    const { sessionId: _sessionId, ...response } = session;
    const formattedUser = await this.getCurrentUserFormatted(user.id);
    return { ...response, user: formattedUser || response.user };
  }

  async refreshSession(refreshToken: string) {
    const result = await this.prisma.$transaction(async tx => {
      const [session] = await tx.$queryRaw<Array<{ id: string; userId: string; expiresAt: Date; revokedAt: Date | null; email: string; role: Role; schoolId: string; tokenVersion: number }>>(Prisma.sql`
        SELECT s."id", s."userId", s."expiresAt", s."revokedAt", u."email", u."role", u."schoolId", u."tokenVersion"
        FROM "AuthSession" s JOIN "User" u ON u."id" = s."userId" JOIN "School" sc ON sc."id" = u."schoolId"
        WHERE s."tokenHash" = ${this.hashRefreshToken(refreshToken)} LIMIT 1
        FOR UPDATE OF s
      `);
      if (!session || session.revokedAt || session.expiresAt <= new Date()) throw new UnauthorizedException('Your saved sign-in expired. Please sign in with your password again.');
      const [activeUser] = await tx.$queryRaw<Array<{ status: string; schoolStatus: string }>>(Prisma.sql`
        SELECT u."status", sc."status" AS "schoolStatus"
        FROM "User" u JOIN "School" sc ON sc."id" = u."schoolId"
        WHERE u."id" = ${session.userId} LIMIT 1
      `);
      if (!activeUser || activeUser.status !== 'ACTIVE' || activeUser.schoolStatus !== 'ACTIVE') throw new UnauthorizedException('This account or school is inactive.');
      const next = await this.createSession({ id: session.userId, email: session.email, role: session.role, schoolId: session.schoolId, tokenVersion: session.tokenVersion }, tx);
      const revoked = await tx.$executeRaw(Prisma.sql`UPDATE "AuthSession" SET "revokedAt" = NOW(), "lastUsedAt" = NOW(), "replacedById" = ${next.sessionId} WHERE "id" = ${session.id} AND "revokedAt" IS NULL`);
      if (!revoked) throw new UnauthorizedException('This saved sign-in was already used. Please sign in again.');
      return { oldSessionId: session.id, userId: session.userId, schoolId: session.schoolId, next };
    });
    const { next } = result;
    const { sessionId: _replacementId, ...tokens } = next;
    return tokens;
  }

  async logout(refreshToken: string) {
    const [session] = await this.prisma.$queryRaw<Array<{ id: string; userId: string; schoolId: string }>>(Prisma.sql`
      SELECT s."id", s."userId", u."schoolId" FROM "AuthSession" s JOIN "User" u ON u."id" = s."userId"
      WHERE s."tokenHash" = ${this.hashRefreshToken(refreshToken)} AND s."revokedAt" IS NULL LIMIT 1
    `);
    await this.prisma.$executeRaw(Prisma.sql`UPDATE "AuthSession" SET "revokedAt" = NOW() WHERE "tokenHash" = ${this.hashRefreshToken(refreshToken)} AND "revokedAt" IS NULL`);
    if (session) void this.audit.record({ action: 'LOGOUT', entity: 'AuthSession', entityId: session.id, userId: session.userId, schoolId: session.schoolId });
    return { success: true };
  }

  
  async getCurrentUserFormatted(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, userId: true, emisId: true, email: true, role: true, profilePictureUrl: true,
        adminProfile: true, teacherProfile: true, studentProfile: true,
      }
    });
    if (!user) return null;
    const [hasPhoto] = await this.prisma.$queryRaw<Array<{ hasProfilePicture: boolean }>>(Prisma.sql`SELECT ("profilePicture" IS NOT NULL OR "profilePictureUrl" IS NOT NULL) AS "hasProfilePicture" FROM "User" WHERE "id" = ${id} LIMIT 1`);
    if (!user) return null;

    let firstName = null;
    let lastName = null;
    let department = null;

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      firstName = user.adminProfile?.firstName;
      lastName = user.adminProfile?.lastName;
      department = user.adminProfile?.department;
    } else if (user.role === 'TEACHER') {
      firstName = user.teacherProfile?.firstName;
      lastName = user.teacherProfile?.lastName;
    } else if (user.role === 'STUDENT') {
      firstName = user.studentProfile?.firstName;
      lastName = user.studentProfile?.lastName;
    }

    return {
      id: user.id,
      userId: user.userId,
      emisId: user.emisId,
      email: user.email,
      role: user.role,
      firstName,
      lastName,
      department,
      profilePic: user.profilePictureUrl ? user.profilePictureUrl : (hasPhoto?.hasProfilePicture ? '/users/me/photo' : null)
    };
  }

  private hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async createSession(user: any, db: PrismaService | Prisma.TransactionClient = this.prisma) {
    const payload = { email: user.email, sub: user.id, role: user.role, schoolId: user.schoolId, tokenVersion: user.tokenVersion ?? 0 };
    const refreshToken = randomBytes(48).toString('base64url');
    const sessionId = randomBytes(16).toString('hex');
    await db.$executeRaw(Prisma.sql`INSERT INTO "AuthSession" ("id", "userId", "tokenHash", "expiresAt") VALUES (${sessionId}, ${user.id}, ${this.hashRefreshToken(refreshToken)}, ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)})`);
    return {
      sessionId,
      access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refresh_token: refreshToken,
      user: payload,
    };
  }

}
