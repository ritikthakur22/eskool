const fs = require('fs');
const file = 'src/users/users.service.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /  async getProfilePhoto\(userId: string\)/;
const method = `  async getUserCounts(schoolId: string) {
    const counts = await this.prisma.user.groupBy({
      by: ['role'],
      where: { schoolId },
      _count: { id: true },
    });
    
    let teacherCount = 0;
    let studentCount = 0;
    let adminCount = 0;

    counts.forEach(c => {
      if (c.role === 'TEACHER') teacherCount = c._count.id;
      else if (c.role === 'STUDENT') studentCount = c._count.id;
      else if (c.role === 'ADMIN' || c.role === 'SUPER_ADMIN') adminCount += c._count.id;
    });

    return { teacherCount, studentCount, adminCount };
  }

  async getProfilePhoto(userId: string)`;

code = code.replace(regex, method);
fs.writeFileSync(file, code);
