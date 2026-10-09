const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'eee93018-ba85-4ae0-b8a2-0c226f89ae68'; 

  const classesToCreate = [
    { name: 'Nursery', sections: [] },
    { name: 'LKG', sections: ['a', 'b'] },
    { name: 'UKG', sections: ['a', 'b'] },
    { name: '1', sections: ['a', 'b'] },
    { name: '2', sections: ['a', 'b'] },
    { name: '3', sections: ['a', 'b'] },
    { name: '4', sections: ['a', 'b'] },
    { name: '5', sections: ['a', 'b'] },
    { name: '6', sections: ['a', 'b'] },
    { name: '7', sections: ['a', 'b'] },
    { name: '8', sections: ['a', 'b'] },
    { name: '9', sections: ['a', 'b'] },
    { name: '10', sections: [] },
  ];

  console.log('Fetching existing classes...');
  const existingClasses = await prisma.class.findMany({
    where: { schoolId },
    include: { sections: true }
  });

  for (const c of classesToCreate) {
    let classObj = existingClasses.find(ex => ex.name.trim() === c.name);
    if (!classObj) {
      classObj = await prisma.class.create({
        data: { schoolId, name: c.name },
        include: { sections: true }
      });
      console.log(`Created class: ${c.name}`);
    }

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
