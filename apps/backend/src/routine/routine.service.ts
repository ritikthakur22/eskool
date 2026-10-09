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
  class: { select: { id: true, name: true } },
} satisfies Prisma.ClassRoutineInclude;

const defaultRoutineDays = [1, 2, 3, 4, 5];
const defaultRoutinePeriods = Array.from({ length: 10 }, (_, index) => {
  const start = 600 + index * 40;
  const formatTime = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
  return { startTime: formatTime(start), endTime: formatTime(start + 40) };
});

@Injectable()
export class RoutineService {
  constructor(private readonly prisma: PrismaService, private readonly cloudinary: CloudinaryService, private readonly audit: AuditService) {}

  async getSectionClassRoutine(schoolId: string, sectionId: string) {
    const section = await this.prisma.section.findFirst({ where: { id: sectionId, schoolId }, include: { routineGrid: true } });
    if (!section) throw new NotFoundException('Section not found in your school.');
    const entries = await this.findClassRoutines({ schoolId, sectionId });
    const days: number[] = Array.isArray(section.routineGrid?.days) ? section.routineGrid.days as number[] : defaultRoutineDays;
    const savedPeriods: Array<{ startTime: string; endTime: string }> = Array.isArray(section.routineGrid?.periods) ? section.routineGrid.periods as Array<{ startTime: string; endTime: string }> : defaultRoutinePeriods;
    const periods = new Map<string, { startTime: string; endTime: string }>(savedPeriods.map(period => [`${period.startTime}-${period.endTime}`, period]));
    if (!section.routineGrid) entries.forEach(entry => periods.set(`${entry.startTime}-${entry.endTime}`, { startTime: entry.startTime, endTime: entry.endTime }));
    return { entries, days, periods: [...periods.values()].sort((a, b) => a.startTime.localeCompare(b.startTime)) };
  }

  async getClassLevelRoutine(schoolId: string, classId: string) {
    const classRecord = await this.prisma.class.findFirst({ where: { id: classId, schoolId }, include: { routineGrid: true } });
    if (!classRecord) throw new NotFoundException('Class not found in your school.');
    const entries = await this.findClassRoutines({ schoolId, classId });
    const days: number[] = Array.isArray(classRecord.routineGrid?.days) ? classRecord.routineGrid.days as number[] : defaultRoutineDays;
    const savedPeriods: Array<{ startTime: string; endTime: string }> = Array.isArray(classRecord.routineGrid?.periods) ? classRecord.routineGrid.periods as Array<{ startTime: string; endTime: string }> : defaultRoutinePeriods;
    const periods = new Map<string, { startTime: string; endTime: string }>(savedPeriods.map(period => [`${period.startTime}-${period.endTime}`, period]));
    if (!classRecord.routineGrid) entries.forEach(entry => periods.set(`${entry.startTime}-${entry.endTime}`, { startTime: entry.startTime, endTime: entry.endTime }));
    return { entries, days, periods: [...periods.values()].sort((a, b) => a.startTime.localeCompare(b.startTime)) };
  }

  async updateClassLevelRoutineGrid(schoolId: string, actorId: string, classId: string, input: any) {
    const classRecord = await this.prisma.class.findFirst({ where: { id: classId, schoolId }, select: { id: true } });
    if (!classRecord) throw new NotFoundException('Class not found in your school.');
    return this.updateRoutineGrid(schoolId, actorId, { classId }, input);
  }

  async updateSectionRoutineGrid(schoolId: string, actorId: string, sectionId: string, input: any) {
    const section = await this.prisma.section.findFirst({ where: { id: sectionId, schoolId }, select: { id: true } });
    if (!section) throw new NotFoundException('Section not found in your school.');
    return this.updateRoutineGrid(schoolId, actorId, { sectionId }, input);
  }

