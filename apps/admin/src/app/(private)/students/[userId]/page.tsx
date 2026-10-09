import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { StudentDetail } from "@/features/students/components/student-detail";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ userId: string }> };

export default async function StudentDetailPage({ params }: Props) {
  const { userId } = await params;

  return (
    <>
      <PageHeader
        title="Student Details"
        description="Full record for this student"
        actions={
          <Link href={ROUTES.students} className={cn(buttonVariants(), "h-10 rounded-xl px-4")}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Go Back
          </Link>
        }
      />
      <StudentDetail userId={userId} />
    </>
  );
}