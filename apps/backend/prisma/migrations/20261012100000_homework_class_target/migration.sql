ALTER TABLE "Homework" ADD COLUMN "classId" TEXT;

ALTER TABLE "Homework"
ADD CONSTRAINT "Homework_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "Class"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Homework_schoolId_classId_idx" ON "Homework"("schoolId", "classId");
