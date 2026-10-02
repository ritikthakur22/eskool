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
      await this.prisma.$queryRaw`
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'User'
          AND column_name IN ('googleSubject', 'profilePictureUrl', 'tokenVersion')
        GROUP BY table_name
        HAVING COUNT(*) = 3
      `;
      await this.prisma.$queryRaw`
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name IN ('AuthSession', 'AuditLog')
        GROUP BY table_schema
        HAVING COUNT(*) = 2
      `;
      return { status: 'ok', database: 'ok', schema: 'ok' };
    } catch {
      throw new ServiceUnavailableException('The school database schema is not ready.');
    }
  }
}
