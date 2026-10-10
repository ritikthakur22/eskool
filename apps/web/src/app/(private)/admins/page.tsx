import { Plus } from "lucide-react";

import { LinkButton } from "@/components/shared/link-button";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/config/routes";
import { AdminList } from "@/features/admins/components/admin-list";

export default function AdminsPage() {
  return (
    <>
      <PageHeader
        title="Admins"
        description="Manage school administrators"
        actions={
          <LinkButton href={ROUTES.adminNew}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Admin
          </LinkButton>
        }
      />
      <AdminList />
    </>
  );
}