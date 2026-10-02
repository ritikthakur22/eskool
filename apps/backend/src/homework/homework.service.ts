import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Homework, HomeworkSubmission, Role } from '@prisma/client';
import { CreateHomeworkDto, SubmitHomeworkDto } from './dto/homework.dto.js';

@Injectable()
export class HomeworkService {
  constructor(private prisma: PrismaService) {}

  async createHomework(data: CreateHomeworkDto, actor: { id: string; schoolId: string; role: Role }): Promise<Homework> {
    if (actor.role === Role.TEACHER && data.sectionId) {
      const assignment = await this.prisma.teacherAssignment.findFirst({
        where: { teacherId: actor.id, sectionId: data.sectionId, subjectId: data.subjectId }
      });
      if (!assignment) throw new ForbiddenException('You are not assigned to teach this subject for this section.');
    }
    const dueDateObj = new Date(data.dueDate);
    return this.prisma.homework.create({ data: { title: data.title, description: data.description, dueDate: dueDateObj, subjectId: data.subjectId, sectionId: data.sectionId, teacherId: actor.id, schoolId: actor.schoolId } });
  }

  async getHomeworkForClass(sectionId: string, actor: { schoolId: string }): Promise<Homework[]> {
    return this.prisma.homework.findMany({
      where: { sectionId, schoolId: actor.schoolId },
      orderBy: { dueDate: 'asc' },
    });
  }

  async submitHomework(data: SubmitHomeworkDto, actor: { id: string; schoolId: string }): Promise<HomeworkSubmission> {
    const homework = await this.prisma.homework.findFirst({ where: { id: data.homeworkId, schoolId: actor.schoolId }, select: { id: true } });
    if (!homework) throw new NotFoundException('Homework not found in your school.');
    const existing = await this.prisma.homeworkSubmission.findFirst({ where: { homeworkId: homework.id, studentId: actor.id }, select: { id: true } });
    if (existing) throw new ForbiddenException('You have already submitted this homework.');
    return this.prisma.homeworkSubmission.create({ data: { homeworkId: homework.id, studentId: actor.id, content: data.content, fileUrl: data.fileUrl, status: 'SUBMITTED', schoolId: actor.schoolId } });
  }

  async gradeSubmission(id: string, grade: string, feedback: string, actor: { id: string; schoolId: string; role: Role }): Promise<HomeworkSubmission> {
    if (!grade || grade.length > 20 || feedback?.length > 2000) throw new ForbiddenException('Invalid grading data.');
    const whereClause: Prisma.HomeworkSubmissionWhereInput = { id, schoolId: actor.schoolId };
    if (actor.role === Role.TEACHER) {
      whereClause.homework = { teacherId: actor.id };
    }
    const submission = await this.prisma.homeworkSubmission.findFirst({ where: whereClause, select: { id: true } });
    if (!submission) throw new NotFoundException('Submission not found or you lack permission to grade it.');
    return this.prisma.homeworkSubmission.update({
      where: { id: submission.id },
      data: { grade, feedback, status: 'GRADED' },
    });
  }
}
