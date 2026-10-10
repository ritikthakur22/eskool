import type { Admin } from "./types";

export const getAdminName = (a: Admin) => `${a.firstName} ${a.lastName}`.trim() || a.email;