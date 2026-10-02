import { describe, expect, it } from 'vitest';
import { Role } from '@prisma/client';
import { canCreateRole, canManageRole } from './users.policy.js';

describe('user hierarchy policy', () => {
  it('allows admins to create only lower operational roles', () => {
    expect(canCreateRole(Role.ADMIN, Role.TEACHER)).toBe(true);
    expect(canCreateRole(Role.ADMIN, Role.STUDENT)).toBe(true);
    expect(canCreateRole(Role.ADMIN, Role.PARENT)).toBe(true);
    expect(canCreateRole(Role.ADMIN, Role.ADMIN)).toBe(false);
    expect(canCreateRole(Role.ADMIN, Role.SUPER_ADMIN)).toBe(false);
  });

  it('allows super-admin to create admins but not ordinary super-admins', () => {
    expect(canCreateRole(Role.SUPER_ADMIN, Role.ADMIN)).toBe(true);
    expect(canCreateRole(Role.SUPER_ADMIN, Role.TEACHER)).toBe(true);
    expect(canCreateRole(Role.SUPER_ADMIN, Role.SUPER_ADMIN)).toBe(false);
  });

  it('does not allow teachers or end users to provision accounts', () => {
    expect(canCreateRole(Role.TEACHER, Role.STUDENT)).toBe(false);
    expect(canCreateRole(Role.STUDENT, Role.PARENT)).toBe(false);
    expect(canCreateRole(Role.PARENT, Role.STUDENT)).toBe(false);
  });

  it('uses the same lower-hierarchy boundary for management', () => {
    expect(canManageRole(Role.SUPER_ADMIN, Role.ADMIN)).toBe(true);
    expect(canManageRole(Role.ADMIN, Role.ADMIN)).toBe(false);
    expect(canManageRole(Role.ADMIN, Role.STUDENT)).toBe(true);
    expect(canManageRole(Role.TEACHER, Role.STUDENT)).toBe(false);
  });
});
