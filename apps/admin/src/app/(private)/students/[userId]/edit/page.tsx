import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { EditStudentForm } from "@/features/students/components/edit-student-form";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ userId: string }> };

export default async function EditStudentPage({ params }: Props) {
  const { userId } = await params;

  return (
    <>
      <PageHeader
        title="Edit Student"
        description="Update this student's information"
        actions={
          <Link href={ROUTES.studentDetail(userId)} className={cn(buttonVariants(), "h-10 rounded-xl px-4")}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Go Back
          </Link>
        }
      />
      <div className="rounded-2xl border bg-card p-6">
        <EditStudentForm userId={userId} />
      </div>
    </>
  );
}