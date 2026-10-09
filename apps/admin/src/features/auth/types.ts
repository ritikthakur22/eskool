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
  // schoolId: string;
  schoolName?: string,
  firstName?: string,
  lastName?: string,
  department: string | null,
  profilePictureUrl: string | null
}

// Nest's login returns `sub`, /me returns req.user (likely `id`). Normalize both.
export function toAuthUser(u: any): AuthUser {
  return { id: u.id ?? u.sub, email: u.email, role: u.role, schoolName: u.schoolName, firstName: u.firstName, lastName: u.lastName, department: u.department, profilePictureUrl: u.profilePictureUrl };
}