import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Notice } from '@prisma/client';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  async createNotice(data: Prisma.NoticeUncheckedCreateInput, actor: { id: string }): Promise<Notice> {
    return this.prisma.notice.create({ data: { title: data.title, content: data.content, category: data.category, date: data.date, authorId: actor.id } });
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
