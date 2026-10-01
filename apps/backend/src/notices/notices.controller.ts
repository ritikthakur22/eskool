import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NoticesService } from './notices.service.js';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('notices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  async createNotice(@Body() data: Prisma.NoticeUncheckedCreateInput, @Request() req: any) {
    return this.noticesService.createNotice(data, req.user);
  }

  @Get()
  async getAllNotices(@Query('category') category?: string, @Query('limit') limit?: string, @Request() req?: any) {
    const parsedLimit = Number.parseInt(limit || '', 10);
    const take = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 50) : undefined;
    return this.noticesService.getAllNotices(category, take, req.user);
  }

  @Get(':id')
  async getNoticeById(@Param('id') id: string, @Request() req: any) {
    return this.noticesService.getNoticeById(id, req.user);
  }
}
