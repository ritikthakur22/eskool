import { Controller, Post, Get, Patch, Put, Delete, Body, Param, UseGuards, Request, ParseUUIDPipe, Header, UploadedFile, UseInterceptors, BadRequestException, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExamsService } from './exams.service.js';
import { CreateExamDto, AddExamResultDto, UpdateExamDto, CreateQuestionDto, UpdateQuestionDto, SubmitAnswerDto, UpdateAssessmentSchemeDto, BulkExamResultsDto } from './dto/exam.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '@prisma/client';
import { assertFileSignature } from '../storage/file-validation.js';

const examRoutineMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

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

  @Get('routine/section/:sectionId')
  getExamRoutine(@Param('sectionId', new ParseUUIDPipe()) sectionId: string, @Request() req: any) { return this.examsService.getExamRoutineDocuments(sectionId, req.user); }

  @Get('routine/me')
  @Roles(Role.STUDENT)
  getMyExamRoutine(@Request() req: any) { return this.examsService.getMyExamRoutineDocuments(req.user); }

  @Get('routine/child/:studentId')
  @Roles(Role.PARENT)
  getChildExamRoutine(@Param('studentId', new ParseUUIDPipe()) studentId: string, @Request() req: any) { return this.examsService.getChildExamRoutineDocuments(studentId, req.user); }

  @Post('routine/section/:sectionId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, callback) => examRoutineMimeTypes.has(file.mimetype) ? callback(null, true) : callback(new BadRequestException('Upload a PDF, JPG, PNG, or WEBP exam routine.'), false),
  }))
  uploadExamRoutine(@Param('sectionId', new ParseUUIDPipe()) sectionId: string, @UploadedFile() file: { buffer: Buffer; mimetype: string } | undefined, @Body('title') title: string | undefined, @Request() req: any) {
    if (!file) throw new BadRequestException('Choose an exam routine file.');
    assertFileSignature(file);
    return this.examsService.uploadExamRoutineDocument(sectionId, title || 'Exam routine', file, req.user);
  }

  @Get('scheme/:classId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  getAssessmentScheme(@Param('classId', new ParseUUIDPipe()) classId: string, @Request() req: any) { return this.examsService.getAssessmentScheme(classId, req.user.schoolId); }

  @Put('scheme/:classId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  updateAssessmentScheme(@Param('classId', new ParseUUIDPipe()) classId: string, @Body() data: UpdateAssessmentSchemeDto, @Request() req: any) { return this.examsService.updateAssessmentScheme(classId, data, req.user); }

  @Get('report/section/:sectionId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  getSectionProgressReport(@Param('sectionId', new ParseUUIDPipe()) sectionId: string, @Request() req: any) { return this.examsService.getSectionProgressReport(sectionId, req.user); }

  @Get('report/search/students')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  searchStudentProgress(@Query('q') query: string, @Query('classId') classId: string, @Query('sectionId') sectionId: string, @Query('category') category: string, @Request() req: any) {
    return this.examsService.searchStudentProgress(query || '', { classId, sectionId, category }, req.user);
  }

  @Get('report/section/:sectionId/export')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename="class-progress-report.xlsx"')
  exportSectionProgressReport(@Param('sectionId', new ParseUUIDPipe()) sectionId: string, @Request() req: any) { return this.examsService.exportSectionReport(sectionId, req.user); }

  @Get('report/me')
  @Roles(Role.STUDENT)
  getMyProgressReport(@Request() req: any) { return this.examsService.getStudentProgressReport(req.user.id, req.user); }

  @Get('report/child/:studentId')
  @Roles(Role.PARENT)
  getChildProgressReport(@Param('studentId', new ParseUUIDPipe()) studentId: string, @Request() req: any) { return this.examsService.getStudentProgressReport(studentId, req.user); }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  updateExam(@Param('id', new ParseUUIDPipe()) id: string, @Body() data: UpdateExamDto, @Request() req: any) { return this.examsService.updateExam(id, data, req.user); }

  @Post('result')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  async addExamResult(@Body() data: AddExamResultDto, @Request() req: any) {
    return this.examsService.addExamResult(data, req.user);
  }

  @Post('results/bulk')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  addExamResultsBulk(@Body() data: BulkExamResultsDto, @Request() req: any) { return this.examsService.addExamResultsBulk(data, req.user); }

  @Get(':examId/roster')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  getExamRoster(@Param('examId', new ParseUUIDPipe()) examId: string, @Request() req: any) { return this.examsService.getExamRoster(examId, req.user); }

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
  @Roles(Role.PARENT, Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
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
