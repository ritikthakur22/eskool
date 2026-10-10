"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import type { ListPage, ListQuery, Person } from "@/lib/people/types";
import { cn } from "@/lib/utils";
import { NativeSelect } from "./native-select";
import { Pagination } from "./pagination";
import { PeopleTable, type Column } from "./people-table";
import { StatusDialog } from "./status-dialog";

const PAGE_SIZE = 10;

// The slice of a module's hooks this list needs
export type PeopleListHooks<T extends Person> = {
  useList: (query: ListQuery) => {
    data: ListPage<T> | undefined;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
  };
  usePrefetch: () => (id: string) => void;
  useSetStatus: () => {
    mutate: (vars: { id: string; active: boolean }, options?: { onSuccess?: () => void }) => void;
    isPending: boolean;
  };
};

type PeopleListProps<T extends Person> = {
  hooks: PeopleListHooks<T>;
  noun: string;
  nameOf: (row: T) => string;
  extraColumns: Column<T>[];
  searchPlaceholder: string;
  routes: { detail: (id: string) => string; edit: (id: string) => string };
};

export function PeopleList<T extends Person>({
  hooks,
  noun,
  nameOf,
  extraColumns,
  searchPlaceholder,
  routes,
}: PeopleListProps<T>) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<T | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading, isFetching, isError } = hooks.useList({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    status,
  });
  const prefetch = hooks.usePrefetch();
  const { mutate, isPending } = hooks.useSetStatus();

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

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
            placeholder={searchPlaceholder}
            className="h-11 rounded-xl pl-10"
          />
        </div>
        <NativeSelect
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="sm:w-44"
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DISABLED">Disabled</option>
        </NativeSelect>
      </div>

      <div className={cn("transition-opacity", isFetching && !isLoading && "opacity-60")}>
        <PeopleTable
          rows={data?.data ?? []}
          extraColumns={extraColumns}
          nameOf={nameOf}
          noun={noun}
          isLoading={isLoading}
          isError={isError}
          detailHref={routes.detail}
          editHref={routes.edit}
          onToggleStatus={setTarget}
          onPrefetch={prefetch}
        />
      </div>

      <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          Showing {from} to {to} of {total} results
        </p>
        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
      </div>

      <StatusDialog
        target={target ? { id: target.id, name: nameOf(target), status: target.status } : null}
        noun={noun}
        isPending={isPending}
        onClose={() => setTarget(null)}
        onConfirm={(restoring) =>
          target && mutate({ id: target.id, active: restoring }, { onSuccess: () => setTarget(null) })
        }
      />
    </div>
  );
}