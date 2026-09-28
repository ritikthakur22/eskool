import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export type RoutineUploadFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
};

@Injectable()
export class RoutineService {
  constructor(private readonly prisma: PrismaService) {}

  async upload(file: RoutineUploadFile, schoolId: string, uploaderId: string) {
    const [document] = await this.prisma.$queryRaw<Array<{ id: string; fileName: string; mimeType: string; createdAt: Date }>>(Prisma.sql`
      INSERT INTO "RoutineDocument" ("id", "schoolId", "uploaderId", "fileName", "mimeType", "content", "createdAt")
      VALUES (${randomUUID()}, ${schoolId}, ${uploaderId}, ${file.originalname}, ${file.mimetype}, ${file.buffer}, NOW())
      RETURNING "id", "fileName", "mimeType", "createdAt"
    `);
    return document;
  }

  async getLatest(schoolId: string) {
    const [document] = await this.prisma.$queryRaw<Array<{
      id: string;
      fileName: string;
      mimeType: string;
      content: Uint8Array;
      createdAt: Date;
    }>>(Prisma.sql`
      SELECT "id", "fileName", "mimeType", "content", "createdAt"
      FROM "RoutineDocument"
      WHERE "schoolId" = ${schoolId}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `);
    if (!document) throw new NotFoundException('No routine has been uploaded for this school yet.');
    const { content, ...metadata } = document;
    return { ...metadata, base64: Buffer.from(content).toString('base64') };
  }
}
