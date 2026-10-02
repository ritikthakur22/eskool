import { Injectable } from '@nestjs/common';
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
