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
    if (await this.prisma.academicYear.findFirst({ where: { schoolId, name: { equals: data.name.trim(), mode: 'insensitive' } }, select: { id: true } })) throw new ConflictException('An academic year with this name already exists.');
    const year = await this.prisma.$transaction(async tx => {
      if (data.isCurrent) await tx.academicYear.updateMany({ where: { schoolId }, data: { isCurrent: false } });
      return tx.academicYear.create({ data: { schoolId, name: data.name.trim(), startDate, endDate, isCurrent: data.isCurrent ?? false } });
    });
    void this.audit.record({ action: 'ACADEMIC_YEAR_CREATED', entity: 'AcademicYear', entityId: year.id, userId: actorId, schoolId });
    return year;
  }

  async createClass(data: CreateClassDto, schoolId: string, actorId: string) {
    const name = data.name.trim();
    if (await this.prisma.class.findFirst({ where: { schoolId, name: { equals: name, mode: 'insensitive' } }, select: { id: true } })) throw new ConflictException('A class with this name already exists.');
    const item = await this.prisma.class.create({ data: { schoolId, name } });
    void this.audit.record({ action: 'CLASS_CREATED', entity: 'Class', entityId: item.id, userId: actorId, schoolId });
    return item;
  }

  async createSection(data: CreateSectionDto, schoolId: string, actorId: string) {
    const parent = await this.prisma.class.findFirst({ where: { id: data.classId, schoolId }, select: { id: true } });
    if (!parent) throw new NotFoundException('Class not found in your school.');
    const name = this.canonicalSectionName(data.name);
    if (await this.prisma.section.findFirst({ where: { classId: data.classId, name: { equals: name, mode: 'insensitive' } }, select: { id: true } })) throw new ConflictException('This section already exists in the selected class. Section names are not case-sensitive.');
    const section = await this.prisma.section.create({ data: { schoolId, classId: data.classId, name } });
    void this.audit.record({ action: 'SECTION_CREATED', entity: 'Section', entityId: section.id, userId: actorId, schoolId });
    return section;
  }

  async createSubject(data: CreateSubjectDto, schoolId: string, actorId: string) {
    const name = data.name.trim();
    if (await this.prisma.subject.findFirst({ where: { schoolId, name: { equals: name, mode: 'insensitive' } }, select: { id: true } })) throw new ConflictException('A subject with this name already exists.');
    const subject = await this.prisma.subject.create({ data: { schoolId, name, code: data.code?.trim() || null } });
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

  private canonicalSectionName(value: string) {
    const name = value.trim();
    return /^[a-z]$/i.test(name) ? name.toUpperCase() : name;
  }

  async updateClass(id: string, name: string, schoolId: string, actorId: string) {
    const current = await this.prisma.class.findFirst({ where: { id, schoolId }, select: { id: true } });
    if (!current) throw new NotFoundException('Class not found in your school.');
    const normalized = name.trim();
    if (await this.prisma.class.findFirst({ where: { schoolId, id: { not: id }, name: { equals: normalized, mode: 'insensitive' } }, select: { id: true } })) throw new ConflictException('A class with this name already exists.');
    const item = await this.prisma.class.update({ where: { id }, data: { name: normalized } });
    void this.audit.record({ action: 'CLASS_UPDATED', entity: 'Class', entityId: id, userId: actorId, schoolId });
    return item;
  }

  async deleteClass(id: string, schoolId: string, actorId: string) {
    const item = await this.prisma.class.findFirst({ where: { id, schoolId }, include: { _count: { select: { sections: true, notices: true } } } });
    if (!item) throw new NotFoundException('Class not found in your school.');
    if (item._count.sections || item._count.notices) throw new ConflictException('This class is in use. Remove its sections and notice targeting before deleting it.');
    await this.prisma.class.delete({ where: { id } });
    void this.audit.record({ action: 'CLASS_DELETED', entity: 'Class', entityId: id, userId: actorId, schoolId });
    return { success: true };
  }

  async updateSection(id: string, name: string, schoolId: string, actorId: string) {
    const current = await this.prisma.section.findFirst({ where: { id, schoolId }, select: { id: true, classId: true } });
    if (!current) throw new NotFoundException('Section not found in your school.');
    const normalized = this.canonicalSectionName(name);
    if (await this.prisma.section.findFirst({ where: { classId: current.classId, id: { not: id }, name: { equals: normalized, mode: 'insensitive' } }, select: { id: true } })) throw new ConflictException('This section name already exists in the class.');
    const section = await this.prisma.section.update({ where: { id }, data: { name: normalized } });
    void this.audit.record({ action: 'SECTION_UPDATED', entity: 'Section', entityId: id, userId: actorId, schoolId });
    return section;
  }

  async deleteSection(id: string, schoolId: string, actorId: string) {
    const section = await this.prisma.section.findFirst({ where: { id, schoolId }, include: { _count: { select: { enrollments: true, teacherAssignments: true, classRoutines: true, exams: true, homeworks: true } } } });
    if (!section) throw new NotFoundException('Section not found in your school.');
    if (Object.values(section._count).some(count => count > 0)) throw new ConflictException('This section is in use by students, teachers, routines, exams, or homework. Remove or reassign those records first.');
    await this.prisma.section.delete({ where: { id } });
    void this.audit.record({ action: 'SECTION_DELETED', entity: 'Section', entityId: id, userId: actorId, schoolId });
    return { success: true };
  }

  async updateSubject(id: string, data: CreateSubjectDto, schoolId: string, actorId: string) {
    const current = await this.prisma.subject.findFirst({ where: { id, schoolId }, select: { id: true } });
    if (!current) throw new NotFoundException('Subject not found in your school.');
    const name = data.name.trim();
    if (await this.prisma.subject.findFirst({ where: { schoolId, id: { not: id }, name: { equals: name, mode: 'insensitive' } }, select: { id: true } })) throw new ConflictException('A subject with this name already exists.');
    const subject = await this.prisma.subject.update({ where: { id }, data: { name, code: data.code?.trim() || null } });
    void this.audit.record({ action: 'SUBJECT_UPDATED', entity: 'Subject', entityId: id, userId: actorId, schoolId });
    return subject;
  }

  async deleteSubject(id: string, schoolId: string, actorId: string) {
    const subject = await this.prisma.subject.findFirst({ where: { id, schoolId }, include: { _count: { select: { classRoutines: true, exams: true, homeworks: true, teacherAssignments: true } } } });
    if (!subject) throw new NotFoundException('Subject not found in your school.');
    if (Object.values(subject._count).some(count => count > 0)) throw new ConflictException('This subject is in use by routines, exams, homework, or teacher assignments. Remove or reassign those records first.');
    await this.prisma.subject.delete({ where: { id } });
    void this.audit.record({ action: 'SUBJECT_DELETED', entity: 'Subject', entityId: id, userId: actorId, schoolId });
    return { success: true };
  }

  async updateAcademicYear(id: string, data: { name?: string; startDate?: string; endDate?: string; isCurrent?: boolean }, schoolId: string, actorId: string) {
    const current = await this.prisma.academicYear.findFirst({ where: { id, schoolId } });
    if (!current) throw new NotFoundException('Academic year not found in your school.');
    const startDate = data.startDate ? new Date(data.startDate) : current.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : current.endDate;
    if (endDate <= startDate) throw new BadRequestException('Academic year end date must be after its start date.');
    const name = data.name?.trim();
    if (name && await this.prisma.academicYear.findFirst({ where: { schoolId, id: { not: id }, name: { equals: name, mode: 'insensitive' } }, select: { id: true } })) throw new ConflictException('An academic year with this name already exists.');
    const year = await this.prisma.$transaction(async tx => {
      if (data.isCurrent) await tx.academicYear.updateMany({ where: { schoolId, id: { not: id } }, data: { isCurrent: false } });
      return tx.academicYear.update({ where: { id }, data: { ...(name ? { name } : {}), startDate, endDate, ...(data.isCurrent !== undefined ? { isCurrent: data.isCurrent } : {}) } });
    });
    void this.audit.record({ action: 'ACADEMIC_YEAR_UPDATED', entity: 'AcademicYear', entityId: id, userId: actorId, schoolId });
    return year;
  }

  async deleteAcademicYear(id: string, schoolId: string, actorId: string) {
    const year = await this.prisma.academicYear.findFirst({ where: { id, schoolId }, include: { _count: { select: { enrollments: true, teacherAssignments: true } } } });
    if (!year) throw new NotFoundException('Academic year not found in your school.');
    if (year._count.enrollments || year._count.teacherAssignments) throw new ConflictException('This academic year has student enrollments or teacher assignments and cannot be deleted.');
    await this.prisma.academicYear.delete({ where: { id } });
    void this.audit.record({ action: 'ACADEMIC_YEAR_DELETED', entity: 'AcademicYear', entityId: id, userId: actorId, schoolId });
    return { success: true };
  }

  async deleteTeacherAssignment(id: string, schoolId: string, actorId: string) {
    const item = await this.prisma.teacherAssignment.findFirst({ where: { id, section: { schoolId } }, select: { id: true } });
    if (!item) throw new NotFoundException('Teacher assignment not found in your school.');
    await this.prisma.teacherAssignment.delete({ where: { id } });
    void this.audit.record({ action: 'TEACHER_ASSIGNMENT_REMOVED', entity: 'TeacherAssignment', entityId: id, userId: actorId, schoolId });
    return { success: true };
  }

  async updateTeacherAssignment(id: string, data: CreateTeacherAssignmentDto, schoolId: string, actorId: string) {
    const current = await this.prisma.teacherAssignment.findFirst({ where: { id, section: { schoolId } }, select: { id: true } });
    if (!current) throw new NotFoundException('Teacher assignment not found in your school.');
    const [teacher, section, subject, academicYear] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: data.teacherId, schoolId, role: Role.TEACHER, status: 'ACTIVE' }, select: { id: true } }),
      this.prisma.section.findFirst({ where: { id: data.sectionId, schoolId }, select: { id: true } }),
      this.prisma.subject.findFirst({ where: { id: data.subjectId, schoolId }, select: { id: true } }),
      this.prisma.academicYear.findFirst({ where: { id: data.academicYearId, schoolId }, select: { id: true } }),
    ]);
    if (!teacher || !section || !subject || !academicYear) throw new NotFoundException('Teacher, section, subject, or academic year was not found in your school.');
    if (await this.prisma.teacherAssignment.findFirst({ where: { id: { not: id }, teacherId: teacher.id, sectionId: section.id, subjectId: subject.id, academicYearId: academicYear.id }, select: { id: true } })) throw new ConflictException('This teacher is already assigned to that subject and section for this academic year.');
    const assignment = await this.prisma.teacherAssignment.update({ where: { id }, data: { teacherId: teacher.id, sectionId: section.id, subjectId: subject.id, academicYearId: academicYear.id } });
    void this.audit.record({ action: 'TEACHER_ASSIGNMENT_UPDATED', entity: 'TeacherAssignment', entityId: id, userId: actorId, schoolId });
    return assignment;
  }

  async normalizeDuplicateSections(schoolId: string, actorId: string) {
    const merged = await this.prisma.$transaction(async tx => {
      const rows = await tx.section.findMany({ where: { schoolId }, orderBy: [{ classId: 'asc' }, { name: 'asc' }] });
      const groups = new Map<string, typeof rows>();
      for (const row of rows) {
        const key = `${row.classId}:${row.name.trim().toLocaleLowerCase()}`;
        groups.set(key, [...(groups.get(key) || []), row]);
      }
      let count = 0;
      for (const group of groups.values()) {
        if (group.length < 2) continue;
        const canonical = group.find(row => row.name === row.name.toUpperCase()) || group[0];
        for (const duplicate of group.filter(row => row.id !== canonical.id)) {
          const enrollments = await tx.enrollment.findMany({ where: { sectionId: duplicate.id }, select: { id: true, studentId: true, academicYearId: true } });
          for (const enrollment of enrollments) {
            const existing = await tx.enrollment.findFirst({ where: { sectionId: canonical.id, studentId: enrollment.studentId, academicYearId: enrollment.academicYearId }, select: { id: true } });
            if (existing) throw new ConflictException('Duplicate sections contain a student enrolled in both. Resolve that student’s enrollment before merging sections.');
          }
          const assignments = await tx.teacherAssignment.findMany({ where: { sectionId: duplicate.id } });
          for (const assignment of assignments) {
            const existing = await tx.teacherAssignment.findFirst({ where: { sectionId: canonical.id, teacherId: assignment.teacherId, subjectId: assignment.subjectId, academicYearId: assignment.academicYearId }, select: { id: true } });
            if (existing) await tx.teacherAssignment.delete({ where: { id: assignment.id } });
            else await tx.teacherAssignment.update({ where: { id: assignment.id }, data: { sectionId: canonical.id } });
          }
          await tx.homework.updateMany({ where: { sectionId: duplicate.id }, data: { sectionId: canonical.id } });
          await tx.exam.updateMany({ where: { sectionId: duplicate.id }, data: { sectionId: canonical.id } });
          await tx.classRoutine.updateMany({ where: { sectionId: duplicate.id }, data: { sectionId: canonical.id } });
          await tx.enrollment.updateMany({ where: { sectionId: duplicate.id }, data: { sectionId: canonical.id } });
          await tx.section.delete({ where: { id: duplicate.id } });
          count++;
        }
        const preferredName = this.canonicalSectionName(canonical.name);
        if (canonical.name !== preferredName) await tx.section.update({ where: { id: canonical.id }, data: { name: preferredName } });
      }
      return count;
    });
    if (merged) void this.audit.record({ action: 'DUPLICATE_SECTIONS_MERGED', entity: 'Section', userId: actorId, schoolId, details: { mergedCount: merged } });
    return { merged };
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
