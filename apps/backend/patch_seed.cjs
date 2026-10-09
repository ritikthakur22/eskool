const fs = require('fs');
const file = 'seed.ts';
let code = fs.readFileSync(file, 'utf8');

const classSeedLogic = `
  const schools = await prisma.school.findMany();
  if (schools.length > 0) {
    const schoolId = schools[0].id;
    
    const classesData = [
      { name: 'Nursery', sections: ['A'] }, // Usually no sections or A
      { name: 'LKG', sections: ['A', 'B'] },
      { name: 'UKG', sections: ['A', 'B'] },
      { name: 'Class 1', sections: ['A', 'B'] },
      { name: 'Class 2', sections: ['A', 'B'] },
      { name: 'Class 3', sections: ['A', 'B'] },
      { name: 'Class 4', sections: ['A', 'B'] },
      { name: 'Class 5', sections: ['A', 'B'] },
      { name: 'Class 6', sections: ['A', 'B'] },
      { name: 'Class 7', sections: ['A', 'B'] },
      { name: 'Class 8', sections: ['A', 'B'] },
      { name: 'Class 9', sections: ['A', 'B'] },
      { name: 'Class 10', sections: ['A'] }, // no sections, so just A or no section
      // { name: 'Class 11', sections: ['A', 'B'] },
      // { name: 'Class 12', sections: ['A', 'B'] },
    ];

    for (const c of classesData) {
      const cls = await prisma.class.upsert({
        where: { schoolId_name: { schoolId, name: c.name } },
        update: {},
        create: { schoolId, name: c.name },
      });
      
      for (const s of c.sections) {
        await prisma.section.upsert({
          where: { classId_name: { classId: cls.id, name: s } },
          update: {},
          create: { schoolId, classId: cls.id, name: s },
        });
      }
    }
    console.log('Seeded classes and sections');
  }
`;

code = code.replace(/const users = await prisma.user.findMany\(\);/, classSeedLogic + '\n  const users = await prisma.user.findMany();');

fs.writeFileSync(file, code);
