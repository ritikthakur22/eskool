import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

export function StudentNotFound() {
  return (
    <div className="rounded-2xl border bg-card p-10 text-center">
      <h2 className="text-lg font-semibold">Student not found</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This student may have been deleted, or the link is incorrect.
      </p>
      <Link href={ROUTES.students} className={cn(buttonVariants(), "mt-5 h-10 rounded-xl px-4")}>
        Back to students
      </Link>
    </div>
  );
}