import { ArrowLeft } from "lucide-react";

import { LinkButton } from "@/components/shared/link-button";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/config/routes";
import { TeacherDetail } from "@/features/teachers/components/teacher-detail";

type Props = { params: Promise<{ userId: string }> };

export default async function TeacherDetailPage({ params }: Props) {
  const { userId } = await params;

  return (
    <>
      <PageHeader
        title="Teacher Details"
        description="Full record for this teacher"
        actions={
          <LinkButton href={ROUTES.teachers}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Go Back
          </LinkButton>
        }
      />
      <TeacherDetail userId={userId} />
    </>
  );
}