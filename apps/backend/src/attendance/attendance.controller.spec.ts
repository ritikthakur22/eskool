import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceController } from './attendance.controller.js';
import { AttendanceService } from './attendance.service.js';
import { AttendanceExportService } from './attendance.export.service.js';

describe('AttendanceController', () => {
  let controller: AttendanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [{ provide: AttendanceService, useValue: {} }, { provide: AttendanceExportService, useValue: {} }],
    }).compile();

    controller = module.get<AttendanceController>(AttendanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
