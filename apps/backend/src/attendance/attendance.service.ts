import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Attendance } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async markAttendance(data: Prisma.AttendanceUncheckedCreateInput): Promise<Attendance> {
    return this.prisma.attendance.create({ data });
  }

  async getStudentAttendance(studentId: string, month?: number, year?: number): Promise<Attendance[]> {
    let whereClause: Prisma.AttendanceWhereInput = { studentId };
    
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
