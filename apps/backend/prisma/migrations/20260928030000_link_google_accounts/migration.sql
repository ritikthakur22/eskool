ALTER TABLE "User"
  ADD COLUMN "googleSubject" TEXT,
  ADD COLUMN "googleEmail" TEXT;

CREATE UNIQUE INDEX "User_googleSubject_key" ON "User"("googleSubject");
