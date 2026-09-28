CREATE TABLE "RoutineDocument" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoutineDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RoutineDocument_schoolId_createdAt_idx" ON "RoutineDocument"("schoolId", "createdAt");

ALTER TABLE "RoutineDocument" ADD CONSTRAINT "RoutineDocument_schoolId_fkey"
    FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RoutineDocument" ADD CONSTRAINT "RoutineDocument_uploaderId_fkey"
    FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
