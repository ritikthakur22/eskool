import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { CloudinaryService } from '../storage/cloudinary.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { UpdateManagedUserDto, UpdateProfileDto } from './dto/user.dto.js';
import { canManageRole } from './users.policy.js';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private readonly cloudinary: CloudinaryService, private readonly audit: AuditService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { email: { equals: email.trim(), mode: 'insensitive' } } });
  }

  async findByEmisId(emisId: string) {
    return this.prisma.user.findFirst({ where: { emisId: { equals: emisId.trim(), mode: 'insensitive' } }, select: { id: true } });
  }

  async findByStudentId(studentId: string) {
    return this.prisma.user.findFirst({ where: { userId: { equals: studentId.trim(), mode: 'insensitive' } }, select: { id: true } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    try {
      if (!data.id) {
        const [result] = await this.prisma.$queryRaw<Array<{ maxId: number }>>`
          SELECT MAX(CAST(SUBSTRING("id" FROM 5) AS INTEGER)) as "maxId" 
          FROM "User" 
          WHERE "id" ~ '^dps-\\d+$'
        `;
        const nextId = (result?.maxId || 0) + 1;
        data.id = \`dps-\${String(nextId).padStart(4, '0')}\`;
      }
      return await this.prisma.user.create({ data });
    }
    catch (error: any) { if (error?.code === 'P2002') throw new ConflictException('Email, EMIS ID, or student ID is already in use.'); throw error; }
  }

  private async getManagedTarget(id: string, actor: { schoolId: string; actorRole: Role }) {
    const target = await this.prisma.user.findFirst({
      where: { id, schoolId: actor.schoolId },
      select: { id: true, email: true, role: true, status: true, disabledAt: true, createdAt: true, updatedAt: true, schoolId: true },
    });
    if (!target) throw new NotFoundException('User not found in your school.');
    if (!canManageRole(actor.actorRole, target.role)) throw new UnauthorizedException('You do not have permission to manage this account.');
    return target;
  }

  async listManagedUsers(filters: { schoolId: string; actorRole: Role; role?: string; status?: string; query?: string }) {
    const role = filters.role && Object.values(Role).includes(filters.role as Role) ? filters.role as Role : undefined;
    const status = filters.status === 'ACTIVE' || filters.status === 'DISABLED' ? filters.status : undefined;
    const users = await this.prisma.user.findMany({
      where: {
        schoolId: filters.schoolId,
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
        ...(filters.query?.trim() ? { email: { contains: filters.query.trim(), mode: 'insensitive' } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, email: true, role: true, status: true, disabledAt: true, createdAt: true,
        studentProfile: { select: { firstName: true, lastName: true, grade: true, section: true, rollNo: true } },
        teacherProfile: { select: { firstName: true, lastName: true, phone: true } },
        adminProfile: { select: { firstName: true, lastName: true, department: true, phone: true } },
      },
    });
    return users.filter(user => canManageRole(filters.actorRole, user.role));
  }

  async getManagedUser(id: string, actor: { schoolId: string; actorRole: Role }) {
    await this.getManagedTarget(id, actor);
    const user = await this.prisma.user.findFirst({
      where: { id, schoolId: actor.schoolId },
      select: {
        id: true, email: true, role: true, status: true, disabledAt: true, createdAt: true, updatedAt: true, userId: true, emisId: true, profilePictureUrl: true,
        studentProfile: true, teacherProfile: true, adminProfile: true,
      },
    });
    if (!user) return null;
    const [hasPhoto] = await this.prisma.$queryRaw<Array<{ hasProfilePicture: boolean }>>(Prisma.sql`SELECT ("profilePicture" IS NOT NULL OR "profilePictureUrl" IS NOT NULL) AS "hasProfilePicture" FROM "User" WHERE "id" = ${id} LIMIT 1`);
    if (hasPhoto?.hasProfilePicture) {
      user.profilePictureUrl = `/users/admin/users/${id}/photo`;
    }
    return user;
  }

  async updateManagedUser(id: string, input: UpdateManagedUserDto, actor: { actorId: string; schoolId: string; actorRole: Role }) {
    const target = await this.getManagedTarget(id, actor);
    const email = input.email?.trim().toLowerCase();
    if (email && email !== target.email) {
      const existing = await this.prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true } });
      if (existing && existing.id !== id) throw new ConflictException('That email address is already in use.');
    }
    const firstName = input.firstName?.trim();
    const lastName = input.lastName?.trim();
    if ((input.firstName !== undefined && !firstName) || (input.lastName !== undefined && !lastName)) throw new BadRequestException('Name fields cannot be empty.');
    const emisId = input.emisId?.trim(); const studentId = input.userId?.trim();
    if (target.role === Role.STUDENT && input.emisId !== undefined && !emisId) throw new BadRequestException('Student EMIS ID cannot be empty.');
    if (emisId) { const duplicate = await this.prisma.user.findFirst({ where: { id: { not: id }, emisId: { equals: emisId, mode: 'insensitive' } }, select: { id: true } }); if (duplicate) throw new ConflictException('That EMIS ID is already assigned to another account.'); }
    if (studentId) { const duplicate = await this.prisma.user.findFirst({ where: { id: { not: id }, userId: { equals: studentId, mode: 'insensitive' } }, select: { id: true } }); if (duplicate) throw new ConflictException('That student ID is already assigned to another account.'); }
    const userData: any = { ...(email && email !== target.email ? { email } : {}), ...(target.role === Role.STUDENT && input.emisId !== undefined ? { emisId: emisId?.toUpperCase() || null } : {}), ...(target.role === Role.STUDENT && input.userId !== undefined ? { userId: studentId?.toUpperCase() || null } : {}) };
    if (input.password) {
      userData.password = await bcrypt.hash(input.password, 10);
      userData.tokenVersion = { increment: 1 };
    }
    try { await this.prisma.$transaction(async tx => {
      if (Object.keys(userData).length) await tx.user.update({ where: { id }, data: userData });
      if (input.password) await tx.authSession.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      if (target.role === Role.STUDENT) {
        await tx.studentProfile.update({ where: { userId: id }, data: { ...(firstName !== undefined ? { firstName } : {}), ...(lastName !== undefined ? { lastName } : {}), ...(input.grade !== undefined ? { grade: input.grade.trim() || null } : {}), ...(input.section !== undefined ? { section: input.section.trim() || null } : {}), ...(input.rollNo !== undefined ? { rollNo: input.rollNo.trim() || null } : {}), ...(input.dob !== undefined ? { dob: input.dob ? new Date(input.dob) : null } : {}), ...(input.dobBs !== undefined ? { dobBs: input.dobBs.trim() || null } : {}), ...(input.admissionDate !== undefined ? { admissionDate: input.admissionDate ? new Date(input.admissionDate) : null } : {}), ...(input.gender !== undefined ? { gender: input.gender.trim() || null } : {}), ...(input.bloodGroup !== undefined ? { bloodGroup: input.bloodGroup.trim() || null } : {}), ...(input.phone !== undefined ? { phone: input.phone.trim() || null } : {}), ...(input.address !== undefined ? { address: input.address.trim() || null } : {}), ...(input.temporaryAddress !== undefined ? { temporaryAddress: input.temporaryAddress.trim() || null } : {}), ...(input.fatherName !== undefined ? { fatherName: input.fatherName.trim() || null } : {}), ...(input.fatherPhone !== undefined ? { fatherPhone: input.fatherPhone.trim() || null } : {}), ...(input.motherName !== undefined ? { motherName: input.motherName.trim() || null } : {}), ...(input.motherPhone !== undefined ? { motherPhone: input.motherPhone.trim() || null } : {}) } });
      } else if (target.role === Role.TEACHER) {
        await tx.teacherProfile.update({ where: { userId: id }, data: { ...(firstName !== undefined ? { firstName } : {}), ...(lastName !== undefined ? { lastName } : {}), ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}) } });
      } else if (target.role === Role.ADMIN || target.role === Role.SUPER_ADMIN) {
        await tx.adminProfile.update({ where: { userId: id }, data: { ...(firstName !== undefined ? { firstName } : {}), ...(lastName !== undefined ? { lastName } : {}), ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}), ...(input.department !== undefined ? { department: input.department.trim() || null } : {}) } });
      } else if (firstName !== undefined || lastName !== undefined || input.grade !== undefined || input.section !== undefined || input.rollNo !== undefined || input.department !== undefined) {
        throw new BadRequestException('This account has no editable profile fields.');
      }
    }); } catch (error: any) { if (error?.code === 'P2002') throw new ConflictException('Email, EMIS ID, or student ID is already assigned to another account.'); throw error; }
    void this.audit.record({ action: 'USER_UPDATED', entity: 'User', entityId: id, userId: actor.actorId, schoolId: actor.schoolId, details: { fields: Object.keys(input).filter(field => field !== 'email' || email !== target.email) } });
    return this.getManagedUser(id, actor);
  }

  async setManagedUserStatus(id: string, active: boolean, actor: { actorId: string; schoolId: string; actorRole: Role }) {
    if (id === actor.actorId) throw new BadRequestException('You cannot disable your own account.');
    const target = await this.getManagedTarget(id, actor);
    if ((active && target.status === 'ACTIVE') || (!active && target.status === 'DISABLED')) return { id: target.id, status: target.status };
    const status = active ? 'ACTIVE' : 'DISABLED';
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: target.id }, data: { status, disabledAt: active ? null : new Date(), tokenVersion: { increment: 1 } } }),
      ...(active ? [] : [this.prisma.authSession.updateMany({ where: { userId: target.id, revokedAt: null }, data: { revokedAt: new Date() } })]),
    ]);
    void this.audit.record({ action: active ? 'USER_RESTORED' : 'USER_DISABLED', entity: 'User', entityId: target.id, userId: actor.actorId, schoolId: actor.schoolId, details: { previousStatus: target.status, status } });
    return { id: target.id, status };
  }

  async getOwnProfile(userId: string) {
    const [user] = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
      SELECT u."id", u."email", u."role"::text AS "role", u."userId" AS "studentId", u."emisId", s."name" AS "schoolName",
             (u."profilePicture" IS NOT NULL OR u."profilePictureUrl" IS NOT NULL) AS "hasProfilePicture"
      FROM "User" u JOIN "School" s ON s."id" = u."schoolId" WHERE u."id" = ${userId} LIMIT 1
    `);
    if (!user) throw new NotFoundException('User not found');
    const { hasProfilePicture, ...userDetails } = user;
    const profilePictureUrl = hasProfilePicture ? '/users/me/photo' : null;
    if (user.role === 'STUDENT') {
      const [profile] = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`
        SELECT "firstName", "lastName", "grade", "section", "dob", "dobBs", "rollNo", "phone", "gender", "bloodGroup", "address", "temporaryAddress", "admissionDate", "fatherName", "fatherPhone", "motherName", "motherPhone"
        FROM "StudentProfile" WHERE "userId" = ${userId} LIMIT 1
      `);
      if (!profile) return { ...userDetails, profilePictureUrl };
      return { ...userDetails, ...profile, profilePictureUrl };
    }
    if (user.role === 'TEACHER') {
      const [profile] = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`SELECT "firstName", "lastName", "phone", "subjects" FROM "TeacherProfile" WHERE "userId" = ${userId} LIMIT 1`);
      if (!profile) return { ...userDetails, profilePictureUrl };
      return { ...userDetails, ...profile, profilePictureUrl };
    }
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      const [profile] = await this.prisma.$queryRaw<Array<Record<string, any>>>(Prisma.sql`SELECT "firstName", "lastName", "phone", "department" FROM "AdminProfile" WHERE "userId" = ${userId} LIMIT 1`);
      if (!profile) return { ...userDetails, profilePictureUrl };
      return { ...userDetails, ...profile, profilePictureUrl };
    }
    return { ...userDetails, profilePictureUrl };
  }

  async updateOwnProfile(userId: string, input: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, schoolId: true, studentProfile: { select: { userId: true } }, teacherProfile: { select: { userId: true } }, adminProfile: { select: { userId: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'STUDENT') throw new ForbiddenException('Students cannot edit their own profile. Please contact an admin.');
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
    const fields: { firstName?: string; lastName?: string; phone?: string } = {};
    if (values.firstName !== undefined) fields.firstName = values.firstName;
    if (values.lastName !== undefined) fields.lastName = values.lastName;
    if (values.phone !== undefined) fields.phone = values.phone;
    if (user.role === 'TEACHER' && user.teacherProfile) {
      if ((['studentId', 'gender', 'address', 'parentName', 'parentPhone'] as const).some(key => input[key] !== undefined)) throw new BadRequestException('These details are only available for student profiles');
      if (input.dob !== undefined) throw new BadRequestException('Only students can update date of birth');
      if (Object.keys(fields).length) await this.prisma.teacherProfile.update({ where: { userId }, data: fields });
    } else if ((user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && user.adminProfile) {
      if ((['studentId', 'gender', 'address', 'parentName', 'parentPhone'] as const).some(key => input[key] !== undefined)) throw new BadRequestException('These details are only available for student profiles');
      if (input.dob !== undefined) throw new BadRequestException('Date of birth cannot be updated for this account');
      if (Object.keys(fields).length) await this.prisma.adminProfile.update({ where: { userId }, data: fields });
    } else if (Object.values(values).some(value => value !== email) || input.dob !== undefined) {
      throw new BadRequestException('This account has no editable profile');
    }
    if (email && email !== current?.email) await this.prisma.user.update({ where: { id: userId }, data: { email } });
    const updatedProfile = await this.getOwnProfile(userId);
    void this.audit.record({ action: 'PROFILE_UPDATED', entity: 'User', entityId: userId, userId, schoolId: user.schoolId });
    return updatedProfile;
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

  async resetManagedUserPassword(id: string, newPassword: unknown, actor: { actorId: string; schoolId: string; actorRole: Role }) {
    if (typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128) {
      throw new BadRequestException('A new password of at least 8 characters is required');
    }
    const target = await this.getManagedTarget(id, actor);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id }, data: { password: passwordHash, tokenVersion: { increment: 1 } } }),
      this.prisma.authSession.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    void this.audit.record({ action: 'USER_PASSWORD_RESET', entity: 'User', entityId: id, userId: actor.actorId, schoolId: actor.schoolId });
    return { success: true, message: 'Password has been reset successfully' };
  }

  async getUserCounts(schoolId: string) {
    const counts = await this.prisma.user.groupBy({
      by: ['role'],
      where: { schoolId },
      _count: { id: true },
    });
    
    let teacherCount = 0;
    let studentCount = 0;
    let adminCount = 0;

    counts.forEach(c => {
      if (c.role === 'TEACHER') teacherCount = c._count.id;
      else if (c.role === 'STUDENT') studentCount = c._count.id;
      else if (c.role === 'ADMIN' || c.role === 'SUPER_ADMIN') adminCount += c._count.id;
    });

    return { teacherCount, studentCount, adminCount };
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
    return this.persistProfilePhoto(userId, file, userId);
  }

  async updateManagedProfilePhoto(userId: string, file: { buffer: Buffer; mimetype: string }, actor: { actorId: string; schoolId: string; actorRole: Role }) {
    await this.getManagedTarget(userId, actor);
    return this.persistProfilePhoto(userId, file, actor.actorId);
  }

  async getManagedProfilePhoto(userId: string, actor: { schoolId: string; actorRole: Role }) {
    await this.getManagedTarget(userId, actor);
    return this.getProfilePhoto(userId);
  }

  private async persistProfilePhoto(userId: string, file: { buffer: Buffer; mimetype: string }, auditActorId: string) {
    const owner = await this.prisma.user.findUnique({ where: { id: userId }, select: { schoolId: true } });
    if (!owner) throw new NotFoundException('User not found');
    if (this.cloudinary.isConfigured()) {
      const uploaded = await this.cloudinary.upload(file.buffer, { folder: 'eskool/profile-photos', resourceType: 'image' });
      await this.prisma.$executeRaw(Prisma.sql`
        UPDATE "User" SET "profilePicture" = NULL, "profilePictureMimeType" = ${file.mimetype}, "profilePictureUrl" = ${uploaded.secure_url}, "profilePicturePublicId" = ${uploaded.public_id}
        WHERE "id" = ${userId}
      `);
      void this.audit.record({ action: 'PROFILE_PHOTO_UPDATED', entity: 'User', entityId: userId, userId: auditActorId, schoolId: owner.schoolId });
      return { success: true, profilePictureUrl: `/users/admin/users/${userId}/photo`, storage: 'cloudinary' };
    }
    const updated = await this.prisma.$executeRaw(Prisma.sql`
      UPDATE "User" SET "profilePicture" = ${file.buffer}, "profilePictureMimeType" = ${file.mimetype}
      WHERE "id" = ${userId}
    `);
    if (!updated) throw new NotFoundException('User not found');
    void this.audit.record({ action: 'PROFILE_PHOTO_UPDATED', entity: 'User', entityId: userId, userId: auditActorId, schoolId: owner.schoolId });
    return { success: true, profilePictureUrl: `/users/admin/users/${userId}/photo` };
  }
}
