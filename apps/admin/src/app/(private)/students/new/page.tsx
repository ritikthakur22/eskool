import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";
import { CreateStudentForm } from "@/features/students/components/create-student-form";

export default function NewStudentPage() {
  return (
    <>
      <PageHeader
        title="Add Student"
        description="Create a new student account"
        actions={
          <Link href={ROUTES.students} className={cn(buttonVariants(), "h-10 rounded-xl px-4")}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Go Back
          </Link>
        }
      />
      <div className="rounded-2xl border bg-card p-6">
        <CreateStudentForm />
      </div>
    </>
  );
}