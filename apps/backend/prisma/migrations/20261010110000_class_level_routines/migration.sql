ALTER TABLE "ClassRoutine"
  ALTER COLUMN "sectionId" DROP NOT NULL,
  ADD COLUMN "classId" TEXT;

CREATE INDEX "ClassRoutine_schoolId_classId_idx" ON "ClassRoutine"("schoolId", "classId");
ALTER TABLE "ClassRoutine"
  ADD CONSTRAINT "ClassRoutine_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RoutineGrid" ALTER COLUMN "sectionId" DROP NOT NULL;
ALTER TABLE "RoutineGrid" ADD COLUMN "classId" TEXT;
CREATE UNIQUE INDEX "RoutineGrid_classId_key" ON "RoutineGrid"("classId");
ALTER TABLE "RoutineGrid"
  ADD CONSTRAINT "RoutineGrid_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;
