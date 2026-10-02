import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Exam, ExamResult, Role } from '@prisma/client';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async createExam(data: Prisma.ExamUncheckedCreateInput, actor: { id: string; schoolId: string }): Promise<Exam> {
    return this.prisma.exam.create({ data: { title: data.title, date: data.date, sectionId: data.sectionId, subjectId: data.subjectId, schoolId: actor.schoolId } });
  }

  async addExamResult(data: Prisma.ExamResultUncheckedCreateInput, actor: { schoolId: string }): Promise<ExamResult> {
    const student = await this.prisma.user.findFirst({ where: { id: data.studentId, schoolId: actor.schoolId, role: Role.STUDENT }, select: { id: true } });
    if (!student) throw new NotFoundException('Student not found in your school.');
    if (!Number.isFinite(data.marksObtained) || !Number.isFinite(data.totalMarks) || data.marksObtained < 0 || data.totalMarks <= 0 || data.marksObtained > data.totalMarks) throw new ForbiddenException('Invalid exam marks.');
    return this.prisma.examResult.create({ data: { examId: data.examId, studentId: student.id, marksObtained: data.marksObtained, totalMarks: data.totalMarks, grade: data.grade, schoolId: actor.schoolId } });
  }

  async getStudentResults(studentId: string, actor: { id: string; schoolId: string; role: Role }): Promise<any[]> {
    if (actor.role === Role.STUDENT && actor.id !== studentId) throw new ForbiddenException('You can only view your own results.');
    const student = await this.prisma.user.findFirst({ where: { id: studentId, schoolId: actor.schoolId, role: Role.STUDENT }, select: { id: true } });
    if (!student) throw new NotFoundException('Student not found in your school.');
    const results = await this.prisma.examResult.findMany({
      where: { studentId: student.id },
      include: { exam: true },
      orderBy: { exam: { date: 'desc' } }
    });

    // Group by exam
    const grouped = results.reduce((acc, curr) => {
      const examId = curr.examId;
      if (!acc[examId]) {
        acc[examId] = {
          exam: curr.exam,
          results: []
        };
      }
      acc[examId].results.push(curr);
      return acc;
    }, {} as any);

    return Object.values(grouped);
  }
}
