const fs = require('fs');
const file = 'src/notices/notices.controller.ts';
let code = fs.readFileSync(file, 'utf8');

const controllerRegex = /  @Get\(\)/;
const controllerMethod = `  @Get('stats/count')
  async getNoticesCount(@Request() req: any) {
    return this.noticesService.getNoticesCount(req.user.schoolId);
  }

  @Get()`;

code = code.replace(controllerRegex, controllerMethod);
fs.writeFileSync(file, code);

const file2 = 'src/notices/notices.service.ts';
let code2 = fs.readFileSync(file2, 'utf8');
const serviceRegex = /  async getAllNotices/;
const serviceMethod = `  async getNoticesCount(schoolId: string) {
    const total = await this.prisma.notice.count({ where: { schoolId } });
    return { totalNotices: total };
  }

  async getAllNotices`;

code2 = code2.replace(serviceRegex, serviceMethod);
fs.writeFileSync(file2, code2);
