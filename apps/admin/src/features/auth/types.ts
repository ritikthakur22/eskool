// export type AuthUser = {
//   id: string;
//   name: string;
//   email: string;
//   role: string;
// };

// export type LoginPayload = {
//   email: string;
//   password: string;
// };

// export type LoginResponse = {
//   user: AuthUser;
//   token: string;
// };


// src/lib/auth/types.ts
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  schoolId: string;
}

// Nest's login returns `sub`, /me returns req.user (likely `id`). Normalize both.
export function toAuthUser(u: any): AuthUser {
  return { id: u.id ?? u.sub, email: u.email, role: u.role, schoolId: u.schoolId };
}