import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://neondb_owner:npg_fJTbAp0U8aPh@ep-spring-sunset-b46agf5v-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true" } }
});
async function main() {
  const userCols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'User' AND column_name IN ('status', 'disabledAt', 'tokenVersion', 'profilePictureUrl')`;
  const schoolCols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'School' AND column_name = 'status'`;
  console.log("User:", userCols);
  console.log("School:", schoolCols);
  if (userCols.length !== 4 || schoolCols.length !== 1) console.log("FAILED");
  else console.log("SUCCESS");
}
main();
