"use client";

import { useState } from "react";

import { DetailSkeleton } from "@/components/shared/detail-skeleton";
import { EntityNotFound } from "@/components/shared/entity-not-found";
import { InfoCard } from "@/components/shared/info-card";
import { PersonHeader } from "@/components/shared/person-header";
import { StatusPill } from "@/components/shared/person-ui";
import { StatusDialog } from "@/components/shared/status-dialog";
import { ROUTES } from "@/config/routes";
import { formatDate } from "@/lib/format";
import { adminHooks } from "../hooks";
import { getAdminName } from "../utils";

const roleLabel = { ADMIN: "Admin", SUPER_ADMIN: "Super Admin" } as const;

export function AdminDetail({ userId }: { userId: string }) {
  const { data: admin, isLoading, isError } = adminHooks.useOne(userId);
  const { mutate, isPending } = adminHooks.useSetStatus();
  const [statusOpen, setStatusOpen] = useState(false);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !admin) return <EntityNotFound noun="admin" backHref={ROUTES.admins} />;

  const name = getAdminName(admin);

  return (
    <div className="space-y-6">
      <PersonHeader
        name={name}
        email={admin.email}
        id={admin.id}
        status={admin.status}
        createdAt={admin.createdAt}
        editHref={ROUTES.adminEdit(admin.id)}
        onToggleStatus={() => setStatusOpen(true)}
        badge={
          <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {roleLabel[admin.role]}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoCard
          title="Personal Information"
          rows={[
            ["First name", admin.firstName],
            ["Last name", admin.lastName],
          ]}
        />
        <InfoCard
          title="Work"
          rows={[
            ["Role", roleLabel[admin.role]],
            ["Department", admin.department],
          ]}
        />
        <InfoCard
          title="Account"
          rows={[
            ["Email", admin.email],
            ["Status", <StatusPill key="status" status={admin.status} />],
            ["Created", formatDate(admin.createdAt)],
            ["Last updated", formatDate(admin.updatedAt)],
            ["Disabled on", admin.disabledAt ? formatDate(admin.disabledAt) : null],
          ]}
        />
      </div>

      <StatusDialog
        target={statusOpen ? { id: admin.id, name, status: admin.status } : null}
        noun="admin"
        isPending={isPending}
        onClose={() => setStatusOpen(false)}
        onConfirm={(restoring) =>
          mutate({ id: admin.id, active: restoring }, { onSuccess: () => setStatusOpen(false) })
        }
      />
    </div>
  );
}