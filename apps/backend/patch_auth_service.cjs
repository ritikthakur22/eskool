const fs = require('fs');
const file = 'src/auth/auth.service.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace validateUser signature and body
const validateUserRegex = /async validateUser\(email: string, pass: string\): Promise<any> \{[\s\S]*?return null;\n    \} catch \(error\) \{/m;
const newValidateUser = `async validateUser(identifier: string, pass: string): Promise<any> {
    try {
      const trimmed = identifier.trim();
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: trimmed.toLowerCase() },
            { userId: trimmed },
            { emisId: trimmed }
          ]
        },
        include: { school: { select: { status: true } } },
      });
      if (user && user.status === 'ACTIVE' && user.school.status === 'ACTIVE' && await bcrypt.compare(pass, user.password)) {
        const { password: _password, ...result } = user;
        return result;
      }
      return null;
    } catch (error) {`;

code = code.replace(validateUserRegex, newValidateUser);

// Add getCurrentUserFormatted method before the end of the class
const methodRegex = /private hashRefreshToken\(token: string\) \{/;
const getCurrentUserFormattedMethod = `
  async getCurrentUserFormatted(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        adminProfile: true,
        teacherProfile: true,
        studentProfile: true,
      }
    });
    if (!user) return null;

    let firstName = null;
    let lastName = null;
    let department = null;

    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      firstName = user.adminProfile?.firstName;
      lastName = user.adminProfile?.lastName;
      department = user.adminProfile?.department;
    } else if (user.role === 'TEACHER') {
      firstName = user.teacherProfile?.firstName;
      lastName = user.teacherProfile?.lastName;
    } else if (user.role === 'STUDENT') {
      firstName = user.studentProfile?.firstName;
      lastName = user.studentProfile?.lastName;
    }

    return {
      id: user.id,
      userId: user.userId,
      emisId: user.emisId,
      email: user.email,
      role: user.role,
      firstName,
      lastName,
      department,
      profilePic: user.profilePictureUrl
    };
  }

  private hashRefreshToken(token: string) {`;

code = code.replace(methodRegex, getCurrentUserFormattedMethod);

// Replace createSession or login user return
const loginRegex = /async login\(user: any\) \{([\s\S]*?)return response;\n  \}/m;
const newLogin = `async login(user: any) {
    const session = await this.createSession(user);
    void this.audit.record({ action: 'LOGIN_SUCCESS', entity: 'User', entityId: user.id, userId: user.id, schoolId: user.schoolId });
    const { sessionId: _sessionId, ...response } = session;
    const formattedUser = await this.getCurrentUserFormatted(user.id);
    return { ...response, user: formattedUser || response.user };
  }`;

code = code.replace(loginRegex, newLogin);

fs.writeFileSync(file, code);
