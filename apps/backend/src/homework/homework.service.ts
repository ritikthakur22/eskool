import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Homework, HomeworkSubmission } from '@prisma/client';

@Injectable()
export class HomeworkService {
  constructor(private prisma: PrismaService) {}

  async createHomework(data: Prisma.HomeworkUncheckedCreateInput): Promise<Homework> {
    return this.prisma.homework.create({ data });
  }

  async getHomeworkForClass(classId: string): Promise<Homework[]> {
    return this.prisma.homework.findMany({
      where: { classId },
      orderBy: { dueDate: 'asc' },
    });
  }

  async submitHomework(data: Prisma.HomeworkSubmissionUncheckedCreateInput): Promise<HomeworkSubmission> {
    return this.prisma.homeworkSubmission.create({ data });
  }

  async gradeSubmission(id: string, grade: string, feedback: string): Promise<HomeworkSubmission> {
    return this.prisma.homeworkSubmission.update({
      where: { id },
      data: { grade, feedback, status: 'GRADED' },
    });
  }
}
