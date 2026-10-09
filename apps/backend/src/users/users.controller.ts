import { Controller, Post, Body, UseGuards, BadRequestException, ForbiddenException, Request, Get, Patch, UploadedFile, UseInterceptors, Header, StreamableFile, Query, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service.js';
import * as bcrypt from 'bcryptjs';
import { Prisma, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { assertFileSignature } from '../storage/file-validation.js';
import { ChangePasswordDto, CreateUserDto, UpdateManagedUserDto, UpdateProfileDto } from './dto/user.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { canCreateRole } from './users.policy.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService, private readonly audit: AuditService) {}

  
  @Get('stats/counts')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async getUserCounts(@Request() req: any) {
    return this.usersService.getUserCounts(req.user.schoolId);
  }

  @Get('me')
  getOwnProfile(@Request() req: any) {
    return this.usersService.getOwnProfile(req.user.id);
  }

  @Get('me/photo')
  @Header('Cache-Control', 'private, no-store')
  async getOwnProfilePhoto(@Request() req: any) {
    const photo = await this.usersService.getProfilePhoto(req.user.id);
    return new StreamableFile(photo.buffer, { type: photo.mimeType, length: photo.buffer.length });
  }

  @Patch('me')
  updateOwnProfile(@Body() data: UpdateProfileDto, @Request() req: any) {
    return this.usersService.updateOwnProfile(req.user.id, data);
  }

  @Patch('me/password')
  changeOwnPassword(@Body() data: ChangePasswordDto, @Request() req: any) {
    return this.usersService.changeOwnPassword(req.user.id, data.currentPassword, data.newPassword);
  }

  @Post('me/photo')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, callback) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
        callback(new BadRequestException('Choose a JPG, PNG, or WEBP profile photo.'), false);
        return;
      }
      callback(null, true);
    },
  }))
  updateProfilePhoto(@UploadedFile() file: { buffer: Buffer; mimetype: string } | undefined, @Request() req: any) {
    if (!file) throw new BadRequestException('Choose a profile photo to upload.');
    assertFileSignature(file);
    return this.usersService.updateProfilePhoto(req.user.id, file);
  }

  @Get('admin/users')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  listManagedUsers(@Query('role') role: string | undefined, @Query('status') status: string | undefined, @Query('q') query: string | undefined, @Query('limit') limit: string | undefined, @Query('offset') offset: string | undefined, @Request() req: any) {
    return this.usersService.listManagedUsers({ schoolId: req.user.schoolId, actorRole: req.user.role as Role, role, status, query, ...(limit !== undefined ? { limit: Number(limit) } : {}), ...(offset !== undefined ? { offset: Number(offset) } : {}) });
  }

  @Get('admin/users/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  getManagedUser(@Param('id') id: string, @Request() req: any) {
    return this.usersService.getManagedUser(id, { schoolId: req.user.schoolId, actorRole: req.user.role as Role });
  }

  @Patch('admin/users/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  updateManagedUser(@Param('id') id: string, @Body() data: UpdateManagedUserDto, @Request() req: any) {
    return this.usersService.updateManagedUser(id, data, { actorId: req.user.id, schoolId: req.user.schoolId, actorRole: req.user.role as Role });
  }

  @Post('admin/users/:id/photo')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, callback) => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
        callback(new BadRequestException('Choose a JPG, PNG, or WEBP profile photo.'), false);
        return;
      }
      callback(null, true);
    },
  }))
  async updateManagedUserPhoto(@Param('id') id: string, @UploadedFile() file: { buffer: Buffer; mimetype: string } | undefined, @Request() req: any) {
    if (!file) throw new BadRequestException('Choose a profile photo to upload.');
    assertFileSignature(file);
    const actorRole = req.user.role as Role;
    const target = await this.usersService.getManagedUser(id, { schoolId: req.user.schoolId, actorRole });
    if (!target) throw new BadRequestException('User not found.');
    return this.usersService.updateProfilePhoto(id, file);
  }

  @Get('admin/users/:id/photo')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Header('Cache-Control', 'private, max-age=300')
  async getManagedUserPhoto(@Param('id') id: string, @Request() req: any) {
    const target = await this.usersService.getManagedUser(id, { schoolId: req.user.schoolId, actorRole: req.user.role as Role });
    if (!target) throw new BadRequestException('User not found.');
    const photo = await this.usersService.getProfilePhoto(id);
    return new StreamableFile(photo.buffer, { type: photo.mimeType, length: photo.buffer.length });
  }

  @Post('admin/users/:id/disable')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  disableManagedUser(@Param('id') id: string, @Request() req: any) {
    return this.usersService.setManagedUserStatus(id, false, { actorId: req.user.id, schoolId: req.user.schoolId, actorRole: req.user.role as Role });
  }

  @Post('admin/users/:id/restore')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  restoreManagedUser(@Param('id') id: string, @Request() req: any) {
    return this.usersService.setManagedUserStatus(id, true, { actorId: req.user.id, schoolId: req.user.schoolId, actorRole: req.user.role as Role });
  }

  @Post('admin/create-user')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async createUser(@Body() data: CreateUserDto, @Request() req: any) {
    const creatorRole = req.user.role as Role;
    const targetRole = data.role || Role.STUDENT;
    if (!Object.values(Role).includes(targetRole)) throw new BadRequestException('Invalid user role.');
    if (typeof data.email !== 'string' || !data.email.trim() || typeof data.password !== 'string' || data.password.length < 8 || data.password.length > 128) {
      throw new BadRequestException('A valid email and password of 8–128 characters are required.');
    }
    if (targetRole === Role.STUDENT && !data.emisId?.trim()) throw new BadRequestException('A unique EMIS ID is required for every student account.');
    if (!data.firstName?.trim() || !data.lastName?.trim()) throw new BadRequestException('First and last name are required for a new account.');
    if (targetRole === Role.STUDENT) {
      const fatherName = data.fatherName?.trim() || ''; const fatherPhone = data.fatherPhone?.trim() || '';
      const motherName = data.motherName?.trim() || ''; const motherPhone = data.motherPhone?.trim() || '';
      if (Boolean(fatherName) !== Boolean(fatherPhone) || Boolean(motherName) !== Boolean(motherPhone) || !((fatherName && fatherPhone) || (motherName && motherPhone))) {
        throw new BadRequestException('Add a parent or guardian name and phone number.');
      }
    }
    if (data.emisId?.trim() && await this.usersService.findByEmisId(data.emisId.trim())) throw new BadRequestException('That EMIS ID is already assigned to another account.');
    if (data.userId?.trim() && await this.usersService.findByStudentId(data.userId.trim())) throw new BadRequestException('That student ID is already assigned to another account.');

    // RBAC hierarchy: admins manage operational accounts; only the platform
    // owner can manage admins. Super-admin creation is deliberately excluded
    // from the ordinary API and must use a separate bootstrap process.
    if (!canCreateRole(creatorRole, targetRole)) {
      throw new ForbiddenException('You do not have permission to create this account type.');
    }

    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const schoolId = creatorRole === Role.SUPER_ADMIN && typeof data.schoolId === 'string' ? data.schoolId : req.user.schoolId;
    const createUserData: Prisma.UserCreateInput = {
      email: data.email.trim().toLowerCase(),
      password: hashedPassword,
      role: targetRole,
      school: { connect: { id: schoolId } },
      ...(targetRole === Role.STUDENT ? {
        emisId: data.emisId!.trim().toUpperCase(),
        userId: data.userId?.trim().toUpperCase() || undefined,
        studentProfile: { create: {
          firstName: data.firstName!.trim(), lastName: data.lastName!.trim(), grade: data.grade?.trim() || null,
          section: data.section?.trim() ? (/^(?:[a-z]|\d+\s*[-_]?\s*[a-z]|[a-z]\s*[-_]?\s*\d+)$/i.test(data.section.trim()) ? data.section.trim().replace(/[a-z]/gi, letter => letter.toUpperCase()) : data.section.trim()) : null,
          rollNo: data.rollNo?.trim() || null, dob: data.dob ? new Date(data.dob) : null, dobBs: data.dobBs?.trim() || null,
          phone: data.phone?.trim() || null, gender: data.gender?.trim() || null, bloodGroup: data.bloodGroup?.trim() || null,
          address: data.address?.trim() || null, temporaryAddress: data.temporaryAddress?.trim() || null,
          admissionDate: data.admissionDate ? new Date(data.admissionDate) : null, fatherName: data.fatherName?.trim() || null,
          fatherPhone: data.fatherPhone?.trim() || null, motherName: data.motherName?.trim() || null, motherPhone: data.motherPhone?.trim() || null,
        } },
      } : {}),
      ...(targetRole === Role.TEACHER ? { teacherProfile: { create: { firstName: data.firstName || 'New', lastName: data.lastName || 'Teacher', subjects: Array.isArray(data.subjects) ? data.subjects.filter((subject: unknown): subject is string => typeof subject === 'string').slice(0, 20) : [] } } } : {}),
      ...(([Role.ADMIN, Role.SUPER_ADMIN] as Role[]).includes(targetRole) ? { adminProfile: { create: { firstName: data.firstName.trim(), lastName: data.lastName.trim(), department: data.department?.trim() || null } } } : {}),
    };
    const user = targetRole === Role.PARENT
      ? await this.usersService.createWithParentProfile(createUserData, {
          firstName: data.firstName.trim(), lastName: data.lastName.trim(), phone: data.phone?.trim() || data.parentPhone?.trim(),
          address: data.address?.trim() || data.parentAddress?.trim(), relationship: data.relationship?.trim(),
        })
      : await this.usersService.create(createUserData);

    const { password: _password, ...result } = user;
    void this.audit.record({ action: 'USER_CREATED', entity: 'User', entityId: user.id, userId: req.user.id, schoolId: schoolId, details: { role: targetRole } });
    return result;
  }
}
