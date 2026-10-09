import { CLASSES, CURRENT_ACADEMIC_YEAR } from "@/features/academics/mock-data";
import type { Student } from "./types";

const names = [
  "Aarav Sharma", "Sita Karki", "Bikash Thapa", "Anita Gurung", "Ramesh Rai", "Sunita Magar",
  "Prakash Adhikari", "Nisha Shrestha", "Suman Tamang", "Pooja Basnet", "Kiran Joshi", "Sabina Lama",
  "Dipesh Khadka", "Rina Pandey", "Manish Bhandari", "Asmita Neupane", "Rohan Gautam", "Sneha Poudel",
  "Binod Chaudhary", "Kabita Dahal", "Sagar Oli", "Mina Ghimire", "Utsav Regmi", "Laxmi Acharya",
];

const cities = ["Kathmandu", "Lalitpur", "Bhaktapur"];

export const students: Student[] = names.map((fullName, i) => {
  const [firstName, ...rest] = fullName.split(" ");
  const lastName = rest.join(" ");
  const cls = CLASSES[i % CLASSES.length];
  const section = cls.sections[i % cls.sections.length];
  const disabled = i % 7 === 3;
  const createdAt = new Date(Date.UTC(2026, 0, 5 + i * 6)).toISOString();

  return {
    id: `stu_${String(i + 1).padStart(4, "0")}`,
    email: `${fullName.toLowerCase().replace(" ", ".")}@example.com`,
    status: disabled ? "DISABLED" : "ACTIVE",
    schoolId: "sch_01",
    createdAt,
    updatedAt: createdAt,
    disabledAt: disabled ? new Date(Date.UTC(2026, 8, 1)).toISOString() : null,
    profilePictureUrl: null,
    profile: {
      firstName,
      lastName,
      phone: `98${String(41000000 + i * 137).slice(0, 8)}`,
      gender: i % 2 === 0 ? "Male" : "Female",
      dob: new Date(Date.UTC(2020 - (i % 10), i % 12, 1 + (i % 27))).toISOString(),
      address: cities[i % cities.length],
      parentName: `Mr. ${lastName}`,
      parentPhone: `97${String(51000000 + i * 211).slice(0, 8)}`,
    },
    enrollment: {
      sectionId: section.id,
      sectionName: section.name,
      classId: cls.id,
      className: cls.name,
      academicYearId: CURRENT_ACADEMIC_YEAR.id,
      academicYear: CURRENT_ACADEMIC_YEAR.name,
      rollNo: String((i % 30) + 1),
    },
  };
});