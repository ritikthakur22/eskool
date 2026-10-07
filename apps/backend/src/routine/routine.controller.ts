import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RoutineService } from './routine.service.js';
import type { RoutineUploadFile } from './routine.service.js';
import { assertFileSignature } from '../storage/file-validation.js';

const allowedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

@Controller('routine/document')
@UseGuards(JwtAuthGuard)
export class RoutineController {
  constructor(private readonly routineService: RoutineService) {}

  @Get()
  async getLatest(@Request() req: any) {
    return this.routineService.getLatest(req.user.schoolId);
  }

  @Get('history')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  getHistory(@Query('limit') limit: string | undefined, @Request() req: any) {
    const parsed = Number.parseInt(limit || '', 10);
    return this.routineService.getHistory(req.user.schoolId, Number.isInteger(parsed) ? parsed : 50);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, callback) => {
      if (!allowedMimeTypes.has(file.mimetype)) {
        callback(new BadRequestException('Upload a PDF, JPG, PNG, or WEBP routine file.'), false);
        return;
      }
      callback(null, true);
    },
  }))
  async upload(@UploadedFile() file: RoutineUploadFile, @Request() req: any) {
    if (!file) throw new BadRequestException('Choose a routine file to upload.');
    if (!req.user.schoolId) throw new BadRequestException('Your account is not linked to a school.');
    assertFileSignature(file);
    return this.routineService.upload(file, req.user.schoolId, req.user.id);
  }

  // Class Routine (Timetable) Endpoints
  @Post('class')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async createClassRoutine(@Request() req: any, @Query() body: any) { // wait, usually body is @Body
    return this.routineService.createClassRoutine(req.user.schoolId, req.body);
  }

  @Get('class/admin')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAdminRoutines(@Request() req: any) {
    return this.routineService.getAdminRoutines(req.user.schoolId);
  }

  @Get('class/student/:sectionId')
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.ADMIN, Role.SUPER_ADMIN)
  async getStudentRoutine(@Request() req: any, @Query('sectionId') querySectionId: string) { // oops I should use @Param
    // I will use req.params.sectionId
    return this.routineService.getStudentRoutine(req.user.schoolId, req.params.sectionId);
  }

  @Get('class/teacher/:teacherId')
  @UseGuards(RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN)
  async getTeacherRoutine(@Request() req: any) {
    return this.routineService.getTeacherRoutine(req.user.schoolId, req.params.teacherId);
  }

  @Post('class/:id') // Using POST for update to avoid adding Put decorator just in case
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async updateClassRoutine(@Request() req: any) {
    return this.routineService.updateClassRoutine(req.user.schoolId, req.params.id, req.body);
  }

  @Get('class/delete/:id') // Using GET/delete pattern
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async deleteClassRoutine(@Request() req: any) {
    return this.routineService.deleteClassRoutine(req.user.schoolId, req.params.id);
  }
}
