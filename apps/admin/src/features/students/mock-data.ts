import type { Student } from "./types";

export const CLASS_OPTIONS = Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`);

const names = [
  "Aarav Sharma", "Sita Karki", "Bikash Thapa", "Anita Gurung", "Ramesh Rai", "Sunita Magar",
  "Prakash Adhikari", "Nisha Shrestha", "Suman Tamang", "Pooja Basnet", "Kiran Joshi", "Sabina Lama",
  "Dipesh Khadka", "Rina Pandey", "Manish Bhandari", "Asmita Neupane", "Rohan Gautam", "Sneha Poudel",
  "Binod Chaudhary", "Kabita Dahal", "Sagar Oli", "Mina Ghimire", "Utsav Regmi", "Laxmi Acharya",
];

export const students: Student[] = names.map((fullName, i) => ({
  id: `stu_${String(i + 1).padStart(4, "0")}`,
  email: `${fullName.toLowerCase().replace(" ", ".")}@example.com`,
  status: i % 7 === 3 ? "DISABLED" : "ACTIVE",
  schoolId: "sch_01",
  createdAt: new Date(Date.UTC(2026, 0, 5 + i * 6)).toISOString(),
  disabledAt: i % 7 === 3 ? new Date(Date.UTC(2026, 8, 1)).toISOString() : null,
  profilePictureUrl: null,
  profile: {
    fullName,
    phone: `98${String(41000000 + i * 137).slice(0, 8)}`,
    address: "Kathmandu",
    className: CLASS_OPTIONS[i % CLASS_OPTIONS.length],
  },
}));