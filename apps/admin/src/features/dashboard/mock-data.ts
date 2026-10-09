import type { AuditLog, DashboardStat } from "./types";

export const dashboardStats: DashboardStat[] = [
  { key: "students", label: "Total Students", value: 1248},
  { key: "teachers", label: "Total Teachers", value: 86},
  { key: "admins", label: "Total Admins", value: 7},
  { key: "notices", label: "Total Notices", value: 34 },
];

export const weeklyActivity = [
  { day: "Sun", teachers: 25, students: 20, admins: 8 },
  { day: "Mon", teachers: 30, students: 28, admins: 10 },
  { day: "Tue", teachers: 22, students: 26, admins: 7 },
  { day: "Wed", teachers: 35, students: 30, admins: 12 },
  { day: "Thu", teachers: 28, students: 24, admins: 9 },
  { day: "Fri", teachers: 20, students: 22, admins: 6 },
  { day: "Sat", teachers: 8, students: 6, admins: 3 },
];

export const studentEnrollment = [
  { month: "Jan", students: 36 },
  { month: "Feb", students: 61 },
  { month: "Mar", students: 30 },
  { month: "Apr", students: 40 },
  { month: "May", students: 55 },
  { month: "Jun", students: 38 },
  { month: "Jul", students: 44 },
  { month: "Aug", students: 52 },
  { month: "Sep", students: 41 },
  { month: "Oct", students: 28 },
  { month: "Nov", students: 34 },
  { month: "Dec", students: 22 },
];

const base = { schoolId: "sch_01", userAgent: "Mozilla/5.0 (X11; Linux x86_64)" };

export const auditLogs: AuditLog[] = [
  {
    ...base, id: "log_01", userId: "usr_01", action: "LOGIN", entity: "User", entityId: "usr_01",
    details: null, ipAddress: "103.69.124.18", requestId: "req_8f21c",
    createdAt: "2026-10-08T09:12:00.000Z",
    user: { name: "Aadarsh", email: "aadarsh@example.com" },
  },
  {
    ...base, id: "log_02", userId: "usr_02", action: "CREATE", entity: "Student", entityId: "stu_4821",
    details: { name: "Sunita Rai", class: "Class 8" }, ipAddress: "103.69.124.22", requestId: "req_8f21d",
    createdAt: "2026-10-08T08:47:00.000Z",
    user: { name: "Sita Karki", email: "sita@example.com" },
  },
  {
    ...base, id: "log_03", userId: "usr_02", action: "UPDATE", entity: "Notice", entityId: "not_0192",
    details: { field: "title" }, ipAddress: "103.69.124.22", requestId: "req_8f21e",
    createdAt: "2026-10-08T08:15:00.000Z",
    user: { name: "Sita Karki", email: "sita@example.com" },
  },
  {
    ...base, id: "log_04", userId: "usr_03", action: "DELETE", entity: "Teacher", entityId: "tch_0077",
    details: { reason: "resigned" }, ipAddress: "27.34.68.101", requestId: "req_8f21f",
    createdAt: "2026-10-07T16:30:00.000Z",
    user: { name: "Ramesh Thapa", email: "ramesh@example.com" },
  },
  {
    ...base, id: "log_05", userId: "usr_03", action: "CREATE", entity: "Notice", entityId: "not_0193",
    details: { title: "Dashain holidays" }, ipAddress: "27.34.68.101", requestId: "req_8f220",
    createdAt: "2026-10-07T14:05:00.000Z",
    user: { name: "Ramesh Thapa", email: "ramesh@example.com" },
  },
  {
    ...base, id: "log_06", userId: "usr_04", action: "UPDATE", entity: "Student", entityId: "stu_3310",
    details: { field: "guardianPhone" }, ipAddress: "182.93.80.45", requestId: "req_8f221",
    createdAt: "2026-10-07T11:22:00.000Z",
    user: { name: "Anita Gurung", email: "anita@example.com" },
  },
  {
    ...base, id: "log_07", userId: null, action: "CREATE", entity: "Class", entityId: "cls_0010",
    details: { source: "seed" }, ipAddress: null, requestId: "req_8f222",
    createdAt: "2026-10-06T18:00:00.000Z",
    user: null,
  },
  {
    ...base, id: "log_08", userId: "usr_01", action: "LOGOUT", entity: "User", entityId: "usr_01",
    details: null, ipAddress: "103.69.124.18", requestId: "req_8f223",
    createdAt: "2026-10-06T17:41:00.000Z",
    user: { name: "Aadarsh", email: "aadarsh@example.com" },
  },
];