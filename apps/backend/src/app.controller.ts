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
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'googleSubject')
          AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'profilePictureUrl')
          AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'tokenVersion') AS "userReady",
          EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AuthSession') AS "sessionsReady",
          EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AuditLog') AS "auditReady"
      `;
      if (!schema?.userReady || !schema.sessionsReady || !schema.auditReady) throw new Error('required database schema is missing');
      return { status: 'ok', database: 'ok', schema: 'ok' };
    } catch {
      throw new ServiceUnavailableException('The school database schema is not ready.');
    }
  }
}
