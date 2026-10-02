import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  
  if (users.length === 0) {
    const password = await bcrypt.hash('password123', 10);
    const schools = await prisma.school.findMany();
    const school = schools[0] || await prisma.school.create({
      data: {
        name: 'Demo eSkool',
        address: '123 Test St',
      }
    });

    const admin = await prisma.user.create({
      data: {
        email: 'admin@eskool.com',
        password,
        role: Role.SUPER_ADMIN,
        schoolId: school.id,
      }
    });
    console.log('Created admin:', admin.email, 'password123');
  } else {
    for (const u of users) {
      console.log(`Role: ${u.role}, Email: ${u.email}`);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
