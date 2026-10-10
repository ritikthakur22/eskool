import { ArrowLeft } from "lucide-react";

import { LinkButton } from "@/components/shared/link-button";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/config/routes";
import { CreateAdminForm } from "@/features/admins/components/admin-form";

export default function NewAdminPage() {
  return (
    <>
      <PageHeader
        title="Add Admin"
        description="Create a new admin account"
        actions={
          <LinkButton href={ROUTES.admins}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Go Back
          </LinkButton>
        }
      />
      <div className="rounded-2xl border bg-card p-6">
        <CreateAdminForm />
      </div>
    </>
  );
}