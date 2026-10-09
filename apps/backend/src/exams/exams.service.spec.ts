import { Test, TestingModule } from '@nestjs/testing';
import { ExamsService } from './exams.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CloudinaryService } from '../storage/cloudinary.service.js';
import { calculateWeightedPercentage, gradeBandForPercentage } from './assessment-calculation.js';

describe('ExamsService', () => {
  let service: ExamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExamsService, { provide: PrismaService, useValue: {} }, { provide: AuditService, useValue: { record: async () => undefined } }, { provide: CloudinaryService, useValue: {} }],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('calculates terminal weights without folding weekly/monthly results into the final', () => {
    const categories = new Map([
      ['TERMINAL_1', { marks: 80, max: 100 }],
      ['TERMINAL_2', { marks: 90, max: 100 }],
      ['TERMINAL_3', { marks: 70, max: 100 }],
      ['FINAL', { marks: 75, max: 100 }],
      ['WEEKLY', { marks: 100, max: 100 }],
    ]);
    expect(calculateWeightedPercentage(categories, { TERMINAL_1: 10, TERMINAL_2: 10, TERMINAL_3: 10, FINAL: 70 })).toBe(76.5);
  });

  it('does not finalize until every weighted assessment category has marks', () => {
    const categories = new Map([['TERMINAL_1', { marks: 80, max: 100 }]]);
    expect(calculateWeightedPercentage(categories, { TERMINAL_1: 10, TERMINAL_2: 10, TERMINAL_3: 10, FINAL: 70 })).toBeNull();
  });

  it('uses school-defined grade band boundaries', () => {
    expect(gradeBandForPercentage(90, [{ minPercent: 90, maxPercent: 100, grade: 'A+', gpa: 4 }])).toEqual({ minPercent: 90, maxPercent: 100, grade: 'A+', gpa: 4 });
  });
});
