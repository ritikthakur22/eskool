import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ExamsService } from './exams.service.js';
import { Prisma } from '@prisma/client';

@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  async createExam(@Body() data: Prisma.ExamUncheckedCreateInput) {
    if (typeof data.date === 'string') data.date = new Date(data.date);
    return this.examsService.createExam(data);
  }

  @Post('result')
  async addExamResult(@Body() data: Prisma.ExamResultUncheckedCreateInput) {
    return this.examsService.addExamResult(data);
  }

  @Get('student/:studentId')
  async getStudentResults(@Param('studentId') studentId: string) {
    return this.examsService.getStudentResults(studentId);
  }
}
