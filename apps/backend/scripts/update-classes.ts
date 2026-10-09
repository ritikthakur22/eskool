import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const schoolId = 'eee93018-ba85-4ae0-b8a2-0c226f89ae68'; // From your previous DB query

  const classesToCreate = [
    { name: 'Nursery', sections: [] },
    { name: 'LKG', sections: ['A', 'B'] },
    { name: 'UKG', sections: ['A', 'B'] },
    { name: '1', sections: ['A', 'B'] },
    { name: '2', sections: ['A', 'B'] },
    { name: '3', sections: ['A', 'B'] },
    { name: '4', sections: ['A', 'B'] },
    { name: '5', sections: ['A', 'B'] },
    { name: '6', sections: ['A', 'B'] },
    { name: '7', sections: ['A', 'B'] },
    { name: '8', sections: ['A', 'B'] },
    { name: '9', sections: ['A', 'B'] },
    { name: '10', sections: [] },
  ];

  console.log('Fetching existing classes...');
  const existingClasses = await prisma.class.findMany({
    where: { schoolId },
    include: { sections: true }
  });

  // Create or update desired classes
  for (const c of classesToCreate) {
    let classObj = existingClasses.find(ex => ex.name.trim() === c.name);
    if (!classObj) {
      classObj = await prisma.class.create({
        data: { schoolId, name: c.name },
        include: { sections: true }
      });
      console.log(`Created class: ${c.name}`);
    }

    // Ensure sections exist
    for (const sec of c.sections) {
      const sectionObj = classObj.sections.find(s => s.name === sec);
      if (!sectionObj) {
        await prisma.section.create({
          data: { schoolId, classId: classObj.id, name: sec }
        });
        console.log(`Created section ${sec} for class ${c.name}`);
      }
    }
  }

  // Delete unwanted classes (11, 12, Class 10, etc.)
  const wantedClassNames = classesToCreate.map(c => c.name);
  for (const ex of existingClasses) {
    if (!wantedClassNames.includes(ex.name)) {
      try {
        await prisma.class.delete({ where: { id: ex.id } });
        console.log(`Deleted unwanted class: ${ex.name}`);
      } catch (e) {
        console.log(`Could not delete class ${ex.name} - might be in use`);
      }
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
