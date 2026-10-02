import { BadRequestException, Controller, Get, Post, Body, Param, Patch, UseGuards, Request, ParseUUIDPipe, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HomeworkService } from './homework.service.js';
import { CreateHomeworkDto, SubmitHomeworkDto, GradeHomeworkDto } from './dto/homework.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '@prisma/client';
import { assertFileSignature } from '../storage/file-validation.js';

const allowedAttachmentTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const maxAttachmentSize = 10 * 1024 * 1024;

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
  async getHomeworkForClass(@Param('sectionId', new ParseUUIDPipe()) sectionId: string, @Query('limit') limit: string | undefined, @Request() req: any) {
    const parsedLimit = Number.parseInt(limit || '', 10);
    const take = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 50;
    return this.homeworkService.getHomeworkForClass(sectionId, req.user, take);
  }

  @Post('submit')
  @Roles(Role.STUDENT)
  async submitHomework(@Body() data: SubmitHomeworkDto, @Request() req: any) {
    return this.homeworkService.submitHomework(data, req.user);
  }

  @Post('submit/:homeworkId/attachment')
  @Roles(Role.STUDENT)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: maxAttachmentSize, files: 1 },
    fileFilter: (_req, file, callback) => {
      if (!allowedAttachmentTypes.has(file.mimetype)) {
        callback(new BadRequestException('Upload one PDF, JPG, PNG, or WEBP file.'), false);
        return;
      }
      callback(null, true);
    },
  }))
  async submitHomeworkAttachment(
    @Param('homeworkId', new ParseUUIDPipe()) homeworkId: string,
    @UploadedFile() file: { buffer: Buffer; size: number; mimetype: string; originalname: string } | undefined,
    @Request() req: any,
  ) {
    if (!file) throw new BadRequestException('Choose a homework attachment to upload.');
    assertFileSignature(file);
    return this.homeworkService.submitHomeworkAttachment(homeworkId, req.user, file);
  }

  @Patch('grade/:submissionId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  async gradeSubmission(
    @Param('submissionId', new ParseUUIDPipe()) id: string,
    @Body() body: GradeHomeworkDto,
    @Request() req: any
  ) {
    return this.homeworkService.gradeSubmission(id, body.grade, body.feedback || '', req.user);
  }
}
