import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { NoticesService } from './notices.service.js';
import { Prisma } from '@prisma/client';

@Controller('notices')
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Post()
  async createNotice(@Body() data: Prisma.NoticeUncheckedCreateInput) {
    return this.noticesService.createNotice(data);
  }

  @Get()
  async getAllNotices(@Query('category') category?: string) {
    return this.noticesService.getAllNotices(category);
  }

  @Get(':id')
  async getNoticeById(@Param('id') id: string) {
    return this.noticesService.getNoticeById(id);
  }
}
