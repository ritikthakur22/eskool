import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { StudentList } from "@/features/students/components/student-list";
import { cn } from "@/lib/utils";

export default function StudentsPage() {
  return (
    <>
      <PageHeader
        title="Students"
        description="Manage all students in your school"
        actions={
          <Link href={ROUTES.studentNew} className={cn(buttonVariants(), "h-10 rounded-xl px-4")}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Student
          </Link>
        }
      />
      <StudentList />
    </>
  );
}