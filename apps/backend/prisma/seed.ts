import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const rawPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!rawPassword || rawPassword.length < 12) throw new Error('SEED_ADMIN_PASSWORD must be set to a 12+ character development-only password.');
  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  
  await prisma.user.update({
    where: { email: 'admin@eskool.com' },
    data: {
      password: hashedPassword,
    },
  });

  console.log('Development admin password updated.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
