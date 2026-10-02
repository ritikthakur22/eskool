import { BadRequestException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { FeeInvoiceStatus, FeePaymentProofStatus, Prisma, Role } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { CloudinaryService } from '../storage/cloudinary.service.js';
import { AuditService } from '../audit/audit.service.js';
import { SubmitPaymentProofDto } from './dto/payment-proof.dto.js';

export type PaymentProofUpload = { buffer: Buffer; size: number; mimetype: string; originalname: string };

@Injectable()
export class FeesService {
  constructor(private readonly prisma: PrismaService, private readonly cloudinary: CloudinaryService, private readonly audit: AuditService) {}

  async getInvoicesForUser(userId: string, schoolId: string, role: string) {
    let studentIds = [userId];
    if (role === 'PARENT') {
      const linkedStudents = await this.prisma.parentStudent.findMany({
        where: { parentId: userId, student: { schoolId, role: 'STUDENT' } },
        select: { studentId: true },
      });
      studentIds = linkedStudents.map(link => link.studentId);
      if (!studentIds.length) return [];
    }
    const invoices = await this.prisma.$queryRaw<Array<{
      id: string; invoiceNumber: string; title: string; description: string | null; studentId: string;
      amount: Prisma.Decimal | number; dueDate: Date; status: string; issuedAt: Date; paidAt: Date | null; latestProofStatus: string | null;
    }>>(Prisma.sql`
      SELECT i."id", i."invoiceNumber", i."title", i."description", i."studentId", i."amount", i."dueDate", i."status", i."issuedAt", i."paidAt",
        (SELECT p."status"::text FROM "FeePaymentProof" p WHERE p."invoiceId" = i."id" ORDER BY p."submittedAt" DESC LIMIT 1) AS "latestProofStatus"
      FROM "FeeInvoice" i
      WHERE i."studentId" IN (${Prisma.join(studentIds)}) AND i."schoolId" = ${schoolId}
      ORDER BY i."dueDate" DESC, i."issuedAt" DESC
      LIMIT 100
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

  async submitPaymentProof(invoiceId: string, user: { id: string; schoolId: string; role: string }, body: SubmitPaymentProofDto, files: PaymentProofUpload[]) {
    if (!this.cloudinary.isConfigured()) throw new ServiceUnavailableException('Cloudinary storage is not configured.');
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
        const uploaded = await this.cloudinary.upload(file.buffer, { folder: `eskool/payment-proofs/${user.schoolId}`, resourceType: file.mimetype === 'application/pdf' ? 'raw' : 'image' });
        await tx.$executeRaw(Prisma.sql`
          INSERT INTO "FeePaymentProofFile" ("id", "proofId", "fileName", "mimeType", "storageUrl", "publicId")
          VALUES (${randomUUID()}, ${proofId}, ${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'payment-proof'}, ${file.mimetype}, ${uploaded.secure_url}, ${uploaded.public_id})
        `);
      }
    });
    void this.audit.record({ action: 'PAYMENT_PROOF_SUBMITTED', entity: 'FeePaymentProof', entityId: proofId, userId: user.id, schoolId: user.schoolId, details: { invoiceId, method, amount } });
    return { id: proofId, status: 'PENDING', submittedAt, message: 'Payment proof submitted for school verification.' };
  }

  async listPaymentProofs(schoolId: string, status?: string) {
    const proofStatus = status && Object.values(FeePaymentProofStatus).includes(status as FeePaymentProofStatus) ? status as FeePaymentProofStatus : undefined;
    return this.prisma.feePaymentProof.findMany({
      where: { schoolId, ...(proofStatus ? { status: proofStatus } : {}) },
      orderBy: { submittedAt: 'desc' },
      take: 100,
      select: {
        id: true, invoiceId: true, mobileNumber: true, method: true, transactionId: true, amount: true, status: true, submittedAt: true,
        invoice: { select: { invoiceNumber: true, title: true, amount: true, status: true } },
        student: { select: { id: true, email: true, studentProfile: { select: { firstName: true, lastName: true, rollNo: true, grade: true, section: true } } } },
        files: { select: { id: true, fileName: true, mimeType: true, storageUrl: true } },
      },
    });
  }

  async listManagedInvoices(schoolId: string, status?: string) {
    const invoiceStatus = status && Object.values(['DUE', 'OVERDUE', 'PAID']).includes(status) ? status as 'DUE' | 'OVERDUE' | 'PAID' : undefined;
    const invoices = await this.prisma.feeInvoice.findMany({
      where: { schoolId, ...(invoiceStatus ? { status: invoiceStatus } : {}) },
      orderBy: [{ dueDate: 'asc' }, { issuedAt: 'desc' }],
      take: 200,
      select: {
        id: true, invoiceNumber: true, title: true, description: true, amount: true, dueDate: true, status: true, issuedAt: true, paidAt: true,
        student: { select: { id: true, email: true, status: true, studentProfile: { select: { firstName: true, lastName: true, grade: true, section: true, rollNo: true } } } },
        paymentProofs: { orderBy: { submittedAt: 'desc' }, take: 1, select: { id: true, status: true, amount: true, transactionId: true, submittedAt: true } },
      },
    });
    return invoices.map(invoice => ({ ...invoice, amount: Number(invoice.amount), paymentProof: invoice.paymentProofs[0] ? { ...invoice.paymentProofs[0], amount: Number(invoice.paymentProofs[0].amount) } : null, paymentProofs: undefined }));
  }

  async reviewPaymentProof(id: string, status: 'APPROVED' | 'REJECTED', actor: { id: string; schoolId: string; role: Role }) {
    const proof = await this.prisma.feePaymentProof.findFirst({ where: { id, schoolId: actor.schoolId }, select: { id: true, invoiceId: true, studentId: true, amount: true, status: true, invoice: { select: { amount: true } } } });
    if (!proof) throw new NotFoundException('Payment proof not found in your school.');
    if (proof.status !== FeePaymentProofStatus.PENDING) throw new BadRequestException('This payment proof has already been reviewed.');
    const nextStatus = status === 'APPROVED' ? FeePaymentProofStatus.APPROVED : FeePaymentProofStatus.REJECTED;
    await this.prisma.$transaction(async tx => {
      await tx.feePaymentProof.update({ where: { id: proof.id }, data: { status: nextStatus } });
      if (nextStatus === FeePaymentProofStatus.APPROVED && new Prisma.Decimal(proof.amount).greaterThanOrEqualTo(proof.invoice.amount)) {
        await tx.feeInvoice.update({ where: { id: proof.invoiceId }, data: { status: FeeInvoiceStatus.PAID, paidAt: new Date() } });
      }
    });
    void this.audit.record({ action: nextStatus === FeePaymentProofStatus.APPROVED ? 'PAYMENT_PROOF_APPROVED' : 'PAYMENT_PROOF_REJECTED', entity: 'FeePaymentProof', entityId: proof.id, userId: actor.id, schoolId: actor.schoolId, details: { invoiceId: proof.invoiceId, studentId: proof.studentId, amount: Number(proof.amount), status: nextStatus } });
    return { id: proof.id, status: nextStatus };
  }
}
