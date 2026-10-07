import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findFirst();
  const teacher = await prisma.user.findFirst({ where: { email: 'teacher1@eskool.com' } });
  
  if (!school || !teacher) return console.log("Missing school or teacher1");

  const sections = await prisma.section.findMany();
  const subject = await prisma.subject.findFirst();
  if (!subject || sections.length === 0) return console.log("Missing subject or sections");

  // Create routines for teacher1 for every section!
  // E.g., Section 1A gets Monday period 1, Section 2A gets Monday period 2, etc.
  
  await prisma.classRoutine.deleteMany({
    where: { teacherId: teacher.id }
  });

  const routines = [];
  let day = 1; // 1 = Monday
  let startHour = 9;

  for (const sec of sections) {
    routines.push({
      schoolId: school.id,
      sectionId: sec.id,
      subjectId: subject.id,
      teacherId: teacher.id,
      dayOfWeek: day,
      startTime: `${startHour.toString().padStart(2, '0')}:00`,
      endTime: `${(startHour + 1).toString().padStart(2, '0')}:00`
    });

    startHour++;
    if (startHour > 15) {
      startHour = 9;
      day++;
      if (day > 5) day = 1; // loop back to Monday if needed
    }
  }

  await prisma.classRoutine.createMany({ data: routines });
  console.log(`Seeded ${routines.length} routine entries for teacher1!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
