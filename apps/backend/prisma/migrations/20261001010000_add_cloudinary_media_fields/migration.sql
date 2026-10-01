ALTER TABLE "User" ADD COLUMN "profilePictureUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "profilePicturePublicId" TEXT;
ALTER TABLE "RoutineDocument" ADD COLUMN "storageUrl" TEXT;
ALTER TABLE "RoutineDocument" ADD COLUMN "publicId" TEXT;
ALTER TABLE "FeePaymentProofFile" ADD COLUMN "storageUrl" TEXT;
ALTER TABLE "FeePaymentProofFile" ADD COLUMN "publicId" TEXT;
