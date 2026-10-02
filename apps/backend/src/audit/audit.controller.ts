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
  getLogs(@Query('limit') limit: string | undefined, @Request() req: any) {
    const parsed = Number.parseInt(limit || '', 10);
    return this.audit.list(req.user.schoolId, Number.isInteger(parsed) ? parsed : 100);
  }
}
