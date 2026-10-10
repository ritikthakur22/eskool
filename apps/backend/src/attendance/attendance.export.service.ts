import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AttendanceExportService {
  constructor(private prisma: PrismaService) {}

  async exportCsv(schoolId: string, sectionId?: string, month?: number, year?: number) {
    const where: any = { schoolId };
    
    // Optional filters
    if (sectionId) {
      // Find students in this section
      const enrollments = await this.prisma.enrollment.findMany({ where: { sectionId }, select: { studentId: true } });
      where.studentId = { in: enrollments.map(e => e.studentId) };
    }
    
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      where.date = { gte: start, lte: end };
    }

    const records = await this.prisma.attendance.findMany({
      where,
      include: {
        student: { include: { studentProfile: true } },
        teacher: { include: { teacherProfile: true, adminProfile: true } }, subject: true
      },
      orderBy: [{ date: 'desc' }, { student: { email: 'asc' } }]
    });

    const header = ['Date', 'Student Name', 'Roll No', 'Status', 'Subject', 'Teacher', 'Remarks'];
    const rows = records.map(r => {
      const studentName = [r.student.studentProfile?.firstName, r.student.studentProfile?.lastName].filter(Boolean).join(' ') || r.student.email;
      const rollNo = r.student.studentProfile?.rollNo || 'N/A';
      const teacherName = r.teacher ? ([r.teacher.teacherProfile?.firstName || r.teacher.adminProfile?.firstName, r.teacher.teacherProfile?.lastName || r.teacher.adminProfile?.lastName].filter(Boolean).join(' ') || r.teacher.email) : 'System';
      return [
        new Date(r.date).toLocaleDateString(),
        `"${studentName}"`,
        rollNo,
        r.status,
        r.subject?.name || '',
        `"${teacherName}"`,
        `"${r.remarks || ''}"`
      ].join(',');
    });

    return [header.join(','), ...rows].join('\n');
  }
}
