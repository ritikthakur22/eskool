import type { Person } from "@/lib/people/types";

export type Teacher = Person & {
  firstName: string;
  lastName: string;
  subjects: string[];
};

export type TeacherFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  subjects: string[];
  password?: string;
};

export type CreateTeacherInput = TeacherFormValues & { password: string };
export type UpdateTeacherInput = Omit<TeacherFormValues, "password">;