ALTER TABLE "ClassRoutine"
  ALTER COLUMN "subjectId" DROP NOT NULL,
  ALTER COLUMN "teacherId" DROP NOT NULL,
  ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'CLASS',
  ADD COLUMN "label" TEXT;

CREATE TABLE "RoutineGrid" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  "days" JSONB NOT NULL,
  "periods" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RoutineGrid_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RoutineGrid_sectionId_key" ON "RoutineGrid"("sectionId");
CREATE INDEX "RoutineGrid_schoolId_idx" ON "RoutineGrid"("schoolId");

ALTER TABLE "RoutineGrid"
  ADD CONSTRAINT "RoutineGrid_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "RoutineGrid_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
