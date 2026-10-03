import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { ExamsService } from './exams.service.js';
import { CreateExamDto, AddExamResultDto, UpdateExamDto, CreateQuestionDto, UpdateQuestionDto, SubmitAnswerDto } from './dto/exam.dto.js';
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

  @Get('manage')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  getManagedExams(@Request() req: any) { return this.examsService.getManagedExams(req.user); }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  updateExam(@Param('id', new ParseUUIDPipe()) id: string, @Body() data: UpdateExamDto, @Request() req: any) { return this.examsService.updateExam(id, data, req.user); }

  @Post('result')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  async addExamResult(@Body() data: AddExamResultDto, @Request() req: any) {
    return this.examsService.addExamResult(data, req.user);
  }

  @Get('me')
  @Roles(Role.STUDENT)
  async getMyExams(@Request() req: any) {
    return this.examsService.getExamsForStudent(req.user.id, req.user.schoolId);
  }

  @Get('me/results')
  @Roles(Role.STUDENT)
  async getMyResults(@Request() req: any) {
    return this.examsService.getStudentResults(req.user.id, req.user);
  }

  @Get('child/:studentId')
  @Roles(Role.PARENT)
  getChildExams(@Param('studentId', new ParseUUIDPipe()) studentId: string, @Request() req: any) {
    return this.examsService.getExamsForLinkedChild(studentId, req.user);
  }

  @Get('student/:studentId')
  async getStudentResults(@Param('studentId', new ParseUUIDPipe()) studentId: string, @Request() req: any) {
    return this.examsService.getStudentResults(studentId, req.user);
  }

  @Post(':id/questions')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  addQuestion(@Param('id', new ParseUUIDPipe()) id: string, @Body() data: CreateQuestionDto, @Request() req: any) {
    return this.examsService.addQuestion(id, data, req.user);
  }

  @Patch('questions/:questionId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  updateQuestion(@Param('questionId', new ParseUUIDPipe()) questionId: string, @Body() data: UpdateQuestionDto, @Request() req: any) {
    return this.examsService.updateQuestion(questionId, data, req.user);
  }

  @Delete('questions/:questionId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  deleteQuestion(@Param('questionId', new ParseUUIDPipe()) questionId: string, @Request() req: any) {
    return this.examsService.deleteQuestion(questionId, req.user);
  }

  @Post(':id/attempts')
  @Roles(Role.STUDENT)
  startAttempt(@Param('id', new ParseUUIDPipe()) id: string, @Request() req: any) {
    return this.examsService.startAttempt(id, req.user);
  }

  @Patch('attempts/:attemptId/answers')
  @Roles(Role.STUDENT)
  saveAnswer(@Param('attemptId', new ParseUUIDPipe()) attemptId: string, @Body() data: SubmitAnswerDto, @Request() req: any) {
    return this.examsService.saveAnswer(attemptId, data, req.user);
  }

  @Post('attempts/:attemptId/finish')
  @Roles(Role.STUDENT)
  finishAttempt(@Param('attemptId', new ParseUUIDPipe()) attemptId: string, @Request() req: any) {
    return this.examsService.finishAttempt(attemptId, req.user);
  }

  @Get(':id/questions')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER, Role.STUDENT)
  getQuestions(@Param('id', new ParseUUIDPipe()) id: string, @Request() req: any) {
    return this.examsService.getQuestions(id, req.user);
  }
}
