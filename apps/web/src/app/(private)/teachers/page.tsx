import { Plus } from "lucide-react";

import { LinkButton } from "@/components/shared/link-button";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTES } from "@/config/routes";
import { TeacherList } from "@/features/teachers/components/teacher-list";

export default function TeachersPage() {
  return (
    <>
      <PageHeader
        title="Teachers"
        description="Manage all teachers in your school"
        actions={
          <LinkButton href={ROUTES.teacherNew}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Teacher
          </LinkButton>
        }
      />
      <TeacherList />
    </>
  );
}