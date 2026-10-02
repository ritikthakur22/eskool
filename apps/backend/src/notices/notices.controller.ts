import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { NoticesService } from './notices.service.js';
import { CreateNoticeDto, UpdateNoticeDto } from './dto/notice.dto.js';
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
  async createNotice(@Body() data: CreateNoticeDto, @Request() req: any) {
    return this.noticesService.createNotice(data, req.user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  updateNotice(@Param('id', new ParseUUIDPipe()) id: string, @Body() data: UpdateNoticeDto, @Request() req: any) {
    return this.noticesService.updateNotice(id, data, req.user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  deleteNotice(@Param('id', new ParseUUIDPipe()) id: string, @Request() req: any) {
    return this.noticesService.deleteNotice(id, req.user);
  }

  @Get()
  async getAllNotices(@Query('category') category?: string, @Query('limit') limit?: string, @Request() req?: any) {
    const parsedLimit = Number.parseInt(limit || '', 10);
    const take = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 50) : 20;
    return this.noticesService.getAllNotices(category, take, req.user);
  }

  @Get(':id')
  async getNoticeById(@Param('id') id: string, @Request() req: any) {
    return this.noticesService.getNoticeById(id, req.user);
  }
}
