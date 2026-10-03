import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Exam, ExamResult, Role } from '@prisma/client';
import { CreateExamDto, AddExamResultDto, UpdateExamDto, CreateQuestionDto, UpdateQuestionDto, SubmitAnswerDto } from './dto/exam.dto.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService, private readonly audit: AuditService) {}

  async createExam(data: CreateExamDto, actor: { id: string; schoolId: string; role: Role }): Promise<Exam> {
    const [section, subject] = await Promise.all([
      this.prisma.section.findFirst({ where: { id: data.sectionId, schoolId: actor.schoolId }, select: { id: true } }),
      this.prisma.subject.findFirst({ where: { id: data.subjectId, schoolId: actor.schoolId }, select: { id: true } }),
    ]);
    if (!section || !subject) throw new NotFoundException('Section or subject was not found in your school.');
    if (actor.role === Role.TEACHER) {
      const assignment = await this.prisma.teacherAssignment.findFirst({ where: { teacherId: actor.id, sectionId: data.sectionId, subjectId: data.subjectId, section: { schoolId: actor.schoolId }, subject: { schoolId: actor.schoolId } } });
      if (!assignment) throw new ForbiddenException('You are not assigned to this subject and section.');
    }
    const dateObj = new Date(data.date);
    const exam = await this.prisma.exam.create({ data: { title: data.title, date: dateObj, sectionId: data.sectionId, subjectId: data.subjectId, schoolId: actor.schoolId } });
    void this.audit.record({ action: 'EXAM_CREATED', entity: 'Exam', entityId: exam.id, userId: actor.id, schoolId: actor.schoolId, details: { sectionId: data.sectionId, subjectId: data.subjectId } });
    return exam;
  }

  async addExamResult(data: AddExamResultDto, actor: { id: string; schoolId: string; role: Role }): Promise<ExamResult> {
    const exam = await this.prisma.exam.findFirst({ where: { id: data.examId, schoolId: actor.schoolId }, select: { id: true, sectionId: true, subjectId: true } });
    if (!exam) throw new NotFoundException('Exam not found in your school.');
    if (actor.role === Role.TEACHER) {
      const assignment = await this.prisma.teacherAssignment.findFirst({ where: { teacherId: actor.id, sectionId: exam.sectionId, subjectId: exam.subjectId, section: { schoolId: actor.schoolId }, subject: { schoolId: actor.schoolId } } });
      if (!assignment) throw new ForbiddenException('You are not assigned to this exam.');
    }
    const student = await this.prisma.user.findFirst({ where: { id: data.studentId, schoolId: actor.schoolId, role: Role.STUDENT }, select: { id: true } });
    if (!student) throw new NotFoundException('Student not found in your school.');
    const enrollment = await this.prisma.enrollment.findFirst({ where: { studentId: student.id, sectionId: exam.sectionId }, select: { id: true } });
    if (!enrollment) throw new ForbiddenException('Student is not enrolled in this exam section.');
    if (!Number.isFinite(data.marksObtained) || !Number.isFinite(data.totalMarks) || data.marksObtained < 0 || data.totalMarks <= 0 || data.marksObtained > data.totalMarks) throw new ForbiddenException('Invalid exam marks.');
    const existing = await this.prisma.examResult.findUnique({ where: { examId_studentId: { examId: data.examId, studentId: student.id } }, select: { id: true, marksObtained: true, totalMarks: true, grade: true } });
    const result = existing
      ? await this.prisma.examResult.update({ where: { id: existing.id }, data: { marksObtained: data.marksObtained, totalMarks: data.totalMarks, grade: data.grade } })
      : await this.prisma.examResult.create({ data: { examId: data.examId, studentId: student.id, marksObtained: data.marksObtained, totalMarks: data.totalMarks, grade: data.grade, schoolId: actor.schoolId } });
    void this.audit.record({ action: existing ? 'EXAM_RESULT_UPDATED' : 'EXAM_RESULT_ADDED', entity: 'ExamResult', entityId: result.id, userId: actor.id, schoolId: actor.schoolId, details: { examId: data.examId, studentId: student.id, before: existing || null, after: { marksObtained: result.marksObtained, totalMarks: result.totalMarks, grade: result.grade } } });
    return result;
  }

  async getManagedExams(actor: { id: string; schoolId: string; role: Role }) {
    const where: Prisma.ExamWhereInput = { schoolId: actor.schoolId };
    if (actor.role === Role.TEACHER) {
      const assignments = await this.prisma.teacherAssignment.findMany({ where: { teacherId: actor.id, section: { schoolId: actor.schoolId } }, select: { sectionId: true, subjectId: true } });
      const validAssignments = assignments.filter(a => a.subjectId != null);
      if (validAssignments.length === 0) return [];
      where.OR = validAssignments.map(item => ({ sectionId: item.sectionId, subjectId: item.subjectId as string }));
    }
    return this.prisma.exam.findMany({ where, include: { subject: true, section: { include: { class: true } }, results: { select: { id: true, studentId: true, marksObtained: true, totalMarks: true, grade: true } } }, orderBy: { date: 'asc' }, take: 200 });
  }

  async updateExam(id: string, data: UpdateExamDto, actor: { id: string; schoolId: string; role: Role }) {
    const exam = await this.prisma.exam.findFirst({ where: { id, schoolId: actor.schoolId }, select: { id: true, title: true, date: true, sectionId: true, subjectId: true } });
    if (!exam) throw new NotFoundException('Exam not found in your school.');
    if (actor.role === Role.TEACHER) {
      const assignment = await this.prisma.teacherAssignment.findFirst({ where: { teacherId: actor.id, sectionId: exam.sectionId, subjectId: exam.subjectId, section: { schoolId: actor.schoolId }, subject: { schoolId: actor.schoolId } }, select: { id: true } });
      if (!assignment) throw new ForbiddenException('You are not assigned to this exam.');
    }
    const updated = await this.prisma.exam.update({ where: { id }, data: { ...(data.title !== undefined ? { title: data.title.trim() } : {}), ...(data.date !== undefined ? { date: new Date(data.date) } : {}) } });
    void this.audit.record({ action: 'EXAM_UPDATED', entity: 'Exam', entityId: id, userId: actor.id, schoolId: actor.schoolId, details: { before: { title: exam.title, date: exam.date.toISOString() }, after: { title: updated.title, date: updated.date.toISOString() } } });
    return updated;
  }

  async getExamsForStudent(studentId: string, schoolId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId, student: { schoolId, role: Role.STUDENT } },
      select: { sectionId: true },
    });
    if (!enrollments.length) return [];
    return this.prisma.exam.findMany({
      where: { schoolId, sectionId: { in: enrollments.map(enrollment => enrollment.sectionId) } },
      include: { subject: { select: { name: true, code: true } } },
      orderBy: { date: 'asc' },
      take: 100,
    });
  }

  async getExamsForLinkedChild(studentId: string, actor: { id: string; schoolId: string; role: Role }) {
    if (actor.role !== Role.PARENT) throw new ForbiddenException('Only parents can use the linked-child exam view.');
    const link = await this.prisma.parentStudent.findUnique({ where: { parentId_studentId: { parentId: actor.id, studentId } }, select: { id: true } });
    if (!link) throw new ForbiddenException('You are not linked to this student.');
    return this.getExamsForStudent(studentId, actor.schoolId);
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
      const assignments = await this.prisma.teacherAssignment.findMany({ where: { teacherId: actor.id, section: { schoolId: actor.schoolId }, subject: { schoolId: actor.schoolId } }, select: { sectionId: true, subjectId: true } });
      if (!assignments.length) return [];
      resultWhere.exam = { is: { OR: assignments.map(assignment => ({ sectionId: assignment.sectionId, subjectId: assignment.subjectId })) } };
    }
    const results = await this.prisma.examResult.findMany({
      where: resultWhere,
      include: { exam: { include: { subject: { select: { name: true, code: true } } } } },
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

  async addQuestion(examId: string, data: CreateQuestionDto, actor: { id: string; schoolId: string; role: Role }) {
    const exam = await this.prisma.exam.findFirst({ where: { id: examId, schoolId: actor.schoolId } });
    if (!exam) throw new NotFoundException('Exam not found.');
    if (actor.role === Role.TEACHER) {
      const assignment = await this.prisma.teacherAssignment.findFirst({ where: { teacherId: actor.id, sectionId: exam.sectionId, subjectId: exam.subjectId } });
      if (!assignment) throw new ForbiddenException('Not assigned to this exam.');
    }
    return this.prisma.examQuestion.create({
      data: {
        examId,
        text: data.text,
        options: data.options,
        correctOptionIndex: data.correctOptionIndex,
        marks: data.marks
      }
    });
  }

  async updateQuestion(questionId: string, data: UpdateQuestionDto, actor: { id: string; schoolId: string; role: Role }) {
    const question = await this.prisma.examQuestion.findUnique({ where: { id: questionId }, include: { exam: true } });
    if (!question || question.exam.schoolId !== actor.schoolId) throw new NotFoundException('Question not found.');
    if (actor.role === Role.TEACHER) {
      const assignment = await this.prisma.teacherAssignment.findFirst({ where: { teacherId: actor.id, sectionId: question.exam.sectionId, subjectId: question.exam.subjectId } });
      if (!assignment) throw new ForbiddenException('Not assigned to this exam.');
    }
    return this.prisma.examQuestion.update({
      where: { id: questionId },
      data: { ...data }
    });
  }

  async deleteQuestion(questionId: string, actor: { id: string; schoolId: string; role: Role }) {
    const question = await this.prisma.examQuestion.findUnique({ where: { id: questionId }, include: { exam: true } });
    if (!question || question.exam.schoolId !== actor.schoolId) throw new NotFoundException('Question not found.');
    if (actor.role === Role.TEACHER) {
      const assignment = await this.prisma.teacherAssignment.findFirst({ where: { teacherId: actor.id, sectionId: question.exam.sectionId, subjectId: question.exam.subjectId } });
      if (!assignment) throw new ForbiddenException('Not assigned to this exam.');
    }
    await this.prisma.examQuestion.delete({ where: { id: questionId } });
    return { success: true };
  }

  async startAttempt(examId: string, actor: { id: string; schoolId: string; role: Role }) {
    const exam = await this.prisma.exam.findFirst({ where: { id: examId, schoolId: actor.schoolId } });
    if (!exam) throw new NotFoundException('Exam not found.');
    const enrollment = await this.prisma.enrollment.findFirst({ where: { studentId: actor.id, sectionId: exam.sectionId } });
    if (!enrollment) throw new ForbiddenException('Not enrolled in this exam section.');
    
    const existing = await this.prisma.examAttempt.findUnique({ where: { examId_studentId: { examId, studentId: actor.id } } });
    if (existing) {
      if (existing.completedAt) throw new BadRequestException('Exam already completed.');
      return existing;
    }
    
    return this.prisma.examAttempt.create({
      data: {
        examId,
        studentId: actor.id,
        answers: {}
      }
    });
  }

  async saveAnswer(attemptId: string, data: SubmitAnswerDto, actor: { id: string; schoolId: string; role: Role }) {
    const attempt = await this.prisma.examAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.studentId !== actor.id) throw new NotFoundException('Attempt not found.');
    if (attempt.completedAt) throw new BadRequestException('Exam already completed.');
    
    const answers = (attempt.answers as Record<string, number>) || {};
    answers[data.questionId] = data.selectedOptionIndex;
    
    return this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: { answers: answers as any }
    });
  }

  async finishAttempt(attemptId: string, actor: { id: string; schoolId: string; role: Role }) {
    const attempt = await this.prisma.examAttempt.findUnique({ where: { id: attemptId }, include: { exam: true } });
    if (!attempt || attempt.studentId !== actor.id) throw new NotFoundException('Attempt not found.');
    if (attempt.completedAt) throw new BadRequestException('Exam already completed.');

    const questions = await this.prisma.examQuestion.findMany({ where: { examId: attempt.examId } });
    const answers = (attempt.answers as Record<string, number>) || {};
    
    let marksObtained = 0;
    let totalMarks = 0;

    for (const q of questions) {
      totalMarks += q.marks;
      if (answers[q.id] === q.correctOptionIndex) {
        marksObtained += q.marks;
      }
    }

    const completedAttempt = await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        completedAt: new Date(),
        score: marksObtained,
      }
    });

    const grade = totalMarks > 0 && (marksObtained / totalMarks) >= 0.4 ? 'PASS' : 'FAIL';

    const existingResult = await this.prisma.examResult.findUnique({
      where: { examId_studentId: { examId: attempt.examId, studentId: actor.id } }
    });

    if (existingResult) {
      await this.prisma.examResult.update({
        where: { id: existingResult.id },
        data: { marksObtained, totalMarks, grade }
      });
    } else {
      await this.prisma.examResult.create({
        data: {
          examId: attempt.examId,
          studentId: actor.id,
          marksObtained,
          totalMarks,
          grade,
          schoolId: attempt.exam.schoolId
        }
      });
    }

    return completedAttempt;
  }

  async getQuestions(examId: string, actor: { id: string; schoolId: string; role: Role }) {
    const exam = await this.prisma.exam.findFirst({ where: { id: examId, schoolId: actor.schoolId } });
    if (!exam) throw new NotFoundException('Exam not found.');

    const questions = await this.prisma.examQuestion.findMany({
      where: { examId },
      orderBy: { id: 'asc' }
    });

    if (actor.role === Role.STUDENT) {
      return questions.map(q => {
        const { correctOptionIndex, ...rest } = q;
        return rest;
      });
    }

    return questions;
  }
}
