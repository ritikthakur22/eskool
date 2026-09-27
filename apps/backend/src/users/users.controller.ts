import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service.js';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // TODO: Add AdminGuard here to protect this route
  @Post('admin/create-user')
  async createUser(@Body() data: any) {
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.create({
      email: data.email,
      password: hashedPassword,
      role: data.role || Role.STUDENT,
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
