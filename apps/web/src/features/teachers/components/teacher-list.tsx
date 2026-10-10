"use client";

import { PeopleList } from "@/components/shared/people-list";
import type { Column } from "@/components/shared/people-table";
import { ROUTES } from "@/config/routes";
import { teacherHooks } from "../hooks";
import type { Teacher } from "../types";
import { getTeacherName } from "../utils";
import { SubjectChips } from "./subject-chips";

const columns: Column<Teacher>[] = [
  { header: "Subjects", cell: (t) => <SubjectChips subjects={t.subjects} limit={3} /> },
];

export function TeacherList() {
  return (
    <PeopleList
      hooks={teacherHooks}
      noun="teacher"
      nameOf={getTeacherName}
      extraColumns={columns}
      searchPlaceholder="Search by name, email or subject..."
      routes={{ detail: ROUTES.teacherDetail, edit: ROUTES.teacherEdit }}
    />
  );
}