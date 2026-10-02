import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Request, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AcademicsService } from './academics.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CreateAcademicYearDto, CreateClassDto, CreateEnrollmentDto, CreateParentLinkDto, CreateSectionDto, CreateSubjectDto, CreateTeacherAssignmentDto } from './dto/academics.dto.js';

@Controller('academics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicsController {
  constructor(private readonly academics: AcademicsService) {}

  @Get('structure')
  getStructure(@Request() req: any) {
    return this.academics.getStructure(req.user.schoolId, { id: req.user.id, role: req.user.role });
  }

  @Get('children')
  @Roles(Role.PARENT)
  getChildren(@Request() req: any) { return this.academics.getChildren(req.user.id, req.user.schoolId); }

  @Get('parent-links')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  listParentLinks(@Request() req: any) { return this.academics.listParentLinks(req.user.schoolId); }

  @Post('parent-links')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  createParentLink(@Body() data: CreateParentLinkDto, @Request() req: any) { return this.academics.createParentLink(data, req.user.schoolId, req.user.id); }

  @Delete('parent-links/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  removeParentLink(@Param('id', new ParseUUIDPipe()) id: string, @Request() req: any) { return this.academics.removeParentLink(id, req.user.schoolId, req.user.id); }

  @Post('academic-years')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  createAcademicYear(@Body() data: CreateAcademicYearDto, @Request() req: any) { return this.academics.createAcademicYear(data, req.user.schoolId, req.user.id); }

  @Post('classes')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  createClass(@Body() data: CreateClassDto, @Request() req: any) { return this.academics.createClass(data, req.user.schoolId, req.user.id); }

  @Post('sections')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  createSection(@Body() data: CreateSectionDto, @Request() req: any) { return this.academics.createSection(data, req.user.schoolId, req.user.id); }

  @Post('subjects')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  createSubject(@Body() data: CreateSubjectDto, @Request() req: any) { return this.academics.createSubject(data, req.user.schoolId, req.user.id); }

  @Post('enrollments')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  enroll(@Body() data: CreateEnrollmentDto, @Request() req: any) { return this.academics.enroll(data, req.user.schoolId, req.user.id); }

  @Post('teacher-assignments')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  assignTeacher(@Body() data: CreateTeacherAssignmentDto, @Request() req: any) { return this.academics.assignTeacher(data, req.user.schoolId, req.user.id); }
}
