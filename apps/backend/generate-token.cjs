const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function main() {
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  if (!teacher) { console.log("No teacher found"); return; }
  
  const token = jwt.sign(
    { sub: teacher.id, email: teacher.email, role: teacher.role, schoolId: teacher.schoolId, tokenVersion: 0 },
    'e93a6b5c8f214d0f98e7a6c5b4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5', // Wait, I need the actual JWT_SECRET! Let's check .env
    { expiresIn: '1h' }
  );
  console.log("Teacher Token:", token);
}
main().catch(console.error).finally(() => prisma.$disconnect());
