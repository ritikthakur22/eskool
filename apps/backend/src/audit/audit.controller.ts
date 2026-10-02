import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuditService } from './audit.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  getLogs(@Query('limit') limit: string | undefined, @Query('offset') offset: string | undefined, @Query('action') action: string | undefined, @Query('entity') entity: string | undefined, @Query('userId') userId: string | undefined, @Query('from') from: string | undefined, @Query('to') to: string | undefined, @Request() req: any) {
    const parsedLimit = Number.parseInt(limit || '', 10);
    const parsedOffset = Number.parseInt(offset || '', 10);
    return this.audit.list(req.user.schoolId, { limit: Number.isInteger(parsedLimit) ? parsedLimit : 100, offset: Number.isInteger(parsedOffset) ? parsedOffset : 0, action, entity, userId, from, to });
  }

  @Get('export')
  async exportLogs(@Query('format') format: string, @Request() req: any) {
    const fmt = format === 'csv' ? 'csv' : 'json';
    return this.audit.exportLogs(req.user.schoolId, fmt);
  }

  @Get('failures')
  async getFailures() {
    return this.audit.getFailures();
  }
}
