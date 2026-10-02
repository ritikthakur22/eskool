import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    const passwords = JSON.parse(process.env.DEMO_SEED_PASSWORDS_JSON || '{}');
    const passwordFor = async (email) => {
        const password = passwords[email];
        if (!password || password.length < 12)
            throw new Error(`Missing or weak demo password for ${email}.`);
        return bcrypt.hash(password, 10);
    };
    const adminPassword = await passwordFor('admin@eskool.com');
    const teacherPassword = await passwordFor('teacher@eskool.com');
    const studentPassword = await passwordFor('student@eskool.com');
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
    console.log('Development seed successful.');
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
