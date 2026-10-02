import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { HomeworkService } from './homework.service.js';
import { CreateHomeworkDto, SubmitHomeworkDto, GradeHomeworkDto } from './dto/homework.dto.js';
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
  async createHomework(@Body() data: CreateHomeworkDto, @Request() req: any) {
    return this.homeworkService.createHomework(data, req.user);
  }

  @Get('class/:sectionId')
  async getHomeworkForClass(@Param('sectionId') sectionId: string, @Request() req: any) {
    return this.homeworkService.getHomeworkForClass(sectionId, req.user);
  }

  @Post('submit')
  @Roles(Role.STUDENT)
  async submitHomework(@Body() data: SubmitHomeworkDto, @Request() req: any) {
    return this.homeworkService.submitHomework(data, req.user);
  }

  @Patch('grade/:submissionId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  async gradeSubmission(
    @Param('submissionId') id: string,
    @Body() body: GradeHomeworkDto,
    @Request() req: any
  ) {
    return this.homeworkService.gradeSubmission(id, body.grade, body.feedback || '', req.user);
  }
}
