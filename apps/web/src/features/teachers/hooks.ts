import { ROUTES } from "@/config/routes";
import { createPeopleHooks } from "@/lib/people/create-hooks";
import { teachersApi } from "./api";

export const teacherHooks = createPeopleHooks({
  key: "teachers",
  noun: "Teacher",
  api: teachersApi,
  routes: { list: ROUTES.teachers, detail: ROUTES.teacherDetail },
  searchText: (t) => `${t.firstName} ${t.lastName} ${t.email} ${t.id} ${t.subjects.join(" ")}`,
});