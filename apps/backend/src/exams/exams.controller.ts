import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ExamsService } from './exams.service.js';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  async createExam(@Body() data: Prisma.ExamUncheckedCreateInput, @Request() req: any) {
    if (typeof data.date === 'string') data.date = new Date(data.date);
    return this.examsService.createExam(data, req.user);
  }

  @Post('result')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  async addExamResult(@Body() data: Prisma.ExamResultUncheckedCreateInput, @Request() req: any) {
    return this.examsService.addExamResult(data, req.user);
  }

  @Get('student/:studentId')
  async getStudentResults(@Param('studentId') studentId: string, @Request() req: any) {
    return this.examsService.getStudentResults(studentId, req.user);
  }
}
