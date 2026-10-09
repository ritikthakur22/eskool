import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AcademicsService } from './academics.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CreateAcademicYearDto, CreateClassDto, CreateEnrollmentDto, CreateParentLinkDto, CreateSectionDto, CreateSubjectDto, CreateTeacherAssignmentDto, UpdateAcademicYearDto, UpdateClassDto, UpdateSectionDto, UpdateSubjectDto } from './dto/academics.dto.js';

@Controller('academics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicsController {
  constructor(private readonly academics: AcademicsService) {}

  @Get('structure')
  getStructure(@Request() req: any) {
    return this.academics.getStructure(req.user.schoolId, { id: req.user.id, role: req.user.role });
  }

  @Get('sections/:sectionId/students')
  getSectionStudents(@Param('sectionId', new ParseUUIDPipe()) sectionId: string, @Request() req: any) {
    return this.academics.getSectionStudents(sectionId, { id: req.user.id, role: req.user.role, schoolId: req.user.schoolId });
  }

  @Get('children')
  @Roles(Role.PARENT)
  getChildren(@Request() req: any) { return this.academics.getChildren(req.user.id, req.user.schoolId); }

  @Get('parent-links')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  listParentLinks(@Request() req: any) { return this.academics.listParentLinks(req.user.schoolId); }

  @Post('parent-links')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  createParentLink(@Body() data: CreateParentLinkDto, @Request() req: any) { return this.academics.createParentLink(data, req.user.schoolId, req.user.id); }

  @Delete('parent-links/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  removeParentLink(@Param('id', new ParseUUIDPipe()) id: string, @Request() req: any) { return this.academics.removeParentLink(id, req.user.schoolId, req.user.id); }

  @Post('academic-years')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  createAcademicYear(@Body() data: CreateAcademicYearDto, @Request() req: any) { return this.academics.createAcademicYear(data, req.user.schoolId, req.user.id); }

  @Patch('academic-years/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  updateAcademicYear(@Param('id', new ParseUUIDPipe()) id: string, @Body() data: UpdateAcademicYearDto, @Request() req: any) { return this.academics.updateAcademicYear(id, data, req.user.schoolId, req.user.id); }

  @Delete('academic-years/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  deleteAcademicYear(@Param('id', new ParseUUIDPipe()) id: string, @Request() req: any) { return this.academics.deleteAcademicYear(id, req.user.schoolId, req.user.id); }

  @Post('classes')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  createClass(@Body() data: CreateClassDto, @Request() req: any) { return this.academics.createClass(data, req.user.schoolId, req.user.id); }

  @Patch('classes/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  updateClass(@Param('id', new ParseUUIDPipe()) id: string, @Body() data: UpdateClassDto, @Request() req: any) { return this.academics.updateClass(id, data.name, req.user.schoolId, req.user.id); }

  @Delete('classes/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  deleteClass(@Param('id', new ParseUUIDPipe()) id: string, @Request() req: any) { return this.academics.deleteClass(id, req.user.schoolId, req.user.id); }

  @Post('sections')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  createSection(@Body() data: CreateSectionDto, @Request() req: any) { return this.academics.createSection(data, req.user.schoolId, req.user.id); }

  @Patch('sections/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  updateSection(@Param('id', new ParseUUIDPipe()) id: string, @Body() data: UpdateSectionDto, @Request() req: any) { return this.academics.updateSection(id, data.name, req.user.schoolId, req.user.id); }

  @Delete('sections/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  deleteSection(@Param('id', new ParseUUIDPipe()) id: string, @Request() req: any) { return this.academics.deleteSection(id, req.user.schoolId, req.user.id); }

  @Post('sections/normalize-duplicates')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  normalizeDuplicateSections(@Request() req: any) { return this.academics.normalizeDuplicateSections(req.user.schoolId, req.user.id); }

  @Post('subjects')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  createSubject(@Body() data: CreateSubjectDto, @Request() req: any) { return this.academics.createSubject(data, req.user.schoolId, req.user.id); }

  @Patch('subjects/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  updateSubject(@Param('id', new ParseUUIDPipe()) id: string, @Body() data: UpdateSubjectDto, @Request() req: any) { return this.academics.updateSubject(id, data, req.user.schoolId, req.user.id); }

  @Delete('subjects/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  deleteSubject(@Param('id', new ParseUUIDPipe()) id: string, @Request() req: any) { return this.academics.deleteSubject(id, req.user.schoolId, req.user.id); }

  @Post('enrollments')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TEACHER)
  enroll(@Body() data: CreateEnrollmentDto, @Request() req: any) { return this.academics.enroll(data, req.user.schoolId, req.user.id); }

  @Post('teacher-assignments')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  assignTeacher(@Body() data: CreateTeacherAssignmentDto, @Request() req: any) { return this.academics.assignTeacher(data, req.user.schoolId, req.user.id); }

  @Patch('teacher-assignments/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  updateTeacherAssignment(@Param('id', new ParseUUIDPipe()) id: string, @Body() data: CreateTeacherAssignmentDto, @Request() req: any) { return this.academics.updateTeacherAssignment(id, data, req.user.schoolId, req.user.id); }

  @Delete('teacher-assignments/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  deleteTeacherAssignment(@Param('id', new ParseUUIDPipe()) id: string, @Request() req: any) { return this.academics.deleteTeacherAssignment(id, req.user.schoolId, req.user.id); }
}
