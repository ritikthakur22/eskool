import { Role } from '@prisma/client';

const creatableRoles: Record<Role, readonly Role[]> = {
  [Role.SUPER_ADMIN]: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
  [Role.ADMIN]: [Role.TEACHER, Role.STUDENT, Role.PARENT],
  [Role.TEACHER]: [],
  [Role.STUDENT]: [],
  [Role.PARENT]: [],
};

export function canCreateRole(actorRole: Role, targetRole: Role) {
  return creatableRoles[actorRole]?.includes(targetRole) ?? false;
}

export function canManageRole(actorRole: Role, targetRole: Role) {
  return canCreateRole(actorRole, targetRole);
}
