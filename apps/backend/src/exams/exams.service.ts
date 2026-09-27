import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Exam, ExamResult } from '@prisma/client';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async createExam(data: Prisma.ExamUncheckedCreateInput): Promise<Exam> {
    return this.prisma.exam.create({ data });
  }

  async addExamResult(data: Prisma.ExamResultUncheckedCreateInput): Promise<ExamResult> {
    return this.prisma.examResult.create({ data });
  }

  async getStudentResults(studentId: string): Promise<any[]> {
    const results = await this.prisma.examResult.findMany({
      where: { studentId },
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
