ALTER TABLE "User"
ADD COLUMN "profilePicture" BYTEA,
ADD COLUMN "profilePictureMimeType" TEXT;

UPDATE "User" AS u
SET "profilePicture" = sp."profilePicture",
    "profilePictureMimeType" = sp."profilePictureMimeType"
FROM "StudentProfile" AS sp
WHERE sp."userId" = u."id"
  AND sp."profilePicture" IS NOT NULL;
