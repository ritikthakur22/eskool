import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Notice, Role } from '@prisma/client';
import { CreateNoticeDto, UpdateNoticeDto } from './dto/notice.dto.js';
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

  async getAllNotices(category?: string, limit = 20, actor?: { schoolId: string }): Promise<Notice[]> {
    const where: Prisma.NoticeWhereInput = { ...(category ? { category } : {}), ...(actor ? { author: { schoolId: actor.schoolId } } : {}) };
    return this.prisma.notice.findMany({
      where,
      take: Math.min(Math.max(limit, 1), 50),
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

  async updateNotice(id: string, data: UpdateNoticeDto, actor: { id: string; schoolId: string; role: Role }) {
    const existing = await this.prisma.notice.findFirst({ where: { id, schoolId: actor.schoolId }, select: { id: true, authorId: true, title: true, content: true, category: true, date: true } });
    if (!existing) throw new NotFoundException('Notice not found in your school.');
    if (actor.role === Role.TEACHER && existing.authorId !== actor.id) throw new NotFoundException('Notice not found.');
    const updated = await this.prisma.notice.update({ where: { id: existing.id }, data: {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.content !== undefined ? { content: data.content.trim() } : {}),
      ...(data.category !== undefined ? { category: data.category.trim() } : {}),
      ...(data.date !== undefined ? { date: new Date(data.date) } : {}),
    } });
    void this.audit.record({ action: 'NOTICE_UPDATED', entity: 'Notice', entityId: existing.id, userId: actor.id, schoolId: actor.schoolId, details: {
      before: { title: existing.title, content: existing.content, category: existing.category, date: existing.date.toISOString() },
      after: { title: updated.title, content: updated.content, category: updated.category, date: updated.date.toISOString() },
    } });
    return updated;
  }
}
