const fs = require('fs');
const file = 'src/users/users.controller.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /@Get\('me'\)/;
const getCountsMethod = `
  @Get('stats/counts')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async getUserCounts(@Request() req: any) {
    return this.usersService.getUserCounts(req.user.schoolId);
  }

  @Get('me')`;

code = code.replace(regex, getCountsMethod);
fs.writeFileSync(file, code);
