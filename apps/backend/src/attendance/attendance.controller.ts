import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AttendanceService } from './attendance.service.js';
import { MarkAttendanceDto } from './dto/attendance.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('mark')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  async markAttendance(@Body() data: MarkAttendanceDto, @Request() req: any) {
    return this.attendanceService.markAttendance(data, req.user);
  }

  @Get('student/:id')
  async getStudentAttendance(
    @Param('id') studentId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Request() req?: any
  ) {
    const monthNum = month ? parseInt(month, 10) : undefined;
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.attendanceService.getStudentAttendance(studentId, monthNum, yearNum, req.user);
  }
}
