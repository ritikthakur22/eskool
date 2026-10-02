import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export type AuditEvent = {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  schoolId?: string;
  details?: Prisma.InputJsonObject;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async list(schoolId: string, filters: { limit?: number; offset?: number; action?: string; entity?: string; userId?: string; from?: string; to?: string } = {}) {
    const limit = Math.min(Math.max(filters.limit ?? 100, 1), 100);
    const offset = Math.max(filters.offset ?? 0, 0);
    const from = filters.from ? new Date(filters.from) : undefined;
    const to = filters.to ? new Date(filters.to) : undefined;
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) throw new BadRequestException('Audit date filters must be valid ISO dates.');
    const where: Prisma.AuditLogWhereInput = {
      schoolId,
      ...(filters.action?.trim() ? { action: filters.action.trim().slice(0, 100) } : {}),
      ...(filters.entity?.trim() ? { entity: filters.entity.trim().slice(0, 100) } : {}),
      ...(filters.userId?.trim() ? { userId: filters.userId.trim() } : {}),
      ...((from || to) ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    };
    const rows = await this.prisma.auditLog.findMany({
      where,
      skip: offset,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        userId: true,
        details: true,
        createdAt: true,
        user: { select: { email: true, role: true } },
      },
    });
    return { items: rows.slice(0, limit), hasMore: rows.length > limit, nextOffset: rows.length > limit ? offset + limit : null };
  }

  async record(event: AuditEvent) {
    // Audit failures must not turn a successful user operation into a 500, but
    // they are still visible to operators for alerting and repair.
    try {
      await this.prisma.auditLog.create({
        data: {
          action: event.action,
          entity: event.entity,
          entityId: event.entityId,
          userId: event.userId,
          schoolId: event.schoolId,
          details: event.details,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
        },
      });
    } catch (error) {
      console.error('audit_log_write_failed', error);
    }
  }
}
