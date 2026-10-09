-- CreateEnum
CREATE TYPE "AuditOutboxStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "AuditOutbox" DROP COLUMN "status",
ADD COLUMN     "status" "AuditOutboxStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "School" DROP COLUMN "status",
ADD COLUMN     "status" "SchoolStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emisId" TEXT,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "AuditOutbox_status_createdAt_idx" ON "AuditOutbox"("status", "createdAt");

-- CreateIndex
CREATE INDEX "School_status_idx" ON "School"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_emisId_key" ON "User"("emisId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_userId_idx" ON "User"("userId");

-- CreateIndex
CREATE INDEX "User_emisId_idx" ON "User"("emisId");

-- CreateIndex
CREATE INDEX "User_schoolId_idx" ON "User"("schoolId");

