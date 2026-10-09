CREATE TABLE "ParentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "relationship" TEXT,
    CONSTRAINT "ParentProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ParentProfile_userId_key" ON "ParentProfile"("userId");

ALTER TABLE "ParentProfile"
ADD CONSTRAINT "ParentProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
