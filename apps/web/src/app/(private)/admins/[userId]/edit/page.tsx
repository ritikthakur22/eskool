import { ArrowLeft } from "lucide-react";

import { LinkButton } from "@/components/shared/link-button";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/config/routes";
import { EditAdminForm } from "@/features/admins/components/admin-form";

type Props = { params: Promise<{ userId: string }> };

export default async function EditAdminPage({ params }: Props) {
  const { userId } = await params;

  return (
    <>
      <PageHeader
        title="Edit Admin"
        description="Update this admin's information"
        actions={
          <LinkButton href={ROUTES.adminDetail(userId)}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Go Back
          </LinkButton>
        }
      />
      <div className="rounded-2xl border bg-card p-6">
        <EditAdminForm userId={userId} />
      </div>
    </>
  );
}