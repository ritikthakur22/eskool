export type StudentProfile = {
  firstName: string;
  lastName: string;
  grade: string | null;
  section: string | null;
  rollNo: string | null;
  // Only returned by GET /users/admin/users/:id
  dob: string | null;
  dobBs: string | null;
  gender: string | null;
  bloodGroup: string | null;
  phone: string | null;
  address: string | null;
  temporaryAddress: string | null;
  admissionDate: string | null;
  fatherName: string | null;
  fatherPhone: string | null;
  motherName: string | null;
  motherPhone: string | null;
};

export type Student = {
  id: string;
  email: string;
  status: string; // "ACTIVE" | "DISABLED"
  profilePictureUrl: string | null;
  createdAt: string;
  updatedAt: string | null; // not returned by the list endpoint
  disabledAt: string | null;
  profile: StudentProfile;
};

// Only the fields the backend persists for students
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

// create-user returns the whole user row (minus password)
export type CreatedStudent = {
  id: string;
  email: string;
  userId?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string | null;
  disabledAt?: string | null;
};

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