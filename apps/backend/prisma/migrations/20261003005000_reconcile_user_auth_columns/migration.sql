-- Forward-only compatibility migration for databases created before the
-- profile/auth columns were added to User. Every operation is idempotent so
-- it is safe to rehearse against a production clone.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleSubject" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleEmail" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profilePicture" BYTEA;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profilePictureMimeType" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profilePictureUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profilePicturePublicId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "disabledAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "User_googleSubject_key" ON "User"("googleSubject");