  private async updateRoutineGrid(schoolId: string, actorId: string, target: { sectionId?: string; classId?: string }, input: any) {
    const dayValues: number[] = Array.isArray(input?.days) ? input.days.map((value: unknown) => Number(value)) : [];
    const days = [...new Set<number>(dayValues)].sort((a, b) => a - b);
    if (!days.length || days.some(day => !Number.isInteger(day) || day < 1 || day > 6)) throw new BadRequestException('Choose at least one valid school day, Monday through Saturday.');
    if (days.length > 6) throw new BadRequestException('A timetable can have at most six school-day columns.');
    const periods = Array.isArray(input?.periods) ? input.periods : [];
    if (periods.length > 30) throw new BadRequestException('A timetable can have at most 30 period rows.');
    const normalizedPeriods: Array<{ startTime: string; endTime: string }> = periods.map((period: any) => ({ startTime: String(period?.startTime || ''), endTime: String(period?.endTime || '') }));
    const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    if (normalizedPeriods.some(period => !timePattern.test(period.startTime) || !timePattern.test(period.endTime) || period.startTime >= period.endTime)) throw new BadRequestException('Each period needs valid 24-hour start and end times.');
    normalizedPeriods.sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let index = 1; index < normalizedPeriods.length; index += 1) {
      if (normalizedPeriods[index - 1].endTime > normalizedPeriods[index].startTime) throw new BadRequestException('Period rows cannot overlap.');
    }
    const keys = normalizedPeriods.map(period => `${period.startTime}-${period.endTime}`);
    if (new Set(keys).size !== keys.length) throw new BadRequestException('Period rows must have unique times.');
    const periodChanges: Array<{ fromStartTime: string; fromEndTime: string; toStartTime: string; toEndTime: string }> = Array.isArray(input?.periodChanges) ? input.periodChanges : [];
    if (periodChanges.some(change => !timePattern.test(change.fromStartTime) || !timePattern.test(change.fromEndTime) || !timePattern.test(change.toStartTime) || !timePattern.test(change.toEndTime) || change.fromStartTime >= change.fromEndTime || change.toStartTime >= change.toEndTime || !keys.includes(`${change.toStartTime}-${change.toEndTime}`))) throw new BadRequestException('A changed period must use valid times present in the updated timetable.');
    const entries = await this.prisma.classRoutine.findMany({ where: { schoolId, ...target }, select: { id: true, dayOfWeek: true, startTime: true, endTime: true } });
    const allowed = new Set(keys);
    const remapped = new Map(periodChanges.map(change => [`${change.fromStartTime}-${change.fromEndTime}`, `${change.toStartTime}-${change.toEndTime}`]));
    const removedIds = entries.filter(entry => !days.includes(entry.dayOfWeek) || !allowed.has(remapped.get(`${entry.startTime}-${entry.endTime}`) || `${entry.startTime}-${entry.endTime}`)).map(entry => entry.id);
    const grid = await this.prisma.$transaction(async tx => {
      for (const change of periodChanges) await tx.classRoutine.updateMany({ where: { schoolId, ...target, startTime: change.fromStartTime, endTime: change.fromEndTime }, data: { startTime: change.toStartTime, endTime: change.toEndTime } });
      if (removedIds.length) await tx.classRoutine.deleteMany({ where: { schoolId, ...target, id: { in: removedIds } } });
      if (target.classId) return tx.routineGrid.upsert({
        where: { classId: target.classId },
        create: { schoolId, classId: target.classId, days: days as Prisma.InputJsonArray, periods: normalizedPeriods as unknown as Prisma.InputJsonArray },
        update: { days: days as Prisma.InputJsonArray, periods: normalizedPeriods as unknown as Prisma.InputJsonArray },
      });
      return tx.routineGrid.upsert({
        where: { sectionId: target.sectionId! },
        create: { schoolId, sectionId: target.sectionId!, days: days as Prisma.InputJsonArray, periods: normalizedPeriods as unknown as Prisma.InputJsonArray },
        update: { days: days as Prisma.InputJsonArray, periods: normalizedPeriods as unknown as Prisma.InputJsonArray },
      });
    });
    void this.audit.record({ action: 'CLASS_ROUTINE_GRID_UPDATED', entity: 'RoutineGrid', entityId: grid.id, userId: actorId, schoolId, details: { ...target, days, periods: normalizedPeriods.length, deletedEntries: removedIds.length } });
    return { days, periods: normalizedPeriods, deletedEntries: removedIds.length };
  }

  async getClassRoutineForUser(schoolId: string, userId: string, role: Role) {
    if (role === Role.ADMIN || role === Role.SUPER_ADMIN) return this.findClassRoutines({ schoolId });
    if (role === Role.TEACHER) return this.findClassRoutines({ schoolId, OR: [{ teacherId: userId }, { classId: { not: null } }] });
    if (role === Role.STUDENT) {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: { studentId: userId, academicYear: { isCurrent: true }, section: { schoolId } },
        orderBy: { academicYear: { startDate: 'desc' } },
        select: { sectionId: true },
      });
      if (enrollment) return this.findClassRoutines({ schoolId, sectionId: enrollment.sectionId });
      const profile = await this.prisma.studentProfile.findUnique({ where: { userId }, select: { grade: true } });
      if (!profile?.grade) return [];
      const classRecord = await this.prisma.class.findFirst({ where: { schoolId, name: { equals: profile.grade, mode: 'insensitive' } }, select: { id: true } });
      return classRecord ? this.findClassRoutines({ schoolId, classId: classRecord.id }) : [];
    }
    if (role === Role.PARENT) {
      const linkedStudents = await this.prisma.parentStudent.findMany({
        where: { parentId: userId, parent: { schoolId, status: 'ACTIVE' }, student: { schoolId, status: 'ACTIVE' } },
        select: { student: { select: { studentProfile: { select: { grade: true } }, enrollments: { where: { academicYear: { isCurrent: true }, section: { schoolId } }, take: 1, select: { sectionId: true } } } } },
      });
      const sectionIds = linkedStudents.flatMap(link => link.student.enrollments.map(enrollment => enrollment.sectionId));
      const grades = [...new Set(linkedStudents.flatMap(link => link.student.enrollments.length ? [] : link.student.studentProfile?.grade ? [link.student.studentProfile.grade] : []))];
      const classRecords = grades.length ? await this.prisma.class.findMany({ where: { schoolId, name: { in: grades, mode: 'insensitive' } }, select: { id: true } }) : [];
      const classIds = classRecords.map(item => item.id);
      const scopes = [...(sectionIds.length ? [{ sectionId: { in: sectionIds } }] : []), ...(classIds.length ? [{ classId: { in: classIds } }] : [])];
      return scopes.length ? this.findClassRoutines({ schoolId, OR: scopes }) : [];
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

  async clearSectionClassRoutine(schoolId: string, actorId: string, sectionId: string) {
    const section = await this.prisma.section.findFirst({ where: { id: sectionId, schoolId }, select: { id: true } });
    if (!section) throw new NotFoundException('Section not found in your school.');
    const result = await this.prisma.classRoutine.deleteMany({ where: { schoolId, sectionId } });
    if (result.count) void this.audit.record({ action: 'CLASS_ROUTINE_CLEARED', entity: 'ClassRoutine', entityId: sectionId, userId: actorId, schoolId, details: { deletedEntries: result.count } });
    return { success: true, deleted: result.count };
  }

  async clearClassLevelRoutine(schoolId: string, actorId: string, classId: string) {
    const classRecord = await this.prisma.class.findFirst({ where: { id: classId, schoolId }, select: { id: true } });
    if (!classRecord) throw new NotFoundException('Class not found in your school.');
    const result = await this.prisma.classRoutine.deleteMany({ where: { schoolId, classId } });
    if (result.count) void this.audit.record({ action: 'CLASS_ROUTINE_CLEARED', entity: 'ClassRoutine', entityId: classId, userId: actorId, schoolId, details: { deletedEntries: result.count } });
    return { success: true, deleted: result.count };
  }

  private async findClassRoutines(where: Prisma.ClassRoutineWhereInput) {
    return this.prisma.classRoutine.findMany({
      where,
      include: routineInclude,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  private async validateRoutineEntry(schoolId: string, data: any) {
    const { sectionId, dayOfWeek, startTime, endTime } = data || {};
    const kind = String(data?.kind || 'CLASS').toUpperCase();
    const subjectId = data?.subjectId || null;
    const teacherId = data?.teacherId || null;
    const label = typeof data?.label === 'string' ? data.label.trim() || null : null;
    const supportedKinds = new Set(['CLASS', 'ASSEMBLY', 'BREAK', 'LUNCH', 'STUDY', 'CUSTOM']);
    if (!supportedKinds.has(kind)) throw new BadRequestException('Choose a supported routine entry type.');
    const day = Number(dayOfWeek);
    const classId = typeof data?.classId === 'string' && data.classId ? data.classId : null;
    if ((typeof sectionId !== 'string' || !sectionId) === !classId) throw new BadRequestException('Choose a class or a section.');
    if (!label) throw new BadRequestException('Enter a subject or activity label.');
    if (kind === 'CLASS' && subjectId && (typeof subjectId !== 'string' || typeof teacherId !== 'string' || !teacherId)) throw new BadRequestException('A linked school subject requires an assigned teacher.');
    if (kind === 'CLASS' && !subjectId && teacherId) throw new BadRequestException('Choose a school subject before assigning a teacher.');
    if (kind !== 'CLASS' && (subjectId || teacherId)) throw new BadRequestException('Activity entries do not use a linked subject or teacher.');
    if (!Number.isInteger(day) || day < 0 || day > 6) throw new BadRequestException('Choose a valid day of the week.');
    const isTime = (value: unknown): value is string => typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
    if (typeof label === 'string' && label.length > 80) throw new BadRequestException('Routine labels must be 80 characters or fewer.');
    if (!isTime(startTime) || !isTime(endTime) || startTime >= endTime) {
      throw new BadRequestException('Enter valid 24-hour times and ensure the end time is after the start time.');
    }
    const [section, classRecord, subject, teacher, assignment] = await Promise.all([
      sectionId ? this.prisma.section.findFirst({ where: { id: sectionId, schoolId }, select: { id: true } }) : null,
      classId ? this.prisma.class.findFirst({ where: { id: classId, schoolId }, select: { id: true } }) : null,
      subjectId ? this.prisma.subject.findFirst({ where: { id: subjectId, schoolId }, select: { id: true } }) : null,
      teacherId ? this.prisma.user.findFirst({ where: { id: teacherId, schoolId, role: Role.TEACHER, status: 'ACTIVE' }, select: { id: true } }) : null,
      kind === 'CLASS' && subjectId ? this.prisma.teacherAssignment.findFirst({ where: { sectionId, subjectId, teacherId: teacherId as string, section: { schoolId }, academicYear: { isCurrent: true } }, select: { id: true } }) : null,
    ]);
    if (sectionId && !section) throw new NotFoundException('The selected section was not found in your school.');
    if (classId && !classRecord) throw new NotFoundException('The selected class was not found in your school.');
    if (kind === 'CLASS' && subjectId && (!subject || !teacher)) throw new NotFoundException('The selected subject or active teacher was not found in your school.');
    if (kind === 'CLASS' && subjectId && !assignment) throw new BadRequestException('Assign this teacher to the selected subject and section for the current academic year first.');
    return { sectionId: sectionId || null, classId, subjectId, teacherId, kind, label, dayOfWeek: day, startTime, endTime };
  }

  private async assertNoRoutineConflict(schoolId: string, values: { sectionId: string | null; classId: string | null; teacherId: string | null; dayOfWeek: number; startTime: string; endTime: string }, excludeId?: string) {
    const overlap = await this.prisma.classRoutine.findFirst({
      where: {
        schoolId,
        dayOfWeek: values.dayOfWeek,
        id: excludeId ? { not: excludeId } : undefined,
        OR: [...(values.sectionId ? [{ sectionId: values.sectionId }] : []), ...(values.classId ? [{ classId: values.classId }] : []), ...(values.teacherId ? [{ teacherId: values.teacherId }] : [])],
        startTime: { lt: values.endTime },
        endTime: { gt: values.startTime },
      },
      include: { section: { include: { class: true } }, class: true, teacher: { select: { email: true } } },
    });
    if (overlap) {
      const reason = (values.sectionId && overlap.sectionId === values.sectionId) || (values.classId && overlap.classId === values.classId) ? 'This class already has a period during that time.' : 'This teacher is already scheduled during that time.';
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
