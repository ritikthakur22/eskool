import { ArrowLeft } from "lucide-react";

import { LinkButton } from "@/components/shared/link-button";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/config/routes";
import { EditTeacherForm } from "@/features/teachers/components/teacher-form";

type Props = { params: Promise<{ userId: string }> };

export default async function EditTeacherPage({ params }: Props) {
  const { userId } = await params;

  return (
    <>
      <PageHeader
        title="Edit Teacher"
        description="Update this teacher's information"
        actions={
          <LinkButton href={ROUTES.teacherDetail(userId)}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Go Back
          </LinkButton>
        }
      />
      <div className="rounded-2xl border bg-card p-6">
        <EditTeacherForm userId={userId} />
      </div>
    </>
  );
}