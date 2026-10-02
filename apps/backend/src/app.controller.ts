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
      const requiredColumns = await this.prisma.$queryRaw<Array<{ '?column?': number }>>`
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'User'
          AND column_name IN ('googleSubject', 'profilePictureUrl', 'tokenVersion')
        GROUP BY table_name
        HAVING COUNT(*) = 3
      `;
      if (!requiredColumns.length) throw new Error('required auth columns are missing');

      const requiredTables = await this.prisma.$queryRaw<Array<{ '?column?': number }>>`
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = current_schema()
          AND table_name IN ('AuthSession', 'AuditLog')
        GROUP BY table_schema
        HAVING COUNT(*) = 2
      `;
      if (!requiredTables.length) throw new Error('required tables are missing');
      return { status: 'ok', database: 'ok', schema: 'ok' };
    } catch {
      throw new ServiceUnavailableException('The school database schema is not ready.');
    }
  }
}
