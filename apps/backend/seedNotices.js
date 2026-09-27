import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const admin = await prisma.user.findUnique({ where: { email: 'admin@eskool.com' } });
    if (!admin) return console.log("Admin not found!");

    await prisma.notice.create({
        data: {
            title: 'School Notice (Live DB)',
            content: 'This notice is coming from Neon Postgres DB!',
            category: 'Important',
            authorId: admin.id,
            date: new Date()
        }
    });
    
    await prisma.notice.create({
        data: {
            title: 'Chemistry MCQ Questions',
            content: 'Dear Students & Parents, the mock questions are out.',
            category: 'Academic',
            authorId: admin.id,
            date: new Date()
        }
    });

    console.log('Notices injected into database!');
}
main().finally(() => prisma.$disconnect());
