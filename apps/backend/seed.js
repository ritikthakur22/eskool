import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    const adminPassword = await bcrypt.hash('Password123', 10);
    const teacherPassword = await bcrypt.hash('Teacher123', 10);
    const studentPassword = await bcrypt.hash('Student123', 10);
    const school = await prisma.school.create({
        data: {
            name: 'eSkool Default Academy',
        }
    });
    const admin = await prisma.user.create({
        data: {
            email: 'admin@eskool.com',
            password: adminPassword,
            role: 'ADMIN',
            schoolId: school.id,
            adminProfile: {
                create: {
                    firstName: 'Super',
                    lastName: 'Admin'
                }
            }
        }
    });
    const teacher = await prisma.user.create({
        data: {
            email: 'teacher@eskool.com',
            password: teacherPassword,
            role: 'TEACHER',
            schoolId: school.id,
            teacherProfile: {
                create: {
                    firstName: 'John',
                    lastName: 'Doe',
                    subjects: ['Mathematics']
                }
            }
        }
    });
    const student = await prisma.user.create({
        data: {
            email: 'student@eskool.com',
            password: studentPassword,
            role: 'STUDENT',
            schoolId: school.id,
            studentProfile: {
                create: {
                    firstName: 'Tapas',
                    lastName: 'Dev',
                    grade: '10',
                    rollNo: '24'
                }
            }
        }
    });
    console.log('Seed successful: Created Admin, Teacher, and Student!');
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
