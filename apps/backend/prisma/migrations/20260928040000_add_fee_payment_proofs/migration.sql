CREATE TYPE "FeePaymentMethod" AS ENUM ('WALLET', 'BANK_TRANSFER');
CREATE TYPE "FeePaymentProofStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "FeePaymentProof" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "method" "FeePaymentMethod" NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "FeePaymentProofStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeePaymentProof_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeePaymentProofFile" (
    "id" TEXT NOT NULL,
    "proofId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    CONSTRAINT "FeePaymentProofFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FeePaymentProof_schoolId_studentId_submittedAt_idx" ON "FeePaymentProof"("schoolId", "studentId", "submittedAt");
CREATE INDEX "FeePaymentProof_invoiceId_submittedAt_idx" ON "FeePaymentProof"("invoiceId", "submittedAt");
CREATE INDEX "FeePaymentProofFile_proofId_idx" ON "FeePaymentProofFile"("proofId");

ALTER TABLE "FeePaymentProof" ADD CONSTRAINT "FeePaymentProof_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeePaymentProof" ADD CONSTRAINT "FeePaymentProof_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeePaymentProof" ADD CONSTRAINT "FeePaymentProof_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "FeeInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeePaymentProofFile" ADD CONSTRAINT "FeePaymentProofFile_proofId_fkey"
    FOREIGN KEY ("proofId") REFERENCES "FeePaymentProof"("id") ON DELETE CASCADE ON UPDATE CASCADE;
