import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'superadmin@eskool.com' },
      include: { school: { select: { status: true } } },
    });
    console.log("User:", user);
  } catch (e) {
    console.error("Error:", e);
  }
}
main();
