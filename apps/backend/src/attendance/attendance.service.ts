import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Attendance, Role } from '@prisma/client';
import { BulkMarkAttendanceDto, CorrectAttendanceDto, MarkAttendanceDto } from './dto/attendance.dto.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService, private readonly audit: AuditService) {}

  async markAttendance(data: MarkAttendanceDto, actor: { id: string; schoolId: string; role: Role }): Promise<Attendance> {
    const student = await this.prisma.user.findFirst({ where: { id: data.studentId, schoolId: actor.schoolId, role: Role.STUDENT }, select: { id: true } });
    if (!student) throw new NotFoundException('Student not found in your school.');
    
    if (actor.role === Role.TEACHER) {
      const enrollments = await this.prisma.enrollment.findMany({ where: { studentId: student.id }, select: { sectionId: true } });
      const sectionIds = enrollments.map(e => e.sectionId);
      const assignment = await this.prisma.teacherAssignment.findFirst({ where: { teacherId: actor.id, sectionId: { in: sectionIds }, section: { schoolId: actor.schoolId } } });
      if (!assignment) throw new ForbiddenException('You are not assigned to teach this student.');
    }

    const dateObj = new Date(data.date);
    let attendance: Attendance;
    try {
      attendance = await this.prisma.attendance.create({ data: {
        studentId: student.id, teacherId: actor.id,
        date: dateObj, status: data.status, subject: data.subject, remarks: data.remarks, schoolId: actor.schoolId
      } });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Attendance has already been recorded for this student and date. Use correction instead.');
      throw error;
    }
    void this.audit.record({ action: 'ATTENDANCE_MARKED', entity: 'Attendance', entityId: attendance.id, userId: actor.id, schoolId: actor.schoolId, details: { studentId: student.id, status: data.status } });
    return attendance;
  }

  async bulkMarkAttendance(data: BulkMarkAttendanceDto, actor: { id: string; schoolId: string; role: Role }) {
    const section = await this.prisma.section.findFirst({
      where: { id: data.sectionId, schoolId: actor.schoolId, ...(actor.role === Role.TEACHER ? { teacherAssignments: { some: { teacherId: actor.id, ...(data.subjectId ? { subjectId: data.subjectId } : {}) } } } : {}) },
      select: { id: true },
    });
    if (!section) throw new ForbiddenException('You are not assigned to this attendance section.');
    if (actor.role === Role.TEACHER && !data.subjectId) throw new ForbiddenException('Teachers must select an assigned subject.');
    let subjectName: string | null = null;
    if (data.subjectId) {
      const subject = await this.prisma.subject.findFirst({ where: { id: data.subjectId, schoolId: actor.schoolId }, select: { name: true } });
      if (!subject) throw new NotFoundException('Subject not found in your school.');
      subjectName = subject.name;
    }
    const studentIds = [...new Set(data.records.map(record => record.studentId))];
    const enrolled = await this.prisma.enrollment.findMany({ where: { sectionId: section.id, studentId: { in: studentIds }, student: { schoolId: actor.schoolId, role: Role.STUDENT, status: 'ACTIVE' } }, select: { studentId: true } });
    if (enrolled.length !== studentIds.length) throw new ForbiddenException('Every selected student must be active and enrolled in this section.');
    const date = new Date(data.date);
    try {
      const result = await this.prisma.$transaction(tx => tx.attendance.createMany({ data: data.records.map(record => ({ studentId: record.studentId, teacherId: actor.id, schoolId: actor.schoolId, date, status: record.status, subject: subjectName, remarks: record.remarks?.trim() || null })) }));
      void this.audit.record({ action: 'ATTENDANCE_BULK_MARKED', entity: 'Attendance', userId: actor.id, schoolId: actor.schoolId, details: { sectionId: section.id, date: date.toISOString(), count: result.count } });
      return { count: result.count, date };
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('At least one student already has attendance for this date. Use correction instead.');
      throw error;
    }
  }

  async getStudentAttendance(studentId: string, month: number | undefined, year: number | undefined, actor: { id: string; schoolId: string; role: Role }): Promise<Attendance[]> {
    if (actor.role === Role.STUDENT && actor.id !== studentId) throw new ForbiddenException('You can only view your own attendance.');
    if (actor.role === Role.PARENT) {
      const link = await this.prisma.parentStudent.findUnique({ where: { parentId_studentId: { parentId: actor.id, studentId } } });
      if (!link) throw new ForbiddenException('You are not linked to this student.');
    }
    const student = await this.prisma.user.findFirst({ where: { id: studentId, schoolId: actor.schoolId, role: Role.STUDENT }, select: { id: true } });
    if (!student) throw new NotFoundException('Student not found in your school.');
    const whereClause: Prisma.AttendanceWhereInput = { studentId: student.id, schoolId: actor.schoolId };
    if (actor.role === Role.TEACHER) {
      const enrollments = await this.prisma.enrollment.findMany({ where: { studentId: student.id }, select: { sectionId: true } });
      const assignments = await this.prisma.teacherAssignment.findMany({ where: { teacherId: actor.id, sectionId: { in: enrollments.map(enrollment => enrollment.sectionId) }, section: { schoolId: actor.schoolId } }, select: { id: true } });
      if (!assignments.length) throw new ForbiddenException('You are not assigned to this student.');
    }
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);
      whereClause.date = {
        gte: startDate,
        lt: endDate,
      };
    }

    return this.prisma.attendance.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    });
  }

  async getSchoolRegister(filters: { schoolId: string; date?: string; startDate?: string; endDate?: string; sectionId?: string; actorId?: string; actorRole?: Role }) {
    const where: Prisma.AttendanceWhereInput = { schoolId: filters.schoolId };
    if (filters.date) {
      const start = new Date(`${filters.date}T00:00:00.000Z`);
      if (Number.isNaN(start.getTime())) throw new NotFoundException('Use a valid date in YYYY-MM-DD format.');
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);
      where.date = { gte: start, lt: end };
    } else if (filters.startDate && filters.endDate) {
      const start = new Date(`${filters.startDate}T00:00:00.000Z`);
      const end = new Date(`${filters.endDate}T23:59:59.999Z`);
      where.date = { gte: start, lte: end };
    }
    const sectionScope = filters.sectionId
      ? { sectionId: filters.sectionId, section: { schoolId: filters.schoolId, ...(filters.actorRole === Role.TEACHER && filters.actorId ? { teacherAssignments: { some: { teacherId: filters.actorId } } } : {}) } }
      : { section: { schoolId: filters.schoolId, ...(filters.actorRole === Role.TEACHER && filters.actorId ? { teacherAssignments: { some: { teacherId: filters.actorId } } } : {}) } };
    where.student = { enrollments: { some: sectionScope } };
    const records = await this.prisma.attendance.findMany({
      where,
      orderBy: [{ date: 'desc' }, { student: { studentProfile: { lastName: 'asc' } } }],
      take: 2500,
      select: {
        id: true, date: true, status: true, subject: true, remarks: true, createdAt: true, updatedAt: true,
        student: { select: { id: true, email: true, studentProfile: { select: { firstName: true, lastName: true, rollNo: true, grade: true, section: true } } } },
        teacher: { select: { id: true, email: true, teacherProfile: { select: { firstName: true, lastName: true } }, adminProfile: { select: { firstName: true, lastName: true } } } },
      },
    });
    
    let students: any[] = [];
    if (filters.sectionId) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: sectionScope,
        select: {
          studentId: true,
          rollNo: true,
          student: { select: { email: true, studentProfile: { select: { firstName: true, lastName: true, rollNo: true, grade: true, section: true } } } }
        },
        orderBy: [{ rollNo: 'asc' }, { student: { studentProfile: { lastName: 'asc' } } }]
      });
      students = enrollments;
    }
    
    return { students, records };
  }

  async correctAttendance(id: string, data: CorrectAttendanceDto, actor: { id: string; schoolId: string; role: Role }) {
    const record = await this.prisma.attendance.findFirst({
      where: { id, schoolId: actor.schoolId },
      select: { id: true, studentId: true, teacherId: true, status: true, remarks: true, date: true, subject: true },
    });
    if (!record) throw new NotFoundException('Attendance record not found in your school.');
    if (actor.role === Role.TEACHER) {
      const enrollments = await this.prisma.enrollment.findMany({ where: { studentId: record.studentId }, select: { sectionId: true } });
      const assignments = await this.prisma.teacherAssignment.findMany({ where: { teacherId: actor.id, sectionId: { in: enrollments.map(item => item.sectionId) }, section: { schoolId: actor.schoolId } }, select: { id: true } });
      if (!assignments.length) throw new ForbiddenException('You are not assigned to this student.');
    }
    const updated = await this.prisma.attendance.update({ where: { id: record.id }, data: { status: data.status, remarks: data.remarks?.trim() || null, teacherId: actor.id } });
    void this.audit.record({ action: 'ATTENDANCE_CORRECTED', entity: 'Attendance', entityId: record.id, userId: actor.id, schoolId: actor.schoolId, details: {
      reason: data.reason.trim(), before: { status: record.status, remarks: record.remarks }, after: { status: updated.status, remarks: updated.remarks }, studentId: record.studentId, date: record.date.toISOString(), subject: record.subject,
    } });
    return updated;
  }
}
