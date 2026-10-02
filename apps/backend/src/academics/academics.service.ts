import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { CreateAcademicYearDto, CreateClassDto, CreateEnrollmentDto, CreateParentLinkDto, CreateSectionDto, CreateSubjectDto, CreateTeacherAssignmentDto } from './dto/academics.dto.js';

@Injectable()
export class AcademicsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async getStructure(schoolId: string, actor: { id: string; role: Role }) {
    const canSeeAllAssignments = actor.role === Role.ADMIN || actor.role === Role.SUPER_ADMIN;
    const [academicYears, classes, subjects, assignments] = await Promise.all([
      this.prisma.academicYear.findMany({ where: { schoolId }, orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }] }),
      this.prisma.class.findMany({ where: { schoolId }, include: { sections: { orderBy: { name: 'asc' } } }, orderBy: { name: 'asc' } }),
      this.prisma.subject.findMany({ where: { schoolId }, orderBy: { name: 'asc' } }),
      this.prisma.teacherAssignment.findMany({ where: { section: { schoolId }, ...(canSeeAllAssignments ? {} : actor.role === Role.TEACHER ? { teacherId: actor.id } : { id: '__no_assignments_for_student_or_parent__' }) }, include: { teacher: { select: { id: true, email: true, teacherProfile: { select: { firstName: true, lastName: true } } } }, section: { include: { class: true } }, subject: true, academicYear: true }, orderBy: { academicYear: { startDate: 'desc' } } }),
    ]);
    return { academicYears, classes, subjects, assignments };
  }

  async getSectionStudents(sectionId: string, actor: { id: string; role: Role; schoolId: string }) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, schoolId: actor.schoolId, ...(actor.role === Role.TEACHER ? { teacherAssignments: { some: { teacherId: actor.id } } } : {}) },
      select: { id: true },
    });
    if (!section) throw new NotFoundException('Section not found or you are not assigned to it.');
    return this.prisma.enrollment.findMany({
      where: { sectionId, academicYear: { isCurrent: true }, student: { schoolId: actor.schoolId, role: Role.STUDENT, status: 'ACTIVE' } },
      orderBy: [{ rollNo: 'asc' }, { student: { studentProfile: { lastName: 'asc' } } }],
      select: { studentId: true, rollNo: true, student: { select: { email: true, studentProfile: { select: { firstName: true, lastName: true, grade: true, section: true, rollNo: true } } } } },
    });
  }

  async createAcademicYear(data: CreateAcademicYearDto, schoolId: string, actorId: string) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (endDate <= startDate) throw new BadRequestException('Academic year end date must be after its start date.');
    const year = await this.prisma.$transaction(async tx => {
      if (data.isCurrent) await tx.academicYear.updateMany({ where: { schoolId }, data: { isCurrent: false } });
      return tx.academicYear.create({ data: { schoolId, name: data.name.trim(), startDate, endDate, isCurrent: data.isCurrent ?? false } });
    });
    void this.audit.record({ action: 'ACADEMIC_YEAR_CREATED', entity: 'AcademicYear', entityId: year.id, userId: actorId, schoolId });
    return year;
  }

  async createClass(data: CreateClassDto, schoolId: string, actorId: string) {
    const item = await this.prisma.class.create({ data: { schoolId, name: data.name.trim() } });
    void this.audit.record({ action: 'CLASS_CREATED', entity: 'Class', entityId: item.id, userId: actorId, schoolId });
    return item;
  }

  async createSection(data: CreateSectionDto, schoolId: string, actorId: string) {
    const parent = await this.prisma.class.findFirst({ where: { id: data.classId, schoolId }, select: { id: true } });
    if (!parent) throw new NotFoundException('Class not found in your school.');
    const section = await this.prisma.section.create({ data: { schoolId, classId: data.classId, name: data.name.trim() } });
    void this.audit.record({ action: 'SECTION_CREATED', entity: 'Section', entityId: section.id, userId: actorId, schoolId });
    return section;
  }

  async createSubject(data: CreateSubjectDto, schoolId: string, actorId: string) {
    const subject = await this.prisma.subject.create({ data: { schoolId, name: data.name.trim(), code: data.code?.trim() || null } });
    void this.audit.record({ action: 'SUBJECT_CREATED', entity: 'Subject', entityId: subject.id, userId: actorId, schoolId });
    return subject;
  }

  async enroll(data: CreateEnrollmentDto, schoolId: string, actorId: string) {
    const [student, section, year] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: data.studentId, schoolId, role: Role.STUDENT, status: 'ACTIVE' }, select: { id: true } }),
      this.prisma.section.findFirst({ where: { id: data.sectionId, schoolId }, select: { id: true } }),
      this.prisma.academicYear.findFirst({ where: { id: data.academicYearId, schoolId }, select: { id: true } }),
    ]);
    if (!student || !section || !year) throw new NotFoundException('Student, section, or academic year was not found in your school.');
    try {
      const enrollment = await this.prisma.enrollment.create({ data: { studentId: student.id, sectionId: section.id, academicYearId: year.id, rollNo: data.rollNo?.trim() || null } });
      void this.audit.record({ action: 'STUDENT_ENROLLED', entity: 'Enrollment', entityId: enrollment.id, userId: actorId, schoolId, details: { studentId: student.id, sectionId: section.id, academicYearId: year.id } });
      return enrollment;
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('This student is already enrolled for that academic year.');
      throw error;
    }
  }

  async assignTeacher(data: CreateTeacherAssignmentDto, schoolId: string, actorId: string) {
    const [teacher, section, subject, academicYear] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: data.teacherId, schoolId, role: Role.TEACHER, status: 'ACTIVE' }, select: { id: true } }),
      this.prisma.section.findFirst({ where: { id: data.sectionId, schoolId }, select: { id: true } }),
      this.prisma.subject.findFirst({ where: { id: data.subjectId, schoolId }, select: { id: true } }),
      this.prisma.academicYear.findFirst({ where: { id: data.academicYearId, schoolId }, select: { id: true } }),
    ]);
    if (!teacher || !section || !subject || !academicYear) throw new NotFoundException('Teacher, section, subject, or academic year was not found in your school.');
    try {
      const assignment = await this.prisma.teacherAssignment.create({ data: { teacherId: teacher.id, sectionId: section.id, subjectId: subject.id, academicYearId: academicYear.id } });
      void this.audit.record({ action: 'TEACHER_ASSIGNED', entity: 'TeacherAssignment', entityId: assignment.id, userId: actorId, schoolId, details: { teacherId: teacher.id, sectionId: section.id, subjectId: subject.id, academicYearId: academicYear.id } });
      return assignment;
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('This teacher is already assigned to that subject and section.');
      throw error;
    }
  }

  async getChildren(parentId: string, schoolId: string) {
    return this.prisma.parentStudent.findMany({
      where: { parentId, parent: { schoolId, role: Role.PARENT, status: 'ACTIVE' }, student: { schoolId, role: Role.STUDENT, status: 'ACTIVE' } },
      select: { id: true, student: { select: { id: true, email: true, studentProfile: { select: { firstName: true, lastName: true, grade: true, section: true, rollNo: true } }, enrollments: { where: { academicYear: { isCurrent: true } }, take: 1, select: { sectionId: true, academicYearId: true, section: { select: { id: true, name: true, class: { select: { name: true } } } } } } } } },
      orderBy: { student: { studentProfile: { lastName: 'asc' } } },
    });
  }

  async listParentLinks(schoolId: string) {
    return this.prisma.parentStudent.findMany({
      where: { parent: { schoolId, role: Role.PARENT }, student: { schoolId, role: Role.STUDENT } },
      select: {
        id: true,
        parent: { select: { id: true, email: true, status: true, adminProfile: { select: { firstName: true, lastName: true } } } },
        student: { select: { id: true, email: true, studentProfile: { select: { firstName: true, lastName: true, grade: true, section: true, rollNo: true } } } },
      },
      orderBy: { id: 'asc' },
      take: 500,
    });
  }

  async createParentLink(data: CreateParentLinkDto, schoolId: string, actorId: string) {
    const [parent, student] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: data.parentId, schoolId, role: Role.PARENT, status: 'ACTIVE' }, select: { id: true } }),
      this.prisma.user.findFirst({ where: { id: data.studentId, schoolId, role: Role.STUDENT, status: 'ACTIVE' }, select: { id: true } }),
    ]);
    if (!parent || !student) throw new NotFoundException('Active parent and student must belong to your school.');
    try {
      const link = await this.prisma.parentStudent.create({ data: { parentId: parent.id, studentId: student.id } });
      void this.audit.record({ action: 'PARENT_LINK_CREATED', entity: 'ParentStudent', entityId: link.id, userId: actorId, schoolId, details: { parentId: parent.id, studentId: student.id } });
      return link;
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('This parent is already linked to the student.');
      throw error;
    }
  }

  async removeParentLink(id: string, schoolId: string, actorId: string) {
    const link = await this.prisma.parentStudent.findFirst({ where: { id, parent: { schoolId }, student: { schoolId } }, select: { id: true, parentId: true, studentId: true } });
    if (!link) throw new NotFoundException('Parent link not found in your school.');
    await this.prisma.parentStudent.delete({ where: { id: link.id } });
    void this.audit.record({ action: 'PARENT_LINK_REMOVED', entity: 'ParentStudent', entityId: link.id, userId: actorId, schoolId, details: { parentId: link.parentId, studentId: link.studentId } });
    return { success: true };
  }
}
