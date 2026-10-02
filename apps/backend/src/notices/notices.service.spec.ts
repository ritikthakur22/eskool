import { Test, TestingModule } from '@nestjs/testing';
import { NoticesService } from './notices.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';

describe('NoticesService', () => {
  let service: NoticesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NoticesService, { provide: PrismaService, useValue: {} }, { provide: AuditService, useValue: { record: async () => undefined } }],
    }).compile();

    service = module.get<NoticesService>(NoticesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
