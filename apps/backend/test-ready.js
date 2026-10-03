import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://neondb_owner:npg_fJTbAp0U8aPh@ep-spring-sunset-b46agf5v-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true" } }
});
async function main() {
  const schema = await prisma.$queryRaw`
        SELECT
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'googleSubject')
          AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'profilePictureUrl')
          AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'tokenVersion') AS "userReady",
          EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AuthSession') AS "sessionsReady",
          EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AuditLog') AS "auditReady"
      `;
  console.log("Result:", schema);
}
main();
