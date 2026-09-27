import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service.js';
import { AttendanceController } from './attendance.controller.js';

@Module({
  providers: [AttendanceService],
  controllers: [AttendanceController]
})
export class AttendanceModule {}
