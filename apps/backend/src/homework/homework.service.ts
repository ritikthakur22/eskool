import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Homework, HomeworkSubmission, Role } from '@prisma/client';

@Injectable()
export class HomeworkService {
  constructor(private prisma: PrismaService) {}

  async createHomework(data: Prisma.HomeworkUncheckedCreateInput, actor: { id: string }): Promise<Homework> {
    return this.prisma.homework.create({ data: { title: data.title, description: data.description, dueDate: data.dueDate, subject: data.subject, classId: data.classId, teacherId: actor.id } });
  }

  async getHomeworkForClass(classId: string, actor: { schoolId: string }): Promise<Homework[]> {
    return this.prisma.homework.findMany({
      where: { classId, teacher: { schoolId: actor.schoolId } },
      orderBy: { dueDate: 'asc' },
    });
  }

  async submitHomework(data: Prisma.HomeworkSubmissionUncheckedCreateInput, actor: { id: string; schoolId: string }): Promise<HomeworkSubmission> {
    const homework = await this.prisma.homework.findFirst({ where: { id: data.homeworkId, teacher: { schoolId: actor.schoolId } }, select: { id: true } });
    if (!homework) throw new NotFoundException('Homework not found in your school.');
    const existing = await this.prisma.homeworkSubmission.findFirst({ where: { homeworkId: homework.id, studentId: actor.id }, select: { id: true } });
    if (existing) throw new ForbiddenException('You have already submitted this homework.');
    return this.prisma.homeworkSubmission.create({ data: { homeworkId: homework.id, studentId: actor.id, content: data.content, fileUrl: data.fileUrl, status: 'SUBMITTED' } });
  }

  async gradeSubmission(id: string, grade: string, feedback: string, actor: { schoolId: string; role: Role }): Promise<HomeworkSubmission> {
    if (!grade || grade.length > 20 || feedback?.length > 2000) throw new ForbiddenException('Invalid grading data.');
    const submission = await this.prisma.homeworkSubmission.findFirst({ where: { id, homework: { teacher: { schoolId: actor.schoolId } } }, select: { id: true } });
    if (!submission) throw new NotFoundException('Submission not found in your school.');
    return this.prisma.homeworkSubmission.update({
      where: { id: submission.id },
      data: { grade, feedback, status: 'GRADED' },
    });
  }
}
