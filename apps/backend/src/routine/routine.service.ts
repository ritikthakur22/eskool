import { Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CloudinaryService } from '../storage/cloudinary.service.js';
import { AuditService } from '../audit/audit.service.js';

export type RoutineUploadFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
};

@Injectable()
export class RoutineService {
  constructor(private readonly prisma: PrismaService, private readonly cloudinary: CloudinaryService, private readonly audit: AuditService) {}

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
