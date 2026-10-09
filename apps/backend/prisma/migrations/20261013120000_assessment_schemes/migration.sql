ALTER TABLE "Exam" ADD COLUMN "assessmentCategory" TEXT NOT NULL DEFAULT 'OTHER';
ALTER TABLE "Exam" ADD COLUMN "assessmentSnapshot" JSONB;
ALTER TABLE "Exam" ADD COLUMN "startTime" TEXT;
ALTER TABLE "Exam" ADD COLUMN "endTime" TEXT;
ALTER TABLE "Exam" ADD COLUMN "venue" TEXT;

CREATE TABLE "AssessmentScheme" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "categoryWeights" JSONB NOT NULL,
    "gradeBands" JSONB NOT NULL,
    "templateUrl" TEXT,
    "templateName" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AssessmentScheme_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssessmentScheme_schoolId_classId_key" ON "AssessmentScheme"("schoolId", "classId");
CREATE INDEX "AssessmentScheme_schoolId_idx" ON "AssessmentScheme"("schoolId");

ALTER TABLE "AssessmentScheme" ADD CONSTRAINT "AssessmentScheme_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssessmentScheme" ADD CONSTRAINT "AssessmentScheme_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ExamRoutineDocument" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "publicId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExamRoutineDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExamRoutineDocument_schoolId_sectionId_createdAt_idx" ON "ExamRoutineDocument"("schoolId", "sectionId", "createdAt");
ALTER TABLE "ExamRoutineDocument" ADD CONSTRAINT "ExamRoutineDocument_schoolId_fkey"
FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamRoutineDocument" ADD CONSTRAINT "ExamRoutineDocument_sectionId_fkey"
FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExamRoutineDocument" ADD CONSTRAINT "ExamRoutineDocument_uploadedById_fkey"
FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
