import { ArrowLeft } from "lucide-react";

import { LinkButton } from "@/components/shared/link-button";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/config/routes";
import { CreateTeacherForm } from "@/features/teachers/components/teacher-form";

export default function NewTeacherPage() {
  return (
    <>
      <PageHeader
        title="Add Teacher"
        description="Create a new teacher account"
        actions={
          <LinkButton href={ROUTES.teachers}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Go Back
          </LinkButton>
        }
      />
      <div className="rounded-2xl border bg-card p-6">
        <CreateTeacherForm />
      </div>
    </>
  );
}