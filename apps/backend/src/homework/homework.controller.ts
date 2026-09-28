import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { HomeworkService } from './homework.service.js';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('homework')
@UseGuards(JwtAuthGuard)
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Post()
  async createHomework(@Body() data: Prisma.HomeworkUncheckedCreateInput) {
    if (typeof data.dueDate === 'string') data.dueDate = new Date(data.dueDate);
    return this.homeworkService.createHomework(data);
  }

  @Get('class/:classId')
  async getHomeworkForClass(@Param('classId') classId: string) {
    return this.homeworkService.getHomeworkForClass(classId);
  }

  @Post('submit')
  async submitHomework(@Body() data: Prisma.HomeworkSubmissionUncheckedCreateInput) {
    data.status = data.status || 'SUBMITTED';
    return this.homeworkService.submitHomework(data);
  }

  @Patch('grade/:submissionId')
  async gradeSubmission(
    @Param('submissionId') id: string,
    @Body() body: { grade: string; feedback: string }
  ) {
    return this.homeworkService.gradeSubmission(id, body.grade, body.feedback);
  }
}
