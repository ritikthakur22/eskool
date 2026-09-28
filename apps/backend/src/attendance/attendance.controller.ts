import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service.js';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('mark')
  async markAttendance(@Body() data: Prisma.AttendanceUncheckedCreateInput) {
    // Convert string date to Date object if needed
    if (typeof data.date === 'string') {
      data.date = new Date(data.date);
    }
    return this.attendanceService.markAttendance(data);
  }

  @Get('student/:id')
  async getStudentAttendance(
    @Param('id') studentId: string,
    @Query('month') month?: string,
    @Query('year') year?: string
  ) {
    const monthNum = month ? parseInt(month, 10) : undefined;
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.attendanceService.getStudentAttendance(studentId, monthNum, yearNum);
  }
}
