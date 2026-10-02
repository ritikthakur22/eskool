import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CloudinaryService } from '../storage/cloudinary.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { UpdateProfileDto } from './dto/user.dto.js';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private readonly cloudinary: CloudinaryService, private readonly audit: AuditService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async getOwnProfile(userId: string) {
    const [user] = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      SELECT u."id", u."email", u."role"::text AS "role", s."name" AS "schoolName",
             (u."profilePicture" IS NOT NULL OR u."profilePictureUrl" IS NOT NULL) AS "hasProfilePicture"
      FROM "User" u JOIN "School" s ON s."id" = u."schoolId" WHERE u."id" = ${userId} LIMIT 1
    `);
    if (!user) throw new NotFoundException('User not found');
    const { hasProfilePicture, ...userDetails } = user;
    const profilePictureUrl = hasProfilePicture ? '/users/me/photo' : null;
    if (user.role === 'STUDENT') {
      const [profile] = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`SELECT "firstName", "lastName", "grade", "section", "dob", "rollNo", "phone", "gender", "address", "parentName", "parentPhone" FROM "StudentProfile" WHERE "userId" = ${userId} LIMIT 1`);
      if (!profile) return { ...userDetails, profilePictureUrl };
      return { ...userDetails, ...profile, studentId: profile.rollNo, profilePictureUrl };
    }
    if (user.role === 'TEACHER') {
      const [profile] = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`SELECT "firstName", "lastName", "subjects" FROM "TeacherProfile" WHERE "userId" = ${userId} LIMIT 1`);
      if (!profile) return { ...userDetails, profilePictureUrl };
      return { ...userDetails, ...profile, profilePictureUrl };
    }
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      const [profile] = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`SELECT "firstName", "lastName", "department" FROM "AdminProfile" WHERE "userId" = ${userId} LIMIT 1`);
      if (!profile) return { ...userDetails, profilePictureUrl };
      return { ...userDetails, ...profile, profilePictureUrl };
    }
    return { ...userDetails, profilePictureUrl };
  }

  async updateOwnProfile(userId: string, input: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, studentProfile: { select: { userId: true } }, teacherProfile: { select: { userId: true } }, adminProfile: { select: { userId: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    const allowedText = ['firstName', 'lastName', 'email', 'studentId', 'phone', 'gender', 'address', 'parentName', 'parentPhone'] as const;
    const values: Record<string, string> = {};
    for (const key of allowedText) {
      if (input[key] === undefined) continue;
      if (typeof input[key] !== 'string' || (['firstName', 'lastName', 'email'].includes(key) && !input[key].trim()) || input[key].trim().length > (key === 'address' ? 500 : 100)) {
        throw new BadRequestException(`${key} has an invalid value`);
      }
      values[key] = input[key].trim();
    }
    const email = values.email?.toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Enter a valid email address');
    const current = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (email && email !== current?.email) {
      const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (existing && existing.id !== userId) throw new ConflictException('That email address is already in use');
    }
    const fields: { firstName?: string; lastName?: string } = {};
    if (values.firstName !== undefined) fields.firstName = values.firstName;
    if (values.lastName !== undefined) fields.lastName = values.lastName;
    if (user.role === 'STUDENT' && user.studentProfile) {
    const studentFields: Record<string, string | Date | null | undefined> = { ...fields };
      if (values.studentId !== undefined) studentFields.rollNo = values.studentId;
      for (const key of ['phone', 'gender', 'address', 'parentName', 'parentPhone'] as const) {
        if (values[key] !== undefined) studentFields[key] = values[key];
      }
      if (input.dob !== undefined) {
        let dob: Date | null = null;
        if (input.dob !== null && input.dob !== '') {
          if (typeof input.dob !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.dob) || Number.isNaN(Date.parse(`${input.dob}T00:00:00.000Z`)) || new Date(`${input.dob}T00:00:00.000Z`).toISOString().slice(0, 10) !== input.dob) {
            throw new BadRequestException('Date of birth must use YYYY-MM-DD format');
          }
          dob = new Date(`${input.dob}T00:00:00.000Z`);
        }
        studentFields.dob = dob;
      }
      const setClauses: Prisma.Sql[] = [];
      for (const key of ['firstName', 'lastName', 'rollNo', 'phone', 'gender', 'address', 'parentName', 'parentPhone', 'dob'] as const) {
        const value = studentFields[key];
        if (value !== undefined) setClauses.push(Prisma.sql`${Prisma.raw(`"${key}"`)} = ${value}`);
      }
      if (setClauses.length) await this.prisma.$executeRaw(Prisma.sql`UPDATE "StudentProfile" SET ${Prisma.join(setClauses, ', ')} WHERE "userId" = ${userId}`);
    } else if (user.role === 'TEACHER' && user.teacherProfile) {
      if ((['studentId', 'phone', 'gender', 'address', 'parentName', 'parentPhone'] as const).some(key => input[key] !== undefined)) throw new BadRequestException('These details are only available for student profiles');
      if (input.dob !== undefined) throw new BadRequestException('Only students can update date of birth');
      if (Object.keys(fields).length) await this.prisma.teacherProfile.update({ where: { userId }, data: fields });
    } else if ((user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && user.adminProfile) {
      if ((['studentId', 'phone', 'gender', 'address', 'parentName', 'parentPhone'] as const).some(key => input[key] !== undefined)) throw new BadRequestException('These details are only available for student profiles');
      if (input.dob !== undefined) throw new BadRequestException('Date of birth cannot be updated for this account');
      if (Object.keys(fields).length) await this.prisma.adminProfile.update({ where: { userId }, data: fields });
    } else if (Object.values(values).some(value => value !== email) || input.dob !== undefined) {
      throw new BadRequestException('This account has no editable profile');
    }
    if (email && email !== current?.email) await this.prisma.user.update({ where: { id: userId }, data: { email } });
    return this.getOwnProfile(userId);
  }

  async changeOwnPassword(userId: string, currentPassword: unknown, newPassword: unknown) {
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
      throw new BadRequestException('Enter your current password and a new password of at least 8 characters');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
    if (!user) throw new NotFoundException('User not found');
    if (!(await bcrypt.compare(currentPassword, user.password))) throw new UnauthorizedException('Current password is incorrect');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { password: passwordHash, tokenVersion: { increment: 1 } } }),
      this.prisma.authSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    void this.audit.record({ action: 'PASSWORD_CHANGED', entity: 'User', entityId: userId, userId });
    return { success: true };
  }

  async getProfilePhoto(userId: string) {
    const [photo] = await this.prisma.$queryRaw<Array<{ profilePicture: Uint8Array | null; profilePictureMimeType: string | null; profilePictureUrl: string | null }>>(Prisma.sql`
      SELECT "profilePicture", "profilePictureMimeType", "profilePictureUrl" FROM "User" WHERE "id" = ${userId} LIMIT 1
    `);
    if (!photo) throw new NotFoundException('No profile photo has been uploaded.');
    if (photo.profilePictureUrl) {
      const response = await fetch(photo.profilePictureUrl);
      if (!response.ok) throw new NotFoundException('Profile photo is temporarily unavailable.');
      return { buffer: Buffer.from(await response.arrayBuffer()), mimeType: response.headers.get('content-type') || 'image/jpeg' };
    }
    if (!photo.profilePicture) throw new NotFoundException('No profile photo has been uploaded.');
    return { buffer: Buffer.from(photo.profilePicture), mimeType: photo.profilePictureMimeType || 'image/jpeg' };
  }

  async updateProfilePhoto(userId: string, file: { buffer: Buffer; mimetype: string }) {
    if (this.cloudinary.isConfigured()) {
      const uploaded = await this.cloudinary.upload(file.buffer, { folder: 'eskool/profile-photos', resourceType: 'image' });
      await this.prisma.$executeRaw(Prisma.sql`
        UPDATE "User" SET "profilePicture" = NULL, "profilePictureMimeType" = ${file.mimetype}, "profilePictureUrl" = ${uploaded.secure_url}, "profilePicturePublicId" = ${uploaded.public_id}
        WHERE "id" = ${userId}
      `);
      return { success: true, profilePictureUrl: '/users/me/photo', storage: 'cloudinary' };
    }
    const updated = await this.prisma.$executeRaw(Prisma.sql`
      UPDATE "User" SET "profilePicture" = ${file.buffer}, "profilePictureMimeType" = ${file.mimetype}
      WHERE "id" = ${userId}
    `);
    if (!updated) throw new NotFoundException('User not found');
    return { success: true, profilePictureUrl: '/users/me/photo' };
  }
}
