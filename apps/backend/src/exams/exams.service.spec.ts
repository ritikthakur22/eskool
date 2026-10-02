import { Test, TestingModule } from '@nestjs/testing';
import { ExamsService } from './exams.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';

describe('ExamsService', () => {
  let service: ExamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExamsService, { provide: PrismaService, useValue: {} }, { provide: AuditService, useValue: { record: async () => undefined } }],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
