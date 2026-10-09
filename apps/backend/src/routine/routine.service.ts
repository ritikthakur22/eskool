import { BadRequestException, ConflictException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CloudinaryService } from '../storage/cloudinary.service.js';
import { AuditService } from '../audit/audit.service.js';

export type RoutineUploadFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
};

const routineInclude = {
  subject: { select: { id: true, name: true } },
  teacher: { select: { id: true, teacherProfile: { select: { firstName: true, lastName: true } } } },
  section: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
} satisfies Prisma.ClassRoutineInclude;

@Injectable()
export class RoutineService {
  constructor(private readonly prisma: PrismaService, private readonly cloudinary: CloudinaryService, private readonly audit: AuditService) {}

  async getSectionClassRoutine(schoolId: string, sectionId: string) {
    const section = await this.prisma.section.findFirst({ where: { id: sectionId, schoolId }, select: { id: true } });
    if (!section) throw new NotFoundException('Section not found in your school.');
    return this.findClassRoutines({ schoolId, sectionId });
  }

  async getClassRoutineForUser(schoolId: string, userId: string, role: Role) {
    if (role === Role.ADMIN || role === Role.SUPER_ADMIN) return this.findClassRoutines({ schoolId });
    if (role === Role.TEACHER) return this.findClassRoutines({ schoolId, teacherId: userId });
    if (role === Role.STUDENT) {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: { studentId: userId, academicYear: { isCurrent: true }, section: { schoolId } },
        orderBy: { academicYear: { startDate: 'desc' } },
        select: { sectionId: true },
      });
      return enrollment ? this.findClassRoutines({ schoolId, sectionId: enrollment.sectionId }) : [];
    }
    if (role === Role.PARENT) {
      const linkedStudents = await this.prisma.parentStudent.findMany({
        where: { parentId: userId, parent: { schoolId, status: 'ACTIVE' }, student: { schoolId, status: 'ACTIVE' } },
        select: { student: { select: { enrollments: { where: { academicYear: { isCurrent: true }, section: { schoolId } }, take: 1, select: { sectionId: true } } } } },
      });
      const sectionIds = linkedStudents.flatMap(link => link.student.enrollments.map(enrollment => enrollment.sectionId));
      return sectionIds.length ? this.findClassRoutines({ schoolId, sectionId: { in: sectionIds } }) : [];
    }
    return [];
  }

  async createClassRoutineEntry(schoolId: string, actorId: string, data: any) {
    const values = await this.validateRoutineEntry(schoolId, data);
    await this.assertNoRoutineConflict(schoolId, values);
    const routine = await this.prisma.classRoutine.create({ data: { schoolId, ...values }, include: routineInclude });
    void this.audit.record({ action: 'CLASS_ROUTINE_CREATED', entity: 'ClassRoutine', entityId: routine.id, userId: actorId, schoolId });
    return routine;
  }

  async updateClassRoutineEntry(schoolId: string, actorId: string, id: string, data: any) {
    const current = await this.prisma.classRoutine.findFirst({ where: { id, schoolId }, select: { id: true } });
    if (!current) throw new NotFoundException('Routine entry not found in your school.');
    const values = await this.validateRoutineEntry(schoolId, data);
    await this.assertNoRoutineConflict(schoolId, values, id);
    const routine = await this.prisma.classRoutine.update({ where: { id }, data: values, include: routineInclude });
    void this.audit.record({ action: 'CLASS_ROUTINE_UPDATED', entity: 'ClassRoutine', entityId: id, userId: actorId, schoolId });
    return routine;
  }

  async deleteClassRoutineEntry(schoolId: string, actorId: string, id: string) {
    const current = await this.prisma.classRoutine.findFirst({ where: { id, schoolId }, select: { id: true } });
    if (!current) throw new NotFoundException('Routine entry not found in your school.');
    await this.prisma.classRoutine.delete({ where: { id } });
    void this.audit.record({ action: 'CLASS_ROUTINE_DELETED', entity: 'ClassRoutine', entityId: id, userId: actorId, schoolId });
    return { success: true };
  }

  private async findClassRoutines(where: Prisma.ClassRoutineWhereInput) {
    return this.prisma.classRoutine.findMany({
      where,
      include: routineInclude,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  private async validateRoutineEntry(schoolId: string, data: any) {
    const { sectionId, subjectId, teacherId, dayOfWeek, startTime, endTime } = data || {};
    const day = Number(dayOfWeek);
    if (![sectionId, subjectId, teacherId].every(value => typeof value === 'string' && value.length > 0)) {
      throw new BadRequestException('Choose a section, subject, and teacher.');
    }
    if (!Number.isInteger(day) || day < 0 || day > 6) throw new BadRequestException('Choose a valid day of the week.');
    const isTime = (value: unknown): value is string => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
    if (!isTime(startTime) || !isTime(endTime) || startTime >= endTime) {
      throw new BadRequestException('Enter valid 24-hour times and ensure the end time is after the start time.');
    }
    const [section, subject, teacher, assignment] = await Promise.all([
      this.prisma.section.findFirst({ where: { id: sectionId, schoolId }, select: { id: true } }),
      this.prisma.subject.findFirst({ where: { id: subjectId, schoolId }, select: { id: true } }),
      this.prisma.user.findFirst({ where: { id: teacherId, schoolId, role: Role.TEACHER, status: 'ACTIVE' }, select: { id: true } }),
      this.prisma.teacherAssignment.findFirst({ where: { sectionId, subjectId, teacherId, section: { schoolId }, academicYear: { isCurrent: true } }, select: { id: true } }),
    ]);
    if (!section || !subject || !teacher) throw new NotFoundException('The selected section, subject, or active teacher was not found in your school.');
    if (!assignment) throw new BadRequestException('Assign this teacher to the selected subject and section for the current academic year first.');
    return { sectionId, subjectId, teacherId, dayOfWeek: day, startTime, endTime };
  }

  private async assertNoRoutineConflict(schoolId: string, values: { sectionId: string; teacherId: string; dayOfWeek: number; startTime: string; endTime: string }, excludeId?: string) {
    const overlap = await this.prisma.classRoutine.findFirst({
      where: {
        schoolId,
        dayOfWeek: values.dayOfWeek,
        id: excludeId ? { not: excludeId } : undefined,
        OR: [{ sectionId: values.sectionId }, { teacherId: values.teacherId }],
        startTime: { lt: values.endTime },
        endTime: { gt: values.startTime },
      },
      include: { section: { include: { class: true } }, teacher: { select: { email: true } } },
    });
    if (overlap) {
      const reason = overlap.sectionId === values.sectionId ? 'This class already has a period during that time.' : 'This teacher is already scheduled during that time.';
      throw new ConflictException(reason);
    }
  }

  async upload(file: RoutineUploadFile, schoolId: string, uploaderId: string) {
    if (!this.cloudinary.isConfigured()) {
      throw new ServiceUnavailableException('Cloudinary storage is not configured.');
    }
    const uploaded = await this.cloudinary.upload(file.buffer, { folder: `eskool/routines/${schoolId}`, resourceType: 'auto' });
    const [document] = await this.prisma.$queryRaw<Array<{ id: string; fileName: string; mimeType: string; createdAt: Date }>>(Prisma.sql`
      INSERT INTO "RoutineDocument" ("id", "schoolId", "uploaderId", "fileName", "mimeType", "storageUrl", "publicId", "createdAt")
      VALUES (${randomUUID()}, ${schoolId}, ${uploaderId}, ${file.originalname}, ${file.mimetype}, ${uploaded.secure_url}, ${uploaded.public_id}, NOW())
      RETURNING "id", "fileName", "mimeType", "createdAt"
    `);
    void this.audit.record({ action: 'ROUTINE_UPLOADED', entity: 'RoutineDocument', entityId: document.id, userId: uploaderId, schoolId, details: { fileName: document.fileName, mimeType: document.mimeType, storage: 'cloudinary' } });
    return document;
  }

  async getLatest(schoolId: string) {
    const [document] = await this.prisma.$queryRaw<Array<{
      id: string;
      fileName: string;
      mimeType: string;
      storageUrl: string | null;
      createdAt: Date;
    }>>(Prisma.sql`
      SELECT "id", "fileName", "mimeType", "storageUrl", "createdAt"
      FROM "RoutineDocument"
      WHERE "schoolId" = ${schoolId}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `);
    if (!document) throw new NotFoundException('No routine has been uploaded for this school yet.');
    const { storageUrl, ...metadata } = document;
    if (!storageUrl) throw new NotFoundException('The routine file is missing or corrupted.');
    const response = await fetch(storageUrl);
    if (!response.ok) throw new NotFoundException('The routine file is temporarily unavailable.');
    return { ...metadata, base64: Buffer.from(await response.arrayBuffer()).toString('base64') };
  }

  async getHistory(schoolId: string, limit = 50) {
    return this.prisma.routineDocument.findMany({
      where: { schoolId },
      take: Math.min(Math.max(limit, 1), 100),
      orderBy: { createdAt: 'desc' },
      select: { id: true, fileName: true, mimeType: true, storageUrl: true, createdAt: true, uploader: { select: { id: true, email: true, role: true, teacherProfile: { select: { firstName: true, lastName: true } }, adminProfile: { select: { firstName: true, lastName: true } } } } },
    });
  }
  
  // Class Routine (Timetable)
  async createClassRoutine(schoolId: string, data: any) {
    return this.prisma.classRoutine.create({
      data: {
        schoolId,
        sectionId: data.sectionId,
        subjectId: data.subjectId,
        teacherId: data.teacherId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });
  }

  async updateClassRoutine(schoolId: string, id: string, data: any) {
    return this.prisma.classRoutine.update({
      where: { id, schoolId },
      data,
    });
  }

  async deleteClassRoutine(schoolId: string, id: string) {
    return this.prisma.classRoutine.delete({
      where: { id, schoolId },
    });
  }

  async getAdminRoutines(schoolId: string) {
    return this.prisma.classRoutine.findMany({
      where: { schoolId },
      include: {
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, teacherProfile: { select: { firstName: true, lastName: true } } } },
        section: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });
  }

  async getStudentRoutine(schoolId: string, sectionId: string) {
    return this.prisma.classRoutine.findMany({
      where: { schoolId, sectionId },
      include: {
        subject: { select: { id: true, name: true } },
        teacher: { select: { id: true, teacherProfile: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });
  }

  async getTeacherRoutine(schoolId: string, teacherId: string) {
    return this.prisma.classRoutine.findMany({
      where: { schoolId, teacherId },
      include: {
        subject: { select: { id: true, name: true } },
        section: { select: { id: true, name: true, class: { select: { id: true, name: true } } } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });
  }
}
