import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Homework, HomeworkSubmission, Role } from '@prisma/client';
import { CreateHomeworkDto, SubmitHomeworkDto } from './dto/homework.dto.js';

@Injectable()
export class HomeworkService {
  constructor(private prisma: PrismaService) {}

  async createHomework(data: CreateHomeworkDto, actor: { id: string; schoolId: string; role: Role }): Promise<Homework> {
    const section = await this.prisma.section.findFirst({ where: { id: data.sectionId, schoolId: actor.schoolId }, select: { id: true } });
    const subject = await this.prisma.subject.findFirst({ where: { id: data.subjectId, schoolId: actor.schoolId }, select: { id: true } });
    if (!section || !subject) throw new NotFoundException('Section or subject was not found in your school.');
    if (actor.role === Role.TEACHER) {
      const assignment = await this.prisma.teacherAssignment.findFirst({
        where: { teacherId: actor.id, sectionId: data.sectionId, subjectId: data.subjectId, section: { schoolId: actor.schoolId }, subject: { schoolId: actor.schoolId } },
      });
      if (!assignment) throw new ForbiddenException('You are not assigned to teach this subject for this section.');
    }
    const dueDateObj = new Date(data.dueDate);
    return this.prisma.homework.create({ data: { title: data.title, description: data.description, dueDate: dueDateObj, subjectId: data.subjectId, sectionId: data.sectionId, teacherId: actor.id, schoolId: actor.schoolId } });
  }

  async getHomeworkForClass(sectionId: string, actor: { id: string; schoolId: string; role: Role }): Promise<Homework[]> {
    const section = await this.prisma.section.findFirst({ where: { id: sectionId, schoolId: actor.schoolId }, select: { id: true } });
    if (!section) throw new NotFoundException('Section not found in your school.');
    if (actor.role === Role.STUDENT) {
      const enrollment = await this.prisma.enrollment.findFirst({ where: { studentId: actor.id, sectionId }, select: { id: true } });
      if (!enrollment) throw new ForbiddenException('You are not enrolled in this section.');
    }
    if (actor.role === Role.PARENT) {
      const linkedChild = await this.prisma.parentStudent.findFirst({ where: { parentId: actor.id, student: { enrollments: { some: { sectionId } } } }, select: { id: true } });
      if (!linkedChild) throw new ForbiddenException('No linked child is enrolled in this section.');
    }
    if (actor.role === Role.TEACHER) {
      const assignment = await this.prisma.teacherAssignment.findFirst({ where: { teacherId: actor.id, sectionId } });
      if (!assignment) throw new ForbiddenException('You are not assigned to this section.');
    }
    return this.prisma.homework.findMany({
      where: { sectionId, schoolId: actor.schoolId },
      orderBy: { dueDate: 'asc' },
    });
  }

  async submitHomework(data: SubmitHomeworkDto, actor: { id: string; schoolId: string }): Promise<HomeworkSubmission> {
    const homework = await this.prisma.homework.findFirst({ where: { id: data.homeworkId, schoolId: actor.schoolId }, select: { id: true, sectionId: true } });
    if (!homework) throw new NotFoundException('Homework not found in your school.');
    if (!homework.sectionId) throw new ForbiddenException('This homework is not assigned to a section.');
    const enrollment = await this.prisma.enrollment.findFirst({ where: { studentId: actor.id, sectionId: homework.sectionId }, select: { id: true } });
    if (!enrollment) throw new ForbiddenException('You are not enrolled in this homework section.');
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
