import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Attendance, Role } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async markAttendance(data: Prisma.AttendanceUncheckedCreateInput, actor: { id: string; schoolId: string; role: Role }): Promise<Attendance> {
    const student = await this.prisma.user.findFirst({ where: { id: data.studentId, schoolId: actor.schoolId, role: Role.STUDENT }, select: { id: true } });
    if (!student) throw new NotFoundException('Student not found in your school.');
    return this.prisma.attendance.create({ data: {
      studentId: student.id, teacherId: actor.role === Role.TEACHER ? actor.id : undefined,
      date: data.date, status: data.status, subject: data.subject, remarks: data.remarks,
    } });
  }

  async getStudentAttendance(studentId: string, month: number | undefined, year: number | undefined, actor: { id: string; schoolId: string; role: Role }): Promise<Attendance[]> {
    if (actor.role === Role.STUDENT && actor.id !== studentId) throw new ForbiddenException('You can only view your own attendance.');
    const student = await this.prisma.user.findFirst({ where: { id: studentId, schoolId: actor.schoolId, role: Role.STUDENT }, select: { id: true } });
    if (!student) throw new NotFoundException('Student not found in your school.');
    let whereClause: Prisma.AttendanceWhereInput = { studentId: student.id };
    
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
