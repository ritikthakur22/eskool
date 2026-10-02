import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Exam, ExamResult, Role } from '@prisma/client';
import { CreateExamDto, AddExamResultDto } from './dto/exam.dto.js';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async createExam(data: CreateExamDto, actor: { id: string; schoolId: string; role: Role }): Promise<Exam> {
    const [section, subject] = await Promise.all([
      this.prisma.section.findFirst({ where: { id: data.sectionId, schoolId: actor.schoolId }, select: { id: true } }),
      this.prisma.subject.findFirst({ where: { id: data.subjectId, schoolId: actor.schoolId }, select: { id: true } }),
    ]);
    if (!section || !subject) throw new NotFoundException('Section or subject was not found in your school.');
    if (actor.role === Role.TEACHER) {
      const assignment = await this.prisma.teacherAssignment.findFirst({ where: { teacherId: actor.id, sectionId: data.sectionId, subjectId: data.subjectId } });
      if (!assignment) throw new ForbiddenException('You are not assigned to this subject and section.');
    }
    const dateObj = new Date(data.date);
    return this.prisma.exam.create({ data: { title: data.title, date: dateObj, sectionId: data.sectionId, subjectId: data.subjectId, schoolId: actor.schoolId } });
  }

  async addExamResult(data: AddExamResultDto, actor: { id: string; schoolId: string; role: Role }): Promise<ExamResult> {
    const exam = await this.prisma.exam.findFirst({ where: { id: data.examId, schoolId: actor.schoolId }, select: { id: true, sectionId: true, subjectId: true } });
    if (!exam) throw new NotFoundException('Exam not found in your school.');
    if (actor.role === Role.TEACHER) {
      const assignment = await this.prisma.teacherAssignment.findFirst({ where: { teacherId: actor.id, sectionId: exam.sectionId, subjectId: exam.subjectId } });
      if (!assignment) throw new ForbiddenException('You are not assigned to this exam.');
    }
    const student = await this.prisma.user.findFirst({ where: { id: data.studentId, schoolId: actor.schoolId, role: Role.STUDENT }, select: { id: true } });
    if (!student) throw new NotFoundException('Student not found in your school.');
    const enrollment = await this.prisma.enrollment.findFirst({ where: { studentId: student.id, sectionId: exam.sectionId }, select: { id: true } });
    if (!enrollment) throw new ForbiddenException('Student is not enrolled in this exam section.');
    if (!Number.isFinite(data.marksObtained) || !Number.isFinite(data.totalMarks) || data.marksObtained < 0 || data.totalMarks <= 0 || data.marksObtained > data.totalMarks) throw new ForbiddenException('Invalid exam marks.');
    return this.prisma.examResult.create({ data: { examId: data.examId, studentId: student.id, marksObtained: data.marksObtained, totalMarks: data.totalMarks, grade: data.grade, schoolId: actor.schoolId } });
  }

  async getStudentResults(studentId: string, actor: { id: string; schoolId: string; role: Role }): Promise<any[]> {
    if (actor.role === Role.STUDENT && actor.id !== studentId) throw new ForbiddenException('You can only view your own results.');
    if (actor.role === Role.PARENT) {
      const link = await this.prisma.parentStudent.findUnique({ where: { parentId_studentId: { parentId: actor.id, studentId } } });
      if (!link) throw new ForbiddenException('You are not linked to this student.');
    }
    const student = await this.prisma.user.findFirst({ where: { id: studentId, schoolId: actor.schoolId, role: Role.STUDENT }, select: { id: true } });
    if (!student) throw new NotFoundException('Student not found in your school.');
    const resultWhere: Prisma.ExamResultWhereInput = { studentId: student.id, schoolId: actor.schoolId };
    if (actor.role === Role.TEACHER) {
      const assignments = await this.prisma.teacherAssignment.findMany({ where: { teacherId: actor.id }, select: { sectionId: true, subjectId: true } });
      if (!assignments.length) return [];
      resultWhere.exam = { is: { OR: assignments.map(assignment => ({ sectionId: assignment.sectionId, subjectId: assignment.subjectId })) } };
    }
    const results = await this.prisma.examResult.findMany({
      where: resultWhere,
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
