import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { CloudinaryService } from '../storage/cloudinary.service.js';

export type PaymentProofUpload = { buffer: Buffer; size: number; mimetype: string; originalname: string };

@Injectable()
export class FeesService {
  constructor(private readonly prisma: PrismaService, private readonly cloudinary: CloudinaryService) {}

  async getInvoicesForUser(userId: string, schoolId: string) {
    const invoices = await this.prisma.$queryRaw<Array<{
      id: string; invoiceNumber: string; title: string; description: string | null;
      amount: Prisma.Decimal | number; dueDate: Date; status: string; issuedAt: Date; paidAt: Date | null; latestProofStatus: string | null;
    }>>(Prisma.sql`
      SELECT i."id", i."invoiceNumber", i."title", i."description", i."amount", i."dueDate", i."status", i."issuedAt", i."paidAt",
        (SELECT p."status"::text FROM "FeePaymentProof" p WHERE p."invoiceId" = i."id" ORDER BY p."submittedAt" DESC LIMIT 1) AS "latestProofStatus"
      FROM "FeeInvoice" i
      WHERE i."studentId" = ${userId} AND i."schoolId" = ${schoolId}
      ORDER BY i."dueDate" DESC, i."issuedAt" DESC
    `);
    return invoices.map(invoice => ({ ...invoice, amount: Number(invoice.amount) }));
  }

  getPaymentDetails() {
    return {
      bankName: process.env.FEE_BANK_NAME || 'Global IME Bank',
      accountName: process.env.FEE_BANK_ACCOUNT_NAME || 'eSkool Pvt. Ltd.',
      accountNumber: process.env.FEE_BANK_ACCOUNT_NUMBER || '000000000000',
      qrCodeUrl: process.env.FEE_BANK_QR_URL || null,
      isDemo: !process.env.FEE_BANK_NAME || !process.env.FEE_BANK_ACCOUNT_NAME || !process.env.FEE_BANK_ACCOUNT_NUMBER || !process.env.FEE_BANK_QR_URL,
    };
  }

  async submitPaymentProof(invoiceId: string, user: { id: string; schoolId: string; role: string }, body: any, files: PaymentProofUpload[]) {
    if (user.role !== 'STUDENT') throw new ForbiddenException('Only students can submit fee payment proof.');
    const mobileNumber = typeof body.mobileNumber === 'string' ? body.mobileNumber.trim() : '';
    if (!/^\+?[0-9()\-\s]{7,20}$/.test(mobileNumber) || mobileNumber.replace(/\D/g, '').length < 7) {
      throw new BadRequestException('Enter a valid mobile number.');
    }
    const method = body.method;
    if (method !== 'WALLET' && method !== 'BANK_TRANSFER') throw new BadRequestException('Choose wallet or bank transfer.');
    const transactionId = typeof body.transactionId === 'string' ? body.transactionId.trim() : '';
    if (transactionId.length < 2 || transactionId.length > 100) throw new BadRequestException('Enter a valid transaction ID.');
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0 || !/^\d+(\.\d{1,2})?$/.test(String(body.amount))) {
      throw new BadRequestException('Enter a valid payment amount.');
    }

    const [invoice] = await this.prisma.$queryRaw<Array<{ id: string; amount: Prisma.Decimal; status: string }>>(Prisma.sql`
      SELECT "id", "amount", "status"::text AS "status" FROM "FeeInvoice"
      WHERE "id" = ${invoiceId} AND "studentId" = ${user.id} AND "schoolId" = ${user.schoolId} LIMIT 1
    `);
    if (!invoice) throw new NotFoundException('Invoice not found.');
    if (invoice.status === 'PAID') throw new BadRequestException('This invoice is already paid.');
    if (new Prisma.Decimal(amount).greaterThan(invoice.amount)) throw new BadRequestException('Payment amount cannot exceed the invoice balance.');

    const proofId = randomUUID();
    const submittedAt = new Date();
    await this.prisma.$transaction(async tx => {
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "FeePaymentProof" ("id", "schoolId", "studentId", "invoiceId", "mobileNumber", "method", "transactionId", "amount", "status", "submittedAt")
        VALUES (${proofId}, ${user.schoolId}, ${user.id}, ${invoiceId}, ${mobileNumber}, ${method}::"FeePaymentMethod", ${transactionId}, ${new Prisma.Decimal(amount)}, 'PENDING'::"FeePaymentProofStatus", ${submittedAt})
      `);
      for (const file of files) {
        const uploaded = this.cloudinary.isConfigured()
          ? await this.cloudinary.upload(file.buffer, { folder: `eskool/payment-proofs/${user.schoolId}`, resourceType: file.mimetype === 'application/pdf' ? 'raw' : 'image' })
          : null;
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "FeePaymentProofFile" ("id", "proofId", "fileName", "mimeType", "content", "storageUrl", "publicId")
          VALUES (${randomUUID()}, ${proofId}, ${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'payment-proof'}, ${file.mimetype}, ${uploaded ? Buffer.alloc(0) : file.buffer}, ${uploaded?.secure_url || null}, ${uploaded?.public_id || null})
        `);
      }
    });
    return { id: proofId, status: 'PENDING', submittedAt, message: 'Payment proof submitted for school verification.' };
  }
}
