import { Controller, Post, Body, UseGuards, BadRequestException, ForbiddenException, Request, Get, Patch, UploadedFile, UseInterceptors, Header, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service.js';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

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
    return this.usersService.updateProfilePhoto(req.user.id, file);
  }

  @Post('admin/create-user')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  async createUser(@Body() data: any, @Request() req: any) {
    const creatorRole = req.user.role;
    const targetRole = data.role || Role.STUDENT;

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
    const user = await this.usersService.create({
      email: data.email,
      password: hashedPassword,
      role: targetRole,
      school: {
        connectOrCreate: {
          where: { id: data.schoolId || 'default-school-id' },
          create: {
            id: data.schoolId || 'default-school-id',
            name: 'Default School'
          }
        }
      }
    });

    const { password, ...result } = user;
    return result;
  }
}
