import { Test, TestingModule } from '@nestjs/testing';
import { HomeworkService } from './homework.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';

describe('HomeworkService', () => {
  let service: HomeworkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HomeworkService, { provide: PrismaService, useValue: {} }, { provide: AuditService, useValue: { record: async () => undefined } }],
    }).compile();

    service = module.get<HomeworkService>(HomeworkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
