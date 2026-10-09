/*
  Warnings:

  - You are about to drop the column `parentName` on the `StudentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `parentPhone` on the `StudentProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "StudentProfile" DROP COLUMN "parentName",
DROP COLUMN "parentPhone",
ADD COLUMN     "admissionDate" TIMESTAMP(3),
ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "dobBs" TEXT,
ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "fatherPhone" TEXT,
ADD COLUMN     "motherName" TEXT,
ADD COLUMN     "motherPhone" TEXT,
ADD COLUMN     "temporaryAddress" TEXT;
