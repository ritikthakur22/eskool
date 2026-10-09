import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'test@example.com' },
          { userId: 'test' },
          { emisId: 'test' }
        ]
      },
      include: { school: { select: { status: true } } },
    });
    console.log(user);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
