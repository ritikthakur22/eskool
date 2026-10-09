import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

function getPages(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const sorted = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const result: (number | "...")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("...");
    result.push(p);
  });
  return result;
}

const base = "flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm transition-colors";

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  return (
    <nav className="flex items-center gap-1" aria-label="Pagination">
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className={cn(base, "bg-primary/10 cursor-pointer text-primary hover:bg-primary/20 disabled:opacity-40")}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {getPages(page, totalPages).map((p, i) =>
        p === "..." ? (
          <span key={`gap-${i}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => onChange(p)}
            className={cn(
              base,
              p === page ? "bg-primary text-primary-foreground" : "text-primary hover:bg-primary/10 cursor-pointer"
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className={cn(base, "bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 cursor-pointer")}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}