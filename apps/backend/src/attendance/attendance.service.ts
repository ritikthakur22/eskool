import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Attendance, Role } from '@prisma/client';
import { MarkAttendanceDto } from './dto/attendance.dto.js';
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
    const attendance = await this.prisma.attendance.create({ data: {
      studentId: student.id, teacherId: actor.role === Role.TEACHER ? actor.id : undefined,
      date: dateObj, status: data.status, subject: data.subject, remarks: data.remarks, schoolId: actor.schoolId
    } });
    void this.audit.record({ action: 'ATTENDANCE_MARKED', entity: 'Attendance', entityId: attendance.id, userId: actor.id, schoolId: actor.schoolId, details: { studentId: student.id, status: data.status } });
    return attendance;
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
}
