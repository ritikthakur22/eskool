import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { requestContext } from '../context/context.js';
import { Cron, CronExpression } from '@nestjs/schedule';

export type AuditEvent = {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  schoolId?: string;
  details?: Prisma.InputJsonObject;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

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
        ipAddress: true,
        userAgent: true,
        requestId: true,
        createdAt: true,
        user: { select: { email: true, role: true } },
      },
    });
    return { items: rows.slice(0, limit), hasMore: rows.length > limit, nextOffset: rows.length > limit ? offset + limit : null };
  }

  async getFailures() {
    return this.prisma.auditOutbox.findMany({
      where: { status: 'FAILED' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async exportLogs(schoolId: string, format: 'json' | 'csv') {
    const logs = await this.prisma.auditLog.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        userId: true,
        details: true,
        ipAddress: true,
        userAgent: true,
        requestId: true,
        createdAt: true,
      },
    });
    
    if (format === 'csv') {
      const header = 'id,action,entity,entityId,userId,ipAddress,userAgent,requestId,createdAt\n';
      const rows = logs.map(log => 
        `${log.id},${log.action},${log.entity},${log.entityId || ''},${log.userId || ''},${log.ipAddress || ''},"${log.userAgent?.replace(/"/g, '""') || ''}",${log.requestId || ''},${log.createdAt.toISOString()}`
      ).join('\n');
      return header + rows;
    }
    
    return logs;
  }

  async record(event: AuditEvent, tx?: any) {
    const ctx = requestContext.getStore();
    const payload = {
      action: event.action,
      entity: event.entity,
      entityId: event.entityId,
      userId: event.userId,
      schoolId: event.schoolId,
      details: event.details,
      ipAddress: event.ipAddress || ctx?.ipAddress,
      userAgent: event.userAgent || ctx?.userAgent,
      requestId: event.requestId || ctx?.requestId,
    };

    try {
      const client = tx || this.prisma;
      await client.auditOutbox.create({
        data: {
          payload,
          status: 'PENDING',
        },
      });
    } catch (error) {
      this.logger.error('audit_outbox_write_failed', error);
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processOutbox() {
    const pending = await this.prisma.auditOutbox.findMany({
      where: { status: 'PENDING' },
      take: 100,
      orderBy: { createdAt: 'asc' },
    });

    for (const record of pending) {
      try {
        const payload: any = record.payload;
        await this.prisma.auditLog.create({
          data: {
            action: payload.action,
            entity: payload.entity,
            entityId: payload.entityId,
            userId: payload.userId,
            schoolId: payload.schoolId,
            details: payload.details,
            ipAddress: payload.ipAddress,
            userAgent: payload.userAgent,
            requestId: payload.requestId,
            createdAt: record.createdAt,
          },
        });
        await this.prisma.auditOutbox.update({
          where: { id: record.id },
          data: { status: 'PROCESSED' },
        });
      } catch (error: any) {
        this.logger.error(`Failed to process audit outbox ${record.id}`, error);
        await this.prisma.auditOutbox.update({
          where: { id: record.id },
          data: { status: 'FAILED', error: error.message },
        });
      }
    }
  }
}
