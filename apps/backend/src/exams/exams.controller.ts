import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ExamsService } from './exams.service.js';
import { CreateExamDto, AddExamResultDto } from './dto/exam.dto.js';
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
  async createExam(@Body() data: CreateExamDto, @Request() req: any) {
    return this.examsService.createExam(data, req.user);
  }

  @Post('result')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  async addExamResult(@Body() data: AddExamResultDto, @Request() req: any) {
    return this.examsService.addExamResult(data, req.user);
  }

  @Get('student/:studentId')
  async getStudentResults(@Param('studentId') studentId: string, @Request() req: any) {
    return this.examsService.getStudentResults(studentId, req.user);
  }
}
