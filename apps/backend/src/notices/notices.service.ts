import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Notice } from '@prisma/client';
import { CreateNoticeDto } from './dto/notice.dto.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService, private readonly audit: AuditService) {}

  async createNotice(data: CreateNoticeDto, actor: { id: string; schoolId: string }): Promise<Notice> {
    const dateObj = data.date ? new Date(data.date) : new Date();
    const notice = await this.prisma.notice.create({ data: { title: data.title, content: data.content, category: data.category, date: dateObj, authorId: actor.id, schoolId: actor.schoolId } });
    void this.audit.record({ action: 'NOTICE_CREATED', entity: 'Notice', entityId: notice.id, userId: actor.id, schoolId: actor.schoolId });
    return notice;
  }

  async getAllNotices(category?: string, limit?: number, actor?: { schoolId: string }): Promise<Notice[]> {
    const where: Prisma.NoticeWhereInput = { ...(category ? { category } : {}), ...(actor ? { author: { schoolId: actor.schoolId } } : {}) };
    return this.prisma.notice.findMany({
      where,
      ...(limit ? { take: limit } : {}),
      orderBy: { date: 'desc' },
      include: {
        author: {
          select: {
            adminProfile: { select: { firstName: true, lastName: true } },
            teacherProfile: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });
  }

  async getNoticeById(id: string, actor: { schoolId: string }): Promise<Notice> {
    const notice = await this.prisma.notice.findFirst({ where: { id, author: { schoolId: actor.schoolId } } });
    if (!notice) throw new NotFoundException('Notice not found.');
    return notice;
  }
}
