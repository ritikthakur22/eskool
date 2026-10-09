const fs = require('fs');
const file = 'prisma/schema.prisma';
let code = fs.readFileSync(file, 'utf8');

// School status
code = code.replace(/status\s+String\s+@default\("ACTIVE"\)/, 'status           SchoolStatus         @default(ACTIVE)');

// User model
code = code.replace(/email\s+String\s+@unique/, 'email                    String                    @unique\n  userId                   String?                   @unique\n  emisId                   String?                   @unique');

const userIndex = `  @@index([email])\n  @@index([userId])\n  @@index([emisId])\n  @@index([schoolId])\n}`;
code = code.replace(/school\s+School\s+@relation\(fields: \[schoolId\], references: \[id\]\)\n}/, `school                   School                    @relation(fields: [schoolId], references: [id])\n\n${userIndex}`);

// School index
code = code.replace(/users\s+User\[\]\n}/, 'users            User[]\n\n  @@index([status])\n}');

// AuditOutbox
code = code.replace(/status\s+String\s+@default\("PENDING"\)/, 'status    AuditOutboxStatus   @default(PENDING)');

// Add Enums at the end
code += `\n\nenum AuditOutboxStatus {\n  PENDING\n  PROCESSED\n  FAILED\n}\n\nenum SchoolStatus {\n  ACTIVE\n  INACTIVE\n}\n`;

fs.writeFileSync(file, code);
