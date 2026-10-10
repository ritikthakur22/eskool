import { ForbiddenException, Injectable, NotFoundException, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Exam, ExamResult, Role } from '@prisma/client';
import { CreateExamDto, AddExamResultDto, UpdateExamDto, CreateQuestionDto, UpdateQuestionDto, SubmitAnswerDto, UpdateAssessmentSchemeDto, BulkExamResultsDto, assessmentCategories } from './dto/exam.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { CloudinaryService } from '../storage/cloudinary.service.js';
import ExcelJS from 'exceljs';
import { calculateWeightedPercentage, gradeBandForPercentage } from './assessment-calculation.js';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService, private readonly audit: AuditService, private readonly cloudinary: CloudinaryService) {}

  async createExam(data: CreateExamDto, actor: { id: string; schoolId: string; role: Role }): Promise<Exam> {
    const [section, subject] = await Promise.all([
      this.prisma.section.findFirst({ where: { id: data.sectionId, schoolId: actor.schoolId }, select: { id: true, classId: true } }),
      this.prisma.subject.findFirst({ where: { id: data.subjectId, schoolId: actor.schoolId }, select: { id: true } }),
    ]);
    if (!section || !subject) throw new NotFoundException('Section or subject was not found in your school.');
    if (actor.role === Role.TEACHER) {
      const assignment = await this.prisma.teacherAssignment.findFirst({ where: { teacherId: actor.id, sectionId: data.sectionId, subjectId: data.subjectId, section: { schoolId: actor.schoolId }, subject: { schoolId: actor.schoolId } } });
      if (!assignment) throw new ForbiddenException('You are not assigned to this subject and section.');
    }
    const schemeSnapshot = await this.getAssessmentScheme(section.classId, actor.schoolId);
    const dateObj = new Date(data.date);
    const exam = await this.prisma.exam.create({ data: { title: data.title, date: dateObj, sectionId: data.sectionId, subjectId: data.subjectId, assessmentCategory: data.assessmentCategory || 'OTHER', assessmentSnapshot: { categoryWeights: schemeSnapshot.categoryWeights, gradeBands: schemeSnapshot.gradeBands }, type: data.type || 'STANDARD', startTime: data.startTime || null, endTime: data.endTime || null, venue: data.venue || null, durationMinutes: data.durationMinutes || null, schoolId: actor.schoolId } });
    void this.audit.record({ action: 'EXAM_CREATED', entity: 'Exam', entityId: exam.id, userId: actor.id, schoolId: actor.schoolId, details: { sectionId: data.sectionId, subjectId: data.subjectId, assessmentCategory: data.assessmentCategory || 'OTHER' } });
    return exam;
  }

  async getExamRoutineDocuments(sectionId: string, actor: { id: string; schoolId: string; role: Role }) {
    const section = await this.prisma.section.findFirst({ where: { id: sectionId, schoolId: actor.schoolId }, select: { id: true } });
    if (!section) throw new NotFoundException('Class section not found in your school.');
    if (actor.role === Role.STUDENT && !await this.prisma.enrollment.findFirst({ where: { studentId: actor.id, sectionId }, select: { id: true } })) throw new ForbiddenException('You are not enrolled in this exam section.');
    if (actor.role === Role.TEACHER && !await this.prisma.teacherAssignment.findFirst({ where: { teacherId: actor.id, sectionId }, select: { id: true } })) throw new ForbiddenException('You are not assigned to this section.');
    return (this.prisma as any).examRoutineDocument.findMany({ where: { schoolId: actor.schoolId, sectionId }, orderBy: { createdAt: 'desc' }, take: 20 });
  }

  async getMyExamRoutineDocuments(actor: { id: string; schoolId: string }) {
    const enrollments: any[] = await this.prisma.enrollment.findMany({ where: { studentId: actor.id, student: { schoolId: actor.schoolId, role: Role.STUDENT } }, select: { sectionId: true } });
    if (!enrollments.length) return [];
    return (this.prisma as any).examRoutineDocument.findMany({ where: { schoolId: actor.schoolId, sectionId: { in: enrollments.map((item: any) => item.sectionId) } }, orderBy: { createdAt: 'desc' }, take: 20 });
  }

  async getChildExamRoutineDocuments(studentId: string, actor: { id: string; schoolId: string; role: Role }) {
    const link = await this.prisma.parentStudent.findUnique({ where: { parentId_studentId: { parentId: actor.id, studentId } }, select: { id: true } });
    if (!link) throw new ForbiddenException('You are not linked to this student.');
    const enrollments: any[] = await this.prisma.enrollment.findMany({ where: { studentId, student: { schoolId: actor.schoolId, role: Role.STUDENT } }, select: { sectionId: true } });
    return (this.prisma as any).examRoutineDocument.findMany({ where: { schoolId: actor.schoolId, sectionId: { in: enrollments.map((item: any) => item.sectionId) } }, orderBy: { createdAt: 'desc' }, take: 20 });
  }

  async uploadExamRoutineDocument(sectionId: string, title: string, file: { buffer: Buffer; mimetype: string }, actor: { id: string; schoolId: string; role: Role }) {
    if (!this.cloudinary.isConfigured()) throw new ServiceUnavailableException('Cloudinary storage is not configured.');
    const section = await this.prisma.section.findFirst({ where: { id: sectionId, schoolId: actor.schoolId }, select: { id: true } });
    if (!section) throw new NotFoundException('Class section not found in your school.');
    if (actor.role === Role.TEACHER && !await this.prisma.teacherAssignment.findFirst({ where: { teacherId: actor.id, sectionId }, select: { id: true } })) throw new ForbiddenException('You are not assigned to this section.');
    const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';
    const uploaded = await this.cloudinary.upload(file.buffer, { folder: `eskool/exam-routines/${actor.schoolId}`, resourceType });
    return (this.prisma as any).examRoutineDocument.create({ data: { schoolId: actor.schoolId, sectionId, title: title.trim().slice(0, 100) || 'Exam routine', url: uploaded.secure_url, mimeType: file.mimetype, publicId: uploaded.public_id, uploadedById: actor.id } });
  }

  async getAssessmentScheme(classId: string, schoolId: string) {
    const classRecord = await this.prisma.class.findFirst({ where: { id: classId, schoolId }, select: { id: true, name: true } });
    if (!classRecord) throw new NotFoundException('Class not found in your school.');
    const saved = await (this.prisma as any).assessmentScheme.findUnique({ where: { schoolId_classId: { schoolId, classId } } });
    return saved || {
      id: null, schoolId, classId, className: classRecord.name,
      categoryWeights: { TERMINAL_1: 10, TERMINAL_2: 10, TERMINAL_3: 10, FINAL: 70 },
      gradeBands: [], templateUrl: null, templateName: null,
    };
  }

  async updateAssessmentScheme(classId: string, data: UpdateAssessmentSchemeDto, actor: { id: string; schoolId: string }) {
    const classRecord = await this.prisma.class.findFirst({ where: { id: classId, schoolId: actor.schoolId }, select: { id: true } });
    if (!classRecord) throw new NotFoundException('Class not found in your school.');
    const terminalKeys = ['TERMINAL_1', 'TERMINAL_2', 'TERMINAL_3', 'FINAL'];
    const entries = terminalKeys.map(key => Number(data.categoryWeights?.[key]));
    if (entries.some(value => !Number.isFinite(value) || value < 0 || value > 100) || Math.abs(entries.reduce((sum, value) => sum + value, 0) - 100) > 0.001) {
      throw new BadRequestException('Terminal 1, 2, 3 and Final weights must be numbers between 0–100 and total exactly 100%.');
    }
    const gradeBands = [...(data.gradeBands || [])].sort((a, b) => a.minPercent - b.minPercent);
    for (let i = 0; i < gradeBands.length; i++) {
      const band = gradeBands[i];
      if (!Number.isFinite(band.minPercent) || !Number.isFinite(band.maxPercent) || band.minPercent < 0 || band.maxPercent > 100 || band.minPercent >= band.maxPercent || !band.grade?.trim() || (band.gpa !== undefined && (!Number.isFinite(band.gpa) || band.gpa < 0 || band.gpa > 4))) throw new BadRequestException('Grade bands must have valid percentage ranges, grade labels, and optional GPA values from 0 to 4.');
      if (i > 0 && gradeBands[i - 1].maxPercent > band.minPercent) throw new BadRequestException('Grade band ranges cannot overlap.');
    }
    if (data.templateUrl && !/^https:\/\/res\.cloudinary\.com\/[^/]+\/raw\/upload\//i.test(data.templateUrl)) throw new BadRequestException('Upload an XLSX template to the school media storage first.');
    const scheme = await (this.prisma as any).assessmentScheme.upsert({
      where: { schoolId_classId: { schoolId: actor.schoolId, classId } },
      create: { schoolId: actor.schoolId, classId, categoryWeights: data.categoryWeights, gradeBands: gradeBands as Prisma.InputJsonValue, templateUrl: data.templateUrl || null, templateName: data.templateName || null, updatedById: actor.id },
      update: { categoryWeights: data.categoryWeights, gradeBands: gradeBands as Prisma.InputJsonValue, templateUrl: data.templateUrl || null, templateName: data.templateName || null, updatedById: actor.id },
    });
    void this.audit.record({ action: 'ASSESSMENT_SCHEME_UPDATED', entity: 'AssessmentScheme', entityId: scheme.id, userId: actor.id, schoolId: actor.schoolId, details: { classId, categoryWeights: data.categoryWeights, gradeBandCount: gradeBands.length, templateName: data.templateName || null } });
    return scheme;
  }

  async exportSectionReport(sectionId: string, actor: { id: string; schoolId: string; role: Role }): Promise<Buffer> {
    const report: any = await this.getSectionProgressReport(sectionId, actor);
    const templateUrl = report.scheme.templateUrl;
    const workbook = new ExcelJS.Workbook();
    if (typeof templateUrl === 'string' && templateUrl) {
      const response = await fetch(templateUrl, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new BadRequestException('The school marksheet template could not be downloaded. Re-upload it in assessment settings.');
      try {
        const templateBytes = new Uint8Array(await response.arrayBuffer());
        await workbook.xlsx.load(templateBytes as unknown as Parameters<typeof workbook.xlsx.load>[0]);
      } catch {
        throw new BadRequestException('The saved template is not a readable .xlsx workbook. Upload a valid .xlsx file.');
      }
    }
    const sheet = workbook.worksheets[0] || workbook.addWorksheet('Progress report');
    const normalize = (value: unknown) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    let headerRow = 0;
    let columns: Record<string, number> = {};
    for (let rowIndex = 1; rowIndex <= Math.min(sheet.rowCount || 1, 30); rowIndex++) {
      const candidate: Record<string, number> = {};
      sheet.getRow(rowIndex).eachCell((cell, column) => { candidate[normalize(cell.value)] = column; });
      if (candidate['student name'] || candidate['name'] || candidate['student']) { headerRow = rowIndex; columns = candidate; break; }
    }
    const aliasColumn = (...aliases: string[]) => aliases.map(alias => columns[normalize(alias)]).find(Boolean);
    if (!headerRow) {
      if (templateUrl) throw new BadRequestException('The first worksheet needs a header row with a Student Name, Name, or Student column.');
      const reportRows = report.reports as any[];
      const subjectHeaders = [...new Set(reportRows.flatMap((student: any) => student.subjects.map((subject: any) => subject.subject)))];
      const categoryHeaders = [...new Set(reportRows.flatMap((student: any) => student.subjects.flatMap((subject: any) => Object.keys(subject.categoryProgress || {}).map((category: string) => `${subject.subject} ${category.toLowerCase().replaceAll('_', ' ')}`))))];
      const headers = ['Roll No', 'EMIS ID', 'Student Name', ...subjectHeaders, ...categoryHeaders, 'Overall %', 'Grade', 'GPA', 'Rank'];
      sheet.addRow(headers);
      headerRow = 1;
      headers.forEach((header, index) => { columns[normalize(header)] = index + 1; });
    }
    const rollColumn = aliasColumn('Roll No', 'Roll', 'Class Roll');
    const emisColumn = aliasColumn('EMIS ID', 'EMIS', 'Student ID');
    const nameColumn = aliasColumn('Student Name', 'Name', 'Student');
    const overallColumn = aliasColumn('Overall %', 'Percentage', 'Final Percentage', 'Final %');
    const gradeColumn = aliasColumn('Grade', 'Final Grade');
    const gpaColumn = aliasColumn('GPA', 'CGPA', 'Grade Point Average');
    const rankColumn = aliasColumn('Rank', 'Position', 'Class Rank');
    const startRow = headerRow + 1;
    (report.reports as any[]).forEach((student: any, index: number) => {
      const row = sheet.getRow(startRow + index);
      if (rollColumn) row.getCell(rollColumn).value = student.rollNo || '';
      if (emisColumn) row.getCell(emisColumn).value = student.student.emisId || '';
      if (nameColumn) row.getCell(nameColumn).value = [student.student.studentProfile?.firstName, student.student.studentProfile?.lastName].filter(Boolean).join(' ') || student.student.email;
      if (overallColumn) row.getCell(overallColumn).value = student.overallPercentage;
      if (gradeColumn) row.getCell(gradeColumn).value = student.overallGrade || '';
      if (gpaColumn) row.getCell(gpaColumn).value = student.gpa;
      if (rankColumn) row.getCell(rankColumn).value = student.rank || '';
      for (const result of student.subjects) {
        const exactColumn = columns[normalize(result.subject)];
        if (exactColumn) row.getCell(exactColumn).value = result.finalPercent;
        for (const [header, column] of Object.entries(columns)) {
          for (const category of assessmentCategories) {
            const categoryName = category.toLowerCase().replaceAll('_', ' ');
            if (header === normalize(`${result.subject} ${categoryName}`) || header === normalize(`${categoryName} ${result.subject}`)) row.getCell(column).value = result.categoryProgress[category]?.percentage ?? null;
          }
        }
      }
      row.commit();
    });
    const title = sheet.getRow(headerRow);
    title.font = { ...title.font, bold: true };
    sheet.views = [{ state: 'frozen', ySplit: headerRow }];
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async getSectionProgressReport(sectionId: string, actor: { id: string; schoolId: string; role: Role }) {
    const section = await this.prisma.section.findFirst({ where: { id: sectionId, schoolId: actor.schoolId }, include: { class: { select: { id: true, name: true } } } });
    if (!section) throw new NotFoundException('Class section not found in your school.');
    const assignment: any[] = actor.role === Role.TEACHER ? await this.prisma.teacherAssignment.findMany({ where: { teacherId: actor.id, sectionId, subject: { schoolId: actor.schoolId } }, select: { subjectId: true } }) : [];
    if (actor.role === Role.TEACHER && assignment.length === 0) throw new ForbiddenException('You are not assigned to this section.');
    const subjectIds = assignment.map(item => item.subjectId);
    const [enrollments, scheme] = await Promise.all<any>([
      this.prisma.enrollment.findMany({ where: { sectionId, student: { schoolId: actor.schoolId, role: Role.STUDENT, status: 'ACTIVE' } }, select: { studentId: true, rollNo: true, student: { select: { id: true, email: true, emisId: true, studentProfile: { select: { firstName: true, lastName: true, rollNo: true } } } } }, orderBy: [{ rollNo: 'asc' }, { student: { studentProfile: { lastName: 'asc' } } }] }),
      this.getAssessmentScheme(section.class.id, actor.schoolId),
    ]);
    const results: any[] = enrollments.length ? await this.prisma.examResult.findMany({ where: { schoolId: actor.schoolId, studentId: { in: enrollments.map((item: any) => item.studentId) }, exam: { sectionId, ...(subjectIds.length ? { subjectId: { in: subjectIds } } : {}) } }, include: { exam: { include: { subject: { select: { id: true, name: true } } } } } }) : [];
    const weights = (scheme.categoryWeights || {}) as Record<string, number>;
    const bands = (scheme.gradeBands || []) as Array<{ minPercent: number; maxPercent: number; grade: string; gpa?: number }>;
    const gradeFor = (percentage: number | null) => gradeBandForPercentage(percentage, bands);
    const resultsByStudent = new Map<string, any[]>();
    for (const result of results) {
      const arr = resultsByStudent.get(result.studentId) || [];
      arr.push(result);
      resultsByStudent.set(result.studentId, arr);
    }
    const reports: any[] = enrollments.map((enrollment: any) => {
      const studentResults = resultsByStudent.get(enrollment.studentId) || [];
      const bySubject = new Map<string, any[]>();
      for (const result of studentResults) {
        const subjectId = result.exam.subject.id;
        bySubject.set(subjectId, [...(bySubject.get(subjectId) || []), result]);
      }
      const subjects = [...bySubject.values()].map(rows => {
        const subject = rows[0].exam.subject;
        const categoryTotals = new Map<string, { marks: number; max: number; exams: number }>();
        for (const row of rows) {
          const category = row.exam.assessmentCategory || 'OTHER';
          const total = categoryTotals.get(category) || { marks: 0, max: 0, exams: 0 };
          total.marks += row.marksObtained; total.max += row.totalMarks; total.exams += 1;
          categoryTotals.set(category, total);
        }
        const categoryProgress = Object.fromEntries([...categoryTotals].map(([category, value]) => [category, { percentage: value.max ? Math.round(value.marks / value.max * 10000) / 100 : null, exams: value.exams }]));
        const finalSchemeSnapshot = rows.find(row => row.exam.assessmentCategory === 'FINAL' && row.exam.assessmentSnapshot)?.exam.assessmentSnapshot || rows.find(row => row.exam.assessmentSnapshot)?.exam.assessmentSnapshot;
        const subjectWeights = (finalSchemeSnapshot?.categoryWeights || weights) as Record<string, number>;
        const subjectBands = (finalSchemeSnapshot?.gradeBands || bands) as Array<{ minPercent: number; maxPercent: number; grade: string; gpa?: number }>;
        const finalPercent = calculateWeightedPercentage(categoryTotals, subjectWeights);
        const gradeBand = gradeBandForPercentage(finalPercent, subjectBands);
        const simplePercent = studentResults.filter(row => row.exam.subject.id === subject.id).reduce((sum, row) => sum + row.marksObtained, 0);
        const simpleMaximum = studentResults.filter(row => row.exam.subject.id === subject.id).reduce((sum, row) => sum + row.totalMarks, 0);
        return { subjectId: subject.id, subject: subject.name, categoryProgress, finalPercent, finalGrade: gradeBand?.grade || null, gpa: gradeBand?.gpa ?? null, currentPercentage: simpleMaximum ? Math.round(simplePercent / simpleMaximum * 10000) / 100 : null, examsRecorded: rows.length };
      });
      const completedSubjects = subjects.filter(item => item.finalPercent !== null);
      const overallPercentage = subjects.length && completedSubjects.length === subjects.length ? Math.round(completedSubjects.reduce((sum, item) => sum + (item.finalPercent || 0), 0) / subjects.length * 100) / 100 : null;
      const overallGrade = gradeFor(overallPercentage);
      return { student: enrollment.student, rollNo: enrollment.rollNo || enrollment.student.studentProfile?.rollNo || null, subjects, overallPercentage, overallGrade: overallGrade?.grade || null, gpa: overallGrade?.gpa ?? null, completion: subjects.length ? `${completedSubjects.length}/${subjects.length}` : '0/0', rank: null as number | null };
    });
    const ranked = [...reports].filter(report => report.overallPercentage !== null).sort((a, b) => b.overallPercentage - a.overallPercentage);
    let previous: number | null = null; let rank = 0;
    ranked.forEach((report, index) => { if (report.overallPercentage !== previous) rank = index + 1; report.rank = rank; previous = report.overallPercentage; });
    return { section: { id: section.id, name: section.name, class: section.class }, scheme, generatedAt: new Date().toISOString(), reports };
  }

  async searchStudentProgress(query: string, filters: { classId?: string; sectionId?: string; category?: string }, actor: { id: string; schoolId: string; role: Role }) {
    const term = query.trim();
    if (term.length < 2) throw new BadRequestException('Enter at least 2 characters to search.');
    const enrollmentWhere: any = {
      ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
      ...(filters.classId ? { section: { classId: filters.classId } } : {}),
      student: { schoolId: actor.schoolId, role: Role.STUDENT, status: 'ACTIVE', OR: [
        { email: { contains: term, mode: 'insensitive' } }, { emisId: { contains: term, mode: 'insensitive' } }, { userId: { contains: term, mode: 'insensitive' } },
        { studentProfile: { is: { firstName: { contains: term, mode: 'insensitive' } } } },
        { studentProfile: { is: { lastName: { contains: term, mode: 'insensitive' } } } },
      ] },
    };
    const enrollments: any[] = await this.prisma.enrollment.findMany({ where: enrollmentWhere, take: 50, orderBy: [{ rollNo: 'asc' }], select: { studentId: true, sectionId: true, section: { select: { id: true, classId: true } } } });
    const sectionIds = [...new Set(enrollments.map(item => item.sectionId))];
    if (actor.role === Role.TEACHER) {
      const assignments = await this.prisma.teacherAssignment.findMany({ where: { teacherId: actor.id, sectionId: { in: sectionIds } }, select: { sectionId: true } });
      const allowed = new Set(assignments.map(item => item.sectionId));
      for (let index = enrollments.length - 1; index >= 0; index--) if (!allowed.has(enrollments[index].sectionId)) enrollments.splice(index, 1);
    }
    const sections = await Promise.all([...new Set(enrollments.map(item => item.sectionId))].map(id => this.getSectionProgressReport(id, actor)));
    const reports = enrollments.map(enrollment => sections.find(report => report.section.id === enrollment.sectionId)?.reports.find((item: any) => item.student.id === enrollment.studentId)).filter(Boolean);
    const category = filters.category?.toUpperCase();
    return reports.map((report: any) => ({ ...report, subjects: report.subjects.map((subject: any) => ({ ...subject, categoryProgress: category ? Object.fromEntries(Object.entries(subject.categoryProgress).filter(([key]) => category === 'MCQ' ? key === 'WEEKLY' : key !== 'WEEKLY' && key !== 'OTHER')) : subject.categoryProgress })) }));
  }

  async getStudentProgressReport(studentId: string, actor: { id: string; schoolId: string; role: Role }) {
    if (actor.role === Role.STUDENT && actor.id !== studentId) throw new ForbiddenException('You can only view your own progress report.');
    if (actor.role === Role.PARENT && !await this.prisma.parentStudent.findUnique({ where: { parentId_studentId: { parentId: actor.id, studentId } }, select: { id: true } })) throw new ForbiddenException('You are not linked to this student.');
    const enrollment = await this.prisma.enrollment.findFirst({ where: { studentId, student: { schoolId: actor.schoolId, role: Role.STUDENT }, academicYear: { isCurrent: true } }, select: { sectionId: true } }) || await this.prisma.enrollment.findFirst({ where: { studentId, student: { schoolId: actor.schoolId, role: Role.STUDENT } }, select: { sectionId: true } });
    if (!enrollment) throw new NotFoundException('No class enrollment was found for this student.');
    const report: any = await this.getSectionProgressReport(enrollment.sectionId, actor.role === Role.TEACHER ? actor : { ...actor, role: Role.ADMIN });
    const studentReport = report.reports.find((item: any) => item.student.id === studentId);
    if (!studentReport) throw new NotFoundException('No progress report was found for this student.');
    return { section: report.section, scheme: report.scheme, generatedAt: report.generatedAt, student: studentReport };
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

  async getExamRoster(examId: string, actor: { id: string; schoolId: string; role: Role }) {
    const exam = await this.prisma.exam.findFirst({ where: { id: examId, schoolId: actor.schoolId }, select: { id: true, sectionId: true, subjectId: true } });
    if (!exam) throw new NotFoundException('Exam not found in your school.');
    if (actor.role === Role.TEACHER && !await this.prisma.teacherAssignment.findFirst({ where: { teacherId: actor.id, sectionId: exam.sectionId, subjectId: exam.subjectId }, select: { id: true } })) throw new ForbiddenException('You are not assigned to this exam.');
    const enrollments = await this.prisma.enrollment.findMany({ where: { sectionId: exam.sectionId, student: { schoolId: actor.schoolId, role: Role.STUDENT, status: 'ACTIVE' } }, select: { studentId: true, rollNo: true, student: { select: { id: true, email: true, emisId: true, studentProfile: { select: { firstName: true, lastName: true } } } } }, orderBy: [{ rollNo: 'asc' }, { student: { studentProfile: { lastName: 'asc' } } }] });
    const results = await this.prisma.examResult.findMany({ where: { examId, schoolId: actor.schoolId }, select: { studentId: true, marksObtained: true, totalMarks: true } });
    const byStudent = new Map(results.map(result => [result.studentId, result]));
    return { exam, students: enrollments.map(item => ({ ...item.student, rollNo: item.rollNo, result: byStudent.get(item.studentId) || null })) };
  }

  async addExamResultsBulk(data: BulkExamResultsDto, actor: { id: string; schoolId: string; role: Role }) {
    const exam = await this.prisma.exam.findFirst({ where: { id: data.examId, schoolId: actor.schoolId }, select: { id: true, sectionId: true, subjectId: true } });
    if (!exam) throw new NotFoundException('Exam not found in your school.');
    if (actor.role === Role.TEACHER && !await this.prisma.teacherAssignment.findFirst({ where: { teacherId: actor.id, sectionId: exam.sectionId, subjectId: exam.subjectId }, select: { id: true } })) throw new ForbiddenException('You are not assigned to this exam.');
    const uniqueStudentIds = new Set(data.results.map(row => row.studentId));
    if (uniqueStudentIds.size !== data.results.length) throw new BadRequestException('A student can appear only once in each bulk mark entry.');
    if (data.results.some(row => !Number.isFinite(row.marksObtained) || !Number.isFinite(row.totalMarks) || row.marksObtained < 0 || row.totalMarks <= 0 || row.marksObtained > row.totalMarks)) throw new BadRequestException('Marks must be between zero and the maximum mark.');
    const validEnrollments = await this.prisma.enrollment.findMany({ where: { sectionId: exam.sectionId, studentId: { in: [...uniqueStudentIds] }, student: { schoolId: actor.schoolId, role: Role.STUDENT, status: 'ACTIVE' } }, select: { studentId: true } });
    if (validEnrollments.length !== data.results.length) throw new ForbiddenException('Every student in this marks batch must be actively enrolled in the exam section.');
    const saved = await this.prisma.$transaction(data.results.map(row => this.prisma.examResult.upsert({
      where: { examId_studentId: { examId: data.examId, studentId: row.studentId } },
      create: { examId: data.examId, studentId: row.studentId, marksObtained: row.marksObtained, totalMarks: row.totalMarks, schoolId: actor.schoolId },
      update: { marksObtained: row.marksObtained, totalMarks: row.totalMarks },
    })));
    void this.audit.record({ action: 'EXAM_RESULTS_BULK_SAVED', entity: 'Exam', entityId: exam.id, userId: actor.id, schoolId: actor.schoolId, details: { count: saved.length, studentIds: data.results.map(row => row.studentId) } });
    return { savedCount: saved.length };
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
    const updated = await this.prisma.exam.update({ where: { id }, data: { ...(data.title !== undefined ? { title: data.title.trim() } : {}), ...(data.date !== undefined ? { date: new Date(data.date) } : {}), ...(data.assessmentCategory !== undefined ? { assessmentCategory: data.assessmentCategory } : {}), ...(data.type !== undefined ? { type: data.type } : {}), ...(data.startTime !== undefined ? { startTime: data.startTime.trim() || null } : {}), ...(data.endTime !== undefined ? { endTime: data.endTime.trim() || null } : {}), ...(data.venue !== undefined ? { venue: data.venue.trim() || null } : {}), ...(data.durationMinutes !== undefined ? { durationMinutes: data.durationMinutes || null } : {}) } });
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
      return { ...existing, durationMinutes: exam.durationMinutes };
    }
    
    const attempt = await this.prisma.examAttempt.create({
      data: {
        examId,
        studentId: actor.id,
        answers: {}
      }
    });
    return { ...attempt, durationMinutes: exam.durationMinutes };
  }

  async saveAnswer(attemptId: string, data: SubmitAnswerDto, actor: { id: string; schoolId: string; role: Role }) {
    const attempt = await this.prisma.examAttempt.findUnique({ where: { id: attemptId }, include: { exam: true } });
    if (!attempt || attempt.studentId !== actor.id) throw new NotFoundException('Attempt not found.');
    if (attempt.completedAt) throw new BadRequestException('Exam already completed.');
    if (attempt.exam.durationMinutes && Date.now() >= attempt.startedAt.getTime() + attempt.exam.durationMinutes * 60_000) throw new BadRequestException('Exam time has ended. Submit your saved answers to finish.');
    
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
