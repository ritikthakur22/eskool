import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { AttendanceService } from './attendance.service.js';
import { AttendanceExportService } from './attendance.export.service.js';
import { Res } from '@nestjs/common';
import { BackfillAttendanceDto, BulkMarkAttendanceDto, CorrectAttendanceDto, MarkAttendanceDto } from './dto/attendance.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService, private readonly exportService: AttendanceExportService) {}

  @Post('mark')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  async markAttendance(@Body() data: MarkAttendanceDto, @Request() req: any) {
    return this.attendanceService.markAttendance(data, req.user);
  }

  @Post('register/bulk')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  bulkMarkAttendance(@Body() data: BulkMarkAttendanceDto, @Request() req: any) {
    return this.attendanceService.bulkMarkAttendance(data, req.user);
  }

  @Post('register/backfill')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  backfillAttendance(@Body() data: BackfillAttendanceDto, @Request() req: any) {
    return this.attendanceService.backfillAttendance(data, req.user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  correctAttendance(@Param('id', new ParseUUIDPipe()) id: string, @Body() data: CorrectAttendanceDto, @Request() req: any) {
    return this.attendanceService.correctAttendance(id, data, req.user);
  }

  @Get('student/:id')
  async getStudentAttendance(
    @Param('id', new ParseUUIDPipe()) studentId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Request() req?: any
  ) {
    const monthNum = month ? parseInt(month, 10) : undefined;
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.attendanceService.getStudentAttendance(studentId, monthNum, yearNum, req.user);
  }

  @Get('register')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  getSchoolRegister(@Query('date') date: string | undefined, @Query('startDate') startDate: string | undefined, @Query('endDate') endDate: string | undefined, @Query('sectionId', new ParseUUIDPipe({ optional: true })) sectionId: string | undefined, @Request() req: any) {
    return this.attendanceService.getSchoolRegister({ schoolId: req.user.schoolId, date, startDate, endDate, sectionId, actorId: req.user.id, actorRole: req.user.role });
  }

  @Get('export')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  async exportAttendance(@Query('sectionId') sectionId: string, @Query('month') month: string, @Query('year') year: string, @Request() req: any, @Res() res: any) {
    const csv = await this.exportService.exportCsv(req.user.schoolId, sectionId, month ? parseInt(month) : undefined, year ? parseInt(year) : undefined);
    res.header('Content-Type', 'text/csv');
    res.attachment('attendance-export.csv');
    return res.send(csv);
  }

}
