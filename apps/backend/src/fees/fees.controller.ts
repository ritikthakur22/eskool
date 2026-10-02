import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Request, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { FeesService, type PaymentProofUpload } from './fees.service.js';
import { assertFileSignature } from '../storage/file-validation.js';
import { SubmitPaymentProofDto } from './dto/payment-proof.dto.js';

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const maxProofSize = 5 * 1024 * 1024;

@Controller('fees')
@UseGuards(JwtAuthGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get('me')
  getMyInvoices(@Request() req: any) {
    return this.feesService.getInvoicesForUser(req.user.id, req.user.schoolId);
  }

  @Get('payment-details')
  getPaymentDetails() {
    return this.feesService.getPaymentDetails();
  }

  @Post(':invoiceId/payment-proofs')
  @UseInterceptors(FilesInterceptor('files', 2, {
    limits: { fileSize: maxProofSize, files: 2 },
    fileFilter: (_req, file, callback) => {
      if (file.mimetype !== 'application/pdf' && !allowedImageTypes.has(file.mimetype)) {
        callback(new BadRequestException('Upload up to two image files or one PDF.'), false);
        return;
      }
      callback(null, true);
    },
  }))
  submitPaymentProof(@Param('invoiceId', new ParseUUIDPipe()) invoiceId: string, @Body() body: SubmitPaymentProofDto, @UploadedFiles() files: PaymentProofUpload[] | undefined, @Request() req: any) {
    if (!files?.length) throw new BadRequestException('Attach at least one payment screenshot or PDF.');
    if (files.reduce((sum, file) => sum + file.size, 0) > maxProofSize) {
      throw new BadRequestException('The combined upload size must be 5 MB or less.');
    }
    const hasPdf = files.some(file => file.mimetype === 'application/pdf');
    if ((hasPdf && files.length !== 1) || (!hasPdf && files.length > 2)) {
      throw new BadRequestException('Attach one PDF or up to two photos, not a combination.');
    }
    files.forEach(assertFileSignature);
    return this.feesService.submitPaymentProof(invoiceId, req.user, body, files);
  }
}
