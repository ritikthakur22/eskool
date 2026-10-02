import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly prisma: PrismaService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'ok' };
    } catch {
      throw new ServiceUnavailableException('The school database is unavailable.');
    }
  }

  @Get('ready')
  async getReadiness() {
    try {
      const [schema] = await this.prisma.$queryRaw<Array<{ userReady: boolean; sessionsReady: boolean; auditReady: boolean }>>`
        SELECT
          to_regclass('"User"') IS NOT NULL
          AND EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = to_regclass('"User"') AND attname = 'googleSubject' AND NOT attisdropped)
          AND EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = to_regclass('"User"') AND attname = 'profilePictureUrl' AND NOT attisdropped)
          AND EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = to_regclass('"User"') AND attname = 'tokenVersion' AND NOT attisdropped) AS "userReady",
          to_regclass('"AuthSession"') IS NOT NULL AS "sessionsReady",
          to_regclass('"AuditLog"') IS NOT NULL AS "auditReady"
      `;
      if (!schema?.userReady || !schema.sessionsReady || !schema.auditReady) throw new Error('required database schema is missing');
      return { status: 'ok', database: 'ok', schema: 'ok' };
    } catch {
      throw new ServiceUnavailableException('The school database schema is not ready.');
    }
  }
}
