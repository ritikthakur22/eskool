"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { NativeSelect } from "@/components/shared/native-select";
import { Pagination } from "@/components/shared/pagination";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { useStudents } from "../hooks";
import { StudentStatusDialog } from "./student-status-dialog";
import type { Student } from "../types";
import { StudentsTable } from "./students-table";

const PAGE_SIZE = 10;

export function StudentList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [statusTarget, setStatusTarget] = useState<Student | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading, isFetching, isError } = useStudents({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    status,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  // e.g. after deleting the last row on the last page
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email or ID..."
            className="h-11 rounded-xl pl-10"
          />
        </div>
        <NativeSelect
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="sm:w-44 cursor-pointer"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DISABLED">Disabled</option>
        </NativeSelect>
      </div>

      <div className={cn("transition-opacity", isFetching && !isLoading && "opacity-60")}>
        <StudentsTable
          students={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          onToggleStatus={setStatusTarget}
        />
      </div>

      <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          Showing {from} to {to} of {total} results
        </p>
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
      </div>

      <StudentStatusDialog student={statusTarget} onClose={() => setStatusTarget(null)} />
    </div>
  );
}