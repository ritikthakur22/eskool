import { Controller, Post, Body, UseGuards, BadRequestException, ForbiddenException, Request } from '@nestjs/common';
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
