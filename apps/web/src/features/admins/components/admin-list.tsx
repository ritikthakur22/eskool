"use client";

import { PeopleList } from "@/components/shared/people-list";
import type { Column } from "@/components/shared/people-table";
import { ROUTES } from "@/config/routes";
import { adminHooks } from "../hooks";
import type { Admin } from "../types";
import { getAdminName } from "../utils";

const columns: Column<Admin>[] = [
  { header: "Department", cell: (a) => a.department ?? "—" },
];

export function AdminList() {
  return (
    <PeopleList
      hooks={adminHooks}
      noun="admin"
      nameOf={getAdminName}
      extraColumns={columns}
      searchPlaceholder="Search by name, email or department..."
      routes={{ detail: ROUTES.adminDetail, edit: ROUTES.adminEdit }}
    />
  );
}