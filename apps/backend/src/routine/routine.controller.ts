import {
  BadRequestException,
  Controller,
  Get,
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

const allowedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

@Controller('routine/document')
@UseGuards(JwtAuthGuard)
export class RoutineController {
  constructor(private readonly routineService: RoutineService) {}

  @Get()
  async getLatest(@Request() req: any) {
    return this.routineService.getLatest(req.user.schoolId);
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
    return this.routineService.upload(file, req.user.schoolId, req.user.id);
  }
}
