import { ArrowLeft } from "lucide-react";

import { LinkButton } from "@/components/shared/link-button";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/config/routes";
import { AdminDetail } from "@/features/admins/components/admin-detail";

type Props = { params: Promise<{ userId: string }> };

export default async function AdminDetailPage({ params }: Props) {
  const { userId } = await params;

  return (
    <>
      <PageHeader
        title="Admin Details"
        description="Full record for this admin"
        actions={
          <LinkButton href={ROUTES.admins}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Go Back
          </LinkButton>
        }
      />
      <AdminDetail userId={userId} />
    </>
  );
}