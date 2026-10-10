import { ROUTES } from "@/config/routes";
import { createPeopleHooks } from "@/lib/people/create-hooks";
import { adminsApi } from "./api";

export const adminHooks = createPeopleHooks({
  key: "admins",
  noun: "Admin",
  api: adminsApi,
  routes: { list: ROUTES.admins, detail: ROUTES.adminDetail },
  searchText: (a) => `${a.firstName} ${a.lastName} ${a.email} ${a.id} ${a.department ?? ""}`,
});