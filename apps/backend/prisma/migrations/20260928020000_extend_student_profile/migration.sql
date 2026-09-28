ALTER TABLE "StudentProfile"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "gender" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "profilePicture" BYTEA,
  ADD COLUMN "profilePictureMimeType" TEXT,
  ADD COLUMN "parentName" TEXT,
  ADD COLUMN "parentPhone" TEXT;
