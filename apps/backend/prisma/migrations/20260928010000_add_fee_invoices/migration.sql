CREATE TYPE "FeeInvoiceStatus" AS ENUM ('DUE', 'OVERDUE', 'PAID');

CREATE TABLE "FeeInvoice" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "FeeInvoiceStatus" NOT NULL DEFAULT 'DUE',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "FeeInvoice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeeInvoice_schoolId_invoiceNumber_key" ON "FeeInvoice"("schoolId", "invoiceNumber");
CREATE INDEX "FeeInvoice_schoolId_studentId_dueDate_idx" ON "FeeInvoice"("schoolId", "studentId", "dueDate");

ALTER TABLE "FeeInvoice" ADD CONSTRAINT "FeeInvoice_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeeInvoice" ADD CONSTRAINT "FeeInvoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
