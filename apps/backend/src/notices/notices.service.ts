import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Notice } from '@prisma/client';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  async createNotice(data: Prisma.NoticeUncheckedCreateInput): Promise<Notice> {
    return this.prisma.notice.create({ data });
  }

  async getAllNotices(category?: string, limit?: number): Promise<Notice[]> {
    const where = category ? { category } : {};
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

  async getNoticeById(id: string): Promise<Notice | null> {
    return this.prisma.notice.findUnique({ where: { id } });
  }
}
