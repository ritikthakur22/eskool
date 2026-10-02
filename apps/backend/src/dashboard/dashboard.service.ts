import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(user: { id: string; role: Role; schoolId: string }) {
    if (user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN) {
      const [totalStudents, totalTeachers, activeNotices, totalClasses] = await Promise.all([
        this.prisma.user.count({ where: { schoolId: user.schoolId, role: Role.STUDENT, status: 'ACTIVE' } }),
        this.prisma.user.count({ where: { schoolId: user.schoolId, role: Role.TEACHER, status: 'ACTIVE' } }),
        this.prisma.notice.count({ where: { schoolId: user.schoolId } }),
        this.prisma.class.count({ where: { schoolId: user.schoolId } }),
      ]);
      return { kpis: { totalStudents, totalTeachers, activeNotices, totalClasses } };
    }
    
    if (user.role === Role.TEACHER) {
      const assignments = await this.prisma.teacherAssignment.findMany({
        where: { teacherId: user.id },
        include: {
          section: { include: { class: true } },
          subject: true,
          academicYear: true
        }
      });
      return { assignments };
    }

    return {};
  }
}
