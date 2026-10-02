import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findFirst() || await prisma.school.create({ data: { name: 'Demo eSkool', address: '123 Test St' } });
  
  let year = await prisma.academicYear.findFirst();
  if (!year) {
    year = await prisma.academicYear.create({ data: { name: '2026-2027', startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), schoolId: school.id } });
  }
  
  let c10 = await prisma.class.findFirst({ where: { name: 'Class 10' } }) || await prisma.class.create({ data: { name: 'Class 10', schoolId: school.id } });
  let c11 = await prisma.class.findFirst({ where: { name: 'Class 11' } }) || await prisma.class.create({ data: { name: 'Class 11', schoolId: school.id } });
  let c12 = await prisma.class.findFirst({ where: { name: 'Class 12' } }) || await prisma.class.create({ data: { name: 'Class 12', schoolId: school.id } });

  let s10a = await prisma.section.findFirst({ where: { name: 'A', classId: c10.id } }) || await prisma.section.create({ data: { name: 'A', classId: c10.id, schoolId: school.id } });
  let s11a = await prisma.section.findFirst({ where: { name: 'A', classId: c11.id } }) || await prisma.section.create({ data: { name: 'A', classId: c11.id, schoolId: school.id } });
  let s12a = await prisma.section.findFirst({ where: { name: 'A', classId: c12.id } }) || await prisma.section.create({ data: { name: 'A', classId: c12.id, schoolId: school.id } });
  let s12b = await prisma.section.findFirst({ where: { name: 'B', classId: c12.id } }) || await prisma.section.create({ data: { name: 'B', classId: c12.id, schoolId: school.id } });

  let sub = await prisma.subject.findFirst({ where: { code: 'GEN101' } }) || await prisma.subject.create({ data: { name: 'General', code: 'GEN101', schoolId: school.id } });

  const accounts = [
    { email: 'superadmin@eskool.com', pass: '5PWa-hkB1LQzZFpIvEFf', role: Role.SUPER_ADMIN, name: 'Super Admin', section: null },
    { email: 'admin1@eskool.com', pass: '7IQfwMK6AbW3FKj4MzKO', role: Role.ADMIN, name: 'Admin 1', section: null },
    { email: 'admin2@eskool.com', pass: 'VVZ7BV9hFgfjrFOnV0iv', role: Role.ADMIN, name: 'Admin 2', section: null },
    { email: 'teacher1@eskool.com', pass: '8uisHMgShYLCOAZkB64S', role: Role.TEACHER, name: 'Teacher 1', section: null },
    { email: 'student10a1@eskool.com', pass: 'nvlfPKpY2NGorf6r874L', role: Role.STUDENT, name: 'Student 10A1', section: s10a },
    { email: 'student10a2@eskool.com', pass: 'LxbSyVx6buG5FaJlftom', role: Role.STUDENT, name: 'Student 10A2', section: s10a },
    { email: 'student11a1@eskool.com', pass: 'yAJUkncQD2jiMzcuJV6e', role: Role.STUDENT, name: 'Student 11A1', section: s11a },
    { email: 'student11a2@eskool.com', pass: '818dOl3_VY4w8DxO1AxF', role: Role.STUDENT, name: 'Student 11A2', section: s11a },
    { email: 'student11a3@eskool.com', pass: '1Yp6rHJm_rB0SlazcVr9', role: Role.STUDENT, name: 'Student 11A3', section: s11a },
    { email: 'student12a1@eskool.com', pass: 'tz7XqNO3A9g1yugV5Z2K', role: Role.STUDENT, name: 'Student 12A1', section: s12a },
    { email: 'student12a2@eskool.com', pass: 'eVULpqxOrCJzDiYR70oh', role: Role.STUDENT, name: 'Student 12A2', section: s12a },
    { email: 'student12a3@eskool.com', pass: 'CcZqP0UsXjwexuLn6aXu', role: Role.STUDENT, name: 'Student 12A3', section: s12a },
    { email: 'student12b1@eskool.com', pass: 'dC-kHVE3N9YRyJ2JXUxD', role: Role.STUDENT, name: 'Student 12B1', section: s12b },
    { email: 'student12b2@eskool.com', pass: 'VvEKN7zqoZ_kWiHqF2Gn', role: Role.STUDENT, name: 'Student 12B2', section: s12b },
  ];

  for (const acc of accounts) {
    let u = await prisma.user.findUnique({ where: { email: acc.email } });
    
    if (!u) {
      const pw = await bcrypt.hash(acc.pass, 10);
      u = await prisma.user.create({
        data: {
          email: acc.email,
          password: pw,
          role: acc.role,
          schoolId: school.id,
        }
      });
    } else {
        const pw = await bcrypt.hash(acc.pass, 10);
        await prisma.user.update({ where: { id: u.id }, data: { password: pw } });
    }

    if (acc.role === Role.STUDENT && acc.section) {
      const p = await prisma.studentProfile.findUnique({ where: { userId: u.id } });
      if (!p) await prisma.studentProfile.create({ data: { userId: u.id, firstName: acc.name, lastName: '', rollNo: acc.email.split('@')[0] } });
      
      const e = await prisma.enrollment.findFirst({ where: { studentId: u.id } });
      if (!e) await prisma.enrollment.create({ data: { studentId: u.id, sectionId: acc.section.id, academicYearId: year.id } });
    } else if (acc.role === Role.TEACHER) {
      const p = await prisma.teacherProfile.findUnique({ where: { userId: u.id } });
      if (!p) await prisma.teacherProfile.create({ data: { userId: u.id, firstName: acc.name, lastName: '' } });
      
      const t = await prisma.teacherAssignment.findFirst({ where: { teacherId: u.id, sectionId: s10a.id } });
      if (!t) await prisma.teacherAssignment.create({ data: { teacherId: u.id, sectionId: s10a.id, subjectId: sub.id, academicYearId: year.id } });
    } else {
      const p = await prisma.adminProfile.findUnique({ where: { userId: u.id } });
      if (!p) await prisma.adminProfile.create({ data: { userId: u.id, firstName: acc.name, lastName: '' } });
    }
    console.log('Seeded:', acc.email);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
