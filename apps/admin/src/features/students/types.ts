export type StudentEnrollment = {
  sectionId: string;
  sectionName: string;
  classId: string;
  className: string;
  academicYearId: string;
  academicYear: string;
  rollNo: string | null;
};

// export type StudentProfile = {
//   firstName: string;
//   lastName: string;
//   phone: string | null;
//   gender: string | null;
//   dob: string | null;
//   address: string | null;
//   parentName: string | null;
//   parentPhone: string | null;
// };

// export type Student = {
//   // User
//   id: string;
//   email: string;
//   status: string;
//   schoolId: string;
//   createdAt: string;
//   updatedAt: string;
//   disabledAt: string | null;
//   profilePictureUrl: string | null;
//   // Relations
//   profile: StudentProfile;
//   enrollment: StudentEnrollment | null;
// };

export type StudentInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  dob?: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  classId?: string;
  sectionId?: string;
  rollNo?: string;
  status: "ACTIVE" | "DISABLED";
};

// export type StudentFormPayload = StudentInput & { password?: string; profilePictureUrl: string | null };
// export type CreateStudentPayload = StudentInput & { password: string; profilePictureUrl: string | null };
// export type UpdateStudentPayload = StudentInput & { profilePictureUrl: string | null };

// export type StudentsQuery = {
//   page: number;
//   pageSize: number;
//   search: string;
//   status: string; // "ALL" or a status value
// };

// export type StudentsPage = {
//   data: Student[];
//   total: number;
// };


export type StudentProfile = {
  firstName: string;
  lastName: string;
  grade: string | null;
  section: string | null;
  rollNo: string | null;
  // Only returned by GET /users/admin/users/:id (read-only for admins)
  dob: string | null;
  phone: string | null;
  gender: string | null;
  address: string | null;
  parentName: string | null;
  parentPhone: string | null;
};

export type Student = {
  id: string;
  email: string;
  status: string; // "ACTIVE" | "DISABLED"
  createdAt: string;
  updatedAt: string | null; // not returned by the list endpoint
  disabledAt: string | null;
  profile: StudentProfile;
};

export type StudentFormPayload = {
  firstName: string;
  lastName: string;
  email: string;
  grade: string;
  section: string;
  rollNo: string;
  password?: string;
};

export type CreateStudentPayload = StudentFormPayload & { password: string };
export type UpdateStudentPayload = Omit<StudentFormPayload, "password">;

export type StudentsQuery = {
  page: number;
  pageSize: number;
  search: string;
  status: string; // "ALL" | "ACTIVE" | "DISABLED"
};

export type StudentsPage = {
  data: Student[];
  total: number;
};