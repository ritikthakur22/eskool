import { Controller, Post, Body, UseGuards, BadRequestException, ForbiddenException, Request, Get, Patch, UploadedFile, UseInterceptors, Header, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service.js';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { assertFileSignature } from '../storage/file-validation.js';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
  updateOwnProfile(@Body() data: any, @Request() req: any) {
    return this.usersService.updateOwnProfile(req.user.id, data);
  }

  @Patch('me/password')
  changeOwnPassword(@Body() data: any, @Request() req: any) {
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

  @Post('admin/create-user')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async createUser(@Body() data: any, @Request() req: any) {
    const creatorRole = req.user.role;
    const targetRole = data.role || Role.STUDENT;
    if (!Object.values(Role).includes(targetRole)) throw new BadRequestException('Invalid user role.');
    if (typeof data.email !== 'string' || !data.email.trim() || typeof data.password !== 'string' || data.password.length < 8 || data.password.length > 128) {
      throw new BadRequestException('A valid email and password of 8–128 characters are required.');
    }

    // RBAC Hierarchy Enforcement
    if (creatorRole === Role.TEACHER && (targetRole === Role.ADMIN || targetRole === Role.SUPER_ADMIN || targetRole === Role.TEACHER)) {
      throw new ForbiddenException('Teachers can only create Students or Parents.');
    }
    if (creatorRole === Role.ADMIN && targetRole === Role.SUPER_ADMIN) {
      throw new ForbiddenException('Admins cannot create Super Admins.');
    }

    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const schoolId = creatorRole === Role.SUPER_ADMIN && typeof data.schoolId === 'string' ? data.schoolId : req.user.schoolId;
    const user = await this.usersService.create({
      email: data.email.trim().toLowerCase(),
      password: hashedPassword,
      role: targetRole,
      school: { connect: { id: schoolId } },
      ...(targetRole === Role.STUDENT ? { studentProfile: { create: { firstName: data.firstName || 'New', lastName: data.lastName || 'Student', grade: data.grade, section: data.section, rollNo: data.rollNo } } } : {}),
      ...(targetRole === Role.TEACHER ? { teacherProfile: { create: { firstName: data.firstName || 'New', lastName: data.lastName || 'Teacher', subjects: Array.isArray(data.subjects) ? data.subjects.filter((subject: unknown): subject is string => typeof subject === 'string').slice(0, 20) : [] } } } : {}),
      ...([Role.ADMIN, Role.SUPER_ADMIN].includes(targetRole) ? { adminProfile: { create: { firstName: data.firstName || 'New', lastName: data.lastName || 'Admin', department: data.department } } } : {}),
    });

    const { password: _password, ...result } = user;
    return result;
  }
}
