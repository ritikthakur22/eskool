import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Password123', 10);
  
  await prisma.user.update({
    where: { email: 'admin@eskool.com' },
    data: {
      password: hashedPassword,
    },
  });

  console.log('Password updated to Password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
