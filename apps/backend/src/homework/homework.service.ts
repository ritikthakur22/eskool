import { ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, Homework, HomeworkSubmission, Role } from '@prisma/client';
import { CreateHomeworkDto, SubmitHomeworkDto, UpdateHomeworkDto } from './dto/homework.dto.js';
import { AuditService } from '../audit/audit.service.js';
import { CloudinaryService } from '../storage/cloudinary.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class HomeworkService {
  constructor(private prisma: PrismaService, private readonly audit: AuditService, private readonly cloudinary: CloudinaryService, private readonly notifications: NotificationsService) {}

  async createHomework(data: CreateHomeworkDto, actor: { id: string; schoolId: string; role: Role }): Promise<Homework> {
    if (Boolean(data.sectionId) === Boolean(data.classId)) throw new ForbiddenException('Choose exactly one class section, or a sectionless class such as Nursery.');
    const section = data.sectionId ? await this.prisma.section.findFirst({ where: { id: data.sectionId, schoolId: actor.schoolId }, select: { id: true } }) : null;
    const classRecord = data.classId ? await this.prisma.class.findFirst({ where: { id: data.classId, schoolId: actor.schoolId }, select: { id: true, name: true } }) : null;
    const subject = await this.prisma.subject.findFirst({ where: { id: data.subjectId, schoolId: actor.schoolId }, select: { id: true } });
    if ((!section && !classRecord) || !subject) throw new NotFoundException('Class, section, or subject was not found in your school.');
    if (actor.role === Role.TEACHER) {
      if (!data.sectionId) throw new ForbiddenException('Teachers need a section assignment to post homework.');
      const assignment = await this.prisma.teacherAssignment.findFirst({
        where: { teacherId: actor.id, sectionId: data.sectionId, subjectId: data.subjectId, section: { schoolId: actor.schoolId }, subject: { schoolId: actor.schoolId } },
      });
      if (!assignment) throw new ForbiddenException('You are not assigned to teach this subject for this section.');
    }
    const dueDateObj = new Date(data.dueDate);
    const homework = await this.prisma.homework.create({ data: { title: data.title, description: data.description, dueDate: dueDateObj, subjectId: data.subjectId, sectionId: data.sectionId || null, classId: data.classId || null, teacherId: actor.id, schoolId: actor.schoolId }, include: { subject: { select: { name: true } }, teacher: { select: { teacherProfile: { select: { firstName: true, lastName: true } }, adminProfile: { select: { firstName: true, lastName: true } } } } } });
    void this.audit.record({ action: 'HOMEWORK_CREATED', entity: 'Homework', entityId: homework.id, userId: actor.id, schoolId: actor.schoolId, details: { sectionId: data.sectionId, classId: data.classId, subjectId: data.subjectId } });
    const creatorProfile = homework.teacher.teacherProfile || homework.teacher.adminProfile;
    const teacherName = [creatorProfile?.firstName, creatorProfile?.lastName].filter(Boolean).join(' ') || actor.id;
    void this.notifications.sendHomeworkPosted({ sectionId: data.sectionId, classId: data.classId }, actor.schoolId, homework, teacherName);
    return homework;
  }

  async getHomeworkForClass(sectionId: string, actor: { id: string; schoolId: string; role: Role }, limit = 50): Promise<Homework[]> {
    const section = await this.prisma.section.findFirst({ where: { id: sectionId, schoolId: actor.schoolId }, select: { id: true } });
    if (!section) throw new NotFoundException('Section not found in your school.');
    let linkedStudentId: string | null = null;
    if (actor.role === Role.STUDENT) {
      const enrollment = await this.prisma.enrollment.findFirst({ where: { studentId: actor.id, sectionId }, select: { id: true } });
      if (!enrollment) throw new ForbiddenException('You are not enrolled in this section.');
      linkedStudentId = actor.id;
    }
    if (actor.role === Role.PARENT) {
      const linkedChild = await this.prisma.parentStudent.findFirst({ where: { parentId: actor.id, student: { enrollments: { some: { sectionId } } } }, select: { studentId: true } });
      if (!linkedChild) throw new ForbiddenException('No linked child is enrolled in this section.');
      linkedStudentId = linkedChild.studentId;
    }
    if (actor.role === Role.TEACHER) {
      const assignment = await this.prisma.teacherAssignment.findFirst({ where: { teacherId: actor.id, sectionId, section: { schoolId: actor.schoolId } } });
      if (!assignment) throw new ForbiddenException('You are not assigned to this section.');
    }
    return this.prisma.homework.findMany({
      where: { sectionId, schoolId: actor.schoolId },
      take: Math.min(Math.max(limit, 1), 100),
      orderBy: { dueDate: 'asc' },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { email: true, teacherProfile: { select: { firstName: true, lastName: true } }, adminProfile: { select: { firstName: true, lastName: true } } } },
        submissions: linkedStudentId ? { where: { studentId: linkedStudentId }, select: { status: true, submittedAt: true } } : false,
      },
    });
  }

  async getHomeworkForStudent(studentId: string, schoolId: string, limit = 50) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId, student: { schoolId, role: Role.STUDENT } },
      select: { sectionId: true, section: { select: { classId: true } } },
    });
    const student = await this.prisma.user.findFirst({ where: { id: studentId, schoolId, role: Role.STUDENT }, select: { studentProfile: { select: { grade: true } } } });
    const grade = student?.studentProfile?.grade?.trim();
    const profileClass = grade ? await this.prisma.class.findFirst({ where: { schoolId, name: { equals: grade.replace(/^(class|grade)\s*/i, '').trim(), mode: 'insensitive' } }, select: { id: true } }) : null;
    const sectionIds = enrollments.map(enrollment => enrollment.sectionId);
    const classIds = [...new Set([...enrollments.map(enrollment => enrollment.section.classId), ...(profileClass ? [profileClass.id] : [])])];
    if (!sectionIds.length && !classIds.length) return [];
    const homeworks = await this.prisma.homework.findMany({
      where: { schoolId, OR: [...(sectionIds.length ? [{ sectionId: { in: sectionIds } }] : []), ...(classIds.length ? [{ classId: { in: classIds } }] : [])] },
      include: {
        subject: { select: { name: true, code: true } },
        teacher: { select: { teacherProfile: { select: { firstName: true, lastName: true } }, adminProfile: { select: { firstName: true, lastName: true } }, email: true } },
        section: { include: { class: { select: { name: true } } } },
        class: { select: { name: true } },
        submissions: { where: { studentId }, select: { status: true, submittedAt: true, grade: true, feedback: true, fileUrl: true } },
      },
      take: Math.min(Math.max(limit, 1), 100),
      orderBy: { dueDate: 'asc' },
    });
    return homeworks.map(homework => ({
      ...homework,
      subjectName: homework.subject.name,
      teacherName: [homework.teacher.teacherProfile?.firstName || homework.teacher.adminProfile?.firstName, homework.teacher.teacherProfile?.lastName || homework.teacher.adminProfile?.lastName].filter(Boolean).join(' ') || homework.teacher.email,
      submission: homework.submissions[0] || null,
      submissions: undefined,
      subject: undefined,
    }));
  }

  async getHomeworkForChild(studentId: string, actor: { id: string; schoolId: string }, limit = 50) {
    const link = await this.prisma.parentStudent.findFirst({ where: { parentId: actor.id, studentId, student: { schoolId: actor.schoolId, role: Role.STUDENT, status: 'ACTIVE' } }, select: { id: true } });
    if (!link) throw new ForbiddenException('This student is not linked to your parent account.');
    return this.getHomeworkForStudent(studentId, actor.schoolId, limit);
  }

  async getManagedHomework(actor: { id: string; schoolId: string; role: Role }) {
    const where: Prisma.HomeworkWhereInput = { schoolId: actor.schoolId };
    if (actor.role === Role.TEACHER) where.teacherId = actor.id;
    return this.prisma.homework.findMany({ where, include: { subject: true, section: { include: { class: true } }, class: true, teacher: { select: { email: true, teacherProfile: { select: { firstName: true, lastName: true } }, adminProfile: { select: { firstName: true, lastName: true } } } }, _count: { select: { submissions: true } } }, orderBy: { dueDate: 'asc' }, take: 200 });
  }

  async getSubmissions(homeworkId: string, actor: { id: string; schoolId: string; role: Role }) {
    const homework = await this.prisma.homework.findFirst({ where: { id: homeworkId, schoolId: actor.schoolId, ...(actor.role === Role.TEACHER ? { teacherId: actor.id } : {}) }, select: { id: true, sectionId: true, classId: true } });
    if (!homework) throw new NotFoundException('Homework not found or you lack permission to view submissions.');
    const [submissions, enrollments] = await Promise.all([
      this.prisma.homeworkSubmission.findMany({ where: { homeworkId, schoolId: actor.schoolId }, include: { student: { select: { id: true, email: true, studentProfile: { select: { firstName: true, lastName: true, rollNo: true, grade: true, section: true } } } } }, orderBy: { submittedAt: 'desc' } }),
      homework.sectionId ? this.prisma.enrollment.findMany({ where: { sectionId: homework.sectionId, student: { schoolId: actor.schoolId, role: Role.STUDENT, status: 'ACTIVE' } }, select: { studentId: true, rollNo: true, student: { select: { id: true, email: true, studentProfile: { select: { firstName: true, lastName: true, rollNo: true, grade: true, section: true } } } } }, orderBy: [{ rollNo: 'asc' }, { student: { studentProfile: { lastName: 'asc' } } }] }) : homework.classId ? this.prisma.user.findMany({ where: { schoolId: actor.schoolId, role: Role.STUDENT, status: 'ACTIVE', OR: [{ enrollments: { some: { section: { classId: homework.classId } } } }, { studentProfile: { grade: { equals: (await this.prisma.class.findUnique({ where: { id: homework.classId }, select: { name: true } }))?.name || '', mode: 'insensitive' } } }] }, select: { id: true, email: true, studentProfile: { select: { firstName: true, lastName: true, rollNo: true, grade: true, section: true } } }, orderBy: { studentProfile: { lastName: 'asc' } } }).then(items => items.map(student => ({ studentId: student.id, rollNo: student.studentProfile?.rollNo || null, student }))) : Promise.resolve([]),
    ]);
    const byStudent = new Map(submissions.map(item => [item.studentId, item]));
    return enrollments.map(enrollment => ({ student: enrollment.student, status: byStudent.has(enrollment.studentId) ? 'COMPLETED' : 'PENDING', submittedAt: byStudent.get(enrollment.studentId)?.submittedAt || null, submission: byStudent.get(enrollment.studentId) || null }));
  }

  async updateHomework(id: string, data: UpdateHomeworkDto, actor: { id: string; schoolId: string; role: Role }) {
    const homework = await this.prisma.homework.findFirst({ where: { id, schoolId: actor.schoolId }, select: { id: true, teacherId: true, title: true, description: true, dueDate: true } });
    if (!homework) throw new NotFoundException('Homework not found in your school.');
    if (actor.role === Role.TEACHER && homework.teacherId !== actor.id) throw new ForbiddenException('You can only edit homework you created.');
    const updated = await this.prisma.homework.update({ where: { id }, data: { ...(data.title !== undefined ? { title: data.title.trim() } : {}), ...(data.description !== undefined ? { description: data.description.trim() } : {}), ...(data.dueDate !== undefined ? { dueDate: new Date(data.dueDate) } : {}) } });
    void this.audit.record({ action: 'HOMEWORK_UPDATED', entity: 'Homework', entityId: id, userId: actor.id, schoolId: actor.schoolId, details: { before: { title: homework.title, description: homework.description, dueDate: homework.dueDate.toISOString() }, after: { title: updated.title, description: updated.description, dueDate: updated.dueDate.toISOString() } } });
    return updated;
  }

  async submitHomework(data: SubmitHomeworkDto, actor: { id: string; schoolId: string }): Promise<HomeworkSubmission> {
    const homework = await this.prisma.homework.findFirst({ where: { id: data.homeworkId, schoolId: actor.schoolId }, select: { id: true, sectionId: true, classId: true } });
    if (!homework) throw new NotFoundException('Homework not found in your school.');
    if (homework.sectionId) {
      const enrollment = await this.prisma.enrollment.findFirst({ where: { studentId: actor.id, sectionId: homework.sectionId }, select: { id: true } });
      if (!enrollment) throw new ForbiddenException('You are not enrolled in this homework section.');
    } else {
      const member = await this.studentBelongsToClass(actor.id, actor.schoolId, homework.classId);
      if (!member) throw new ForbiddenException('You are not a member of the homework class.');
    }
    const existing = await this.prisma.homeworkSubmission.findFirst({ where: { homeworkId: homework.id, studentId: actor.id }, select: { id: true } });
    if (existing) throw new ForbiddenException('You have already submitted this homework.');
    const submission = await this.prisma.homeworkSubmission.create({ data: { homeworkId: homework.id, studentId: actor.id, content: data.content, fileUrl: data.fileUrl, status: 'SUBMITTED', schoolId: actor.schoolId } });
    void this.audit.record({ action: 'HOMEWORK_SUBMITTED', entity: 'HomeworkSubmission', entityId: submission.id, userId: actor.id, schoolId: actor.schoolId, details: { homeworkId: homework.id } });
    return submission;
  }

  private async studentBelongsToClass(studentId: string, schoolId: string, classId: string | null) {
    if (!classId) return false;
    const [enrollment, target, profile] = await Promise.all([
      this.prisma.enrollment.findFirst({ where: { studentId, section: { classId } }, select: { id: true } }),
      this.prisma.class.findFirst({ where: { id: classId, schoolId }, select: { name: true } }),
      this.prisma.user.findFirst({ where: { id: studentId, schoolId, role: Role.STUDENT }, select: { studentProfile: { select: { grade: true } } } }),
    ]);
    const normalized = (value: string) => value.trim().replace(/^(class|grade)\\s*/i, '').toLowerCase();
    return Boolean(enrollment || (target && profile?.studentProfile?.grade && normalized(target.name) === normalized(profile.studentProfile.grade)));
  }

  async submitHomeworkAttachment(homeworkId: string, actor: { id: string; schoolId: string }, file: { buffer: Buffer; mimetype: string; originalname: string }) {
    if (!this.cloudinary.isConfigured()) throw new ServiceUnavailableException('Cloudinary storage is not configured.');
    const homework = await this.prisma.homework.findFirst({ where: { id: homeworkId, schoolId: actor.schoolId }, select: { id: true, sectionId: true, classId: true } });
    if (!homework) throw new NotFoundException('Homework not found in your school.');
    if (homework.sectionId) {
      const enrollment = await this.prisma.enrollment.findFirst({ where: { studentId: actor.id, sectionId: homework.sectionId }, select: { id: true } });
      if (!enrollment) throw new ForbiddenException('You are not enrolled in this homework section.');
    } else if (!await this.studentBelongsToClass(actor.id, actor.schoolId, homework.classId)) throw new ForbiddenException('You are not a member of the homework class.');
    const existing = await this.prisma.homeworkSubmission.findFirst({ where: { homeworkId: homework.id, studentId: actor.id }, select: { id: true } });
    if (existing) throw new ForbiddenException('You have already submitted this homework.');
    const uploaded = await this.cloudinary.upload(file.buffer, { folder: `eskool/homework/${actor.schoolId}`, resourceType: file.mimetype === 'application/pdf' ? 'raw' : 'image' });
    const submission = await this.prisma.homeworkSubmission.create({ data: { homeworkId: homework.id, studentId: actor.id, fileUrl: uploaded.secure_url, status: 'SUBMITTED', schoolId: actor.schoolId } });
    void this.audit.record({ action: 'HOMEWORK_ATTACHMENT_SUBMITTED', entity: 'HomeworkSubmission', entityId: submission.id, userId: actor.id, schoolId: actor.schoolId, details: { homeworkId: homework.id, publicId: uploaded.public_id } });
    return submission;
  }

  async gradeSubmission(id: string, grade: string, feedback: string, actor: { id: string; schoolId: string; role: Role }): Promise<HomeworkSubmission> {
    if (!grade || grade.length > 20 || feedback?.length > 2000) throw new ForbiddenException('Invalid grading data.');
    const whereClause: Prisma.HomeworkSubmissionWhereInput = { id, schoolId: actor.schoolId };
    if (actor.role === Role.TEACHER) {
      whereClause.homework = { teacherId: actor.id };
    }
    const submission = await this.prisma.homeworkSubmission.findFirst({ where: whereClause, select: { id: true } });
    if (!submission) throw new NotFoundException('Submission not found or you lack permission to grade it.');
    const graded = await this.prisma.homeworkSubmission.update({
      where: { id: submission.id },
      data: { grade, feedback, status: 'GRADED' },
    });
    void this.audit.record({ action: 'HOMEWORK_GRADED', entity: 'HomeworkSubmission', entityId: graded.id, userId: actor.id, schoolId: actor.schoolId });
    return graded;
  }
}
