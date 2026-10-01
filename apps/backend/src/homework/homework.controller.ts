import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { HomeworkService } from './homework.service.js';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '@prisma/client';

@Controller('homework')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HomeworkController {
  constructor(private readonly homeworkService: HomeworkService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  async createHomework(@Body() data: Prisma.HomeworkUncheckedCreateInput, @Request() req: any) {
    if (typeof data.dueDate === 'string') data.dueDate = new Date(data.dueDate);
    return this.homeworkService.createHomework(data, req.user);
  }

  @Get('class/:classId')
  async getHomeworkForClass(@Param('classId') classId: string, @Request() req: any) {
    return this.homeworkService.getHomeworkForClass(classId, req.user);
  }

  @Post('submit')
  @Roles(Role.STUDENT)
  async submitHomework(@Body() data: Prisma.HomeworkSubmissionUncheckedCreateInput, @Request() req: any) {
    data.status = data.status || 'SUBMITTED';
    return this.homeworkService.submitHomework(data, req.user);
  }

  @Patch('grade/:submissionId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  async gradeSubmission(
    @Param('submissionId') id: string,
    @Body() body: { grade: string; feedback: string },
    @Request() req: any
  ) {
    return this.homeworkService.gradeSubmission(id, body.grade, body.feedback, req.user);
  }
}
