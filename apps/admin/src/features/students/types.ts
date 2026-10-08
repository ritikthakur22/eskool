export type Student = {
  // From the Prisma User model
  id: string;
  email: string;
  status: string; // "ACTIVE" | "DISABLED" | ...
  schoolId: string;
  createdAt: string;
  disabledAt: string | null;
  profilePictureUrl: string | null;
  // ASSUMED: replace with the real StudentProfile / Enrollment fields
  profile: {
    fullName: string;
    phone: string | null;
    address: string | null;
    className: string | null;
  };
};

export type CreateStudentPayload = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  className?: string;
  address?: string;
  status: "ACTIVE" | "DISABLED";
  profilePictureUrl: string | null;
};

export type StudentsQuery = {
  page: number;
  pageSize: number;
  search: string;
  status: string; // "ALL" or a status value
};

export type StudentsPage = {
  data: Student[];
  total: number;
};