"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { useInfiniteAuditLogs } from "../hooks";
import type { AuditLog } from "@/features/dashboard/types";
import { ActionBadge, AuditLogUserCell, formatDateTime } from "@/components/shared/audit-log-ui";

const PAGE_SIZE = 20;
const COLUMNS = 5;

const startOfDay = (d: string) => new Date(`${d}T00:00:00`).toISOString();
const endOfDay = (d: string) => new Date(`${d}T23:59:59.999`).toISOString();

export function AuditLogsList() {
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const debouncedAction = useDebounce(action, 400);
  const debouncedEntity = useDebounce(entity, 400);

  // Memoized so the query key stays stable between renders
  const filters = useMemo(
    () => ({
      limit: PAGE_SIZE,
      action: debouncedAction.trim() || undefined,
      entity: debouncedEntity.trim() || undefined,
      from: from ? startOfDay(from) : undefined,
      to: to ? endOfDay(to) : undefined,
    }),
    [debouncedAction, debouncedEntity, from, to],
  );

  const {
    data,
    isPending,
    isError,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteAuditLogs(filters);

  // Flatten pages and drop duplicates (offset paging can repeat rows when new logs arrive)
  const logs = useMemo(() => {
    const seen = new Map<string, AuditLog>();
    for (const page of data?.pages ?? []) for (const log of page.items) seen.set(log.id, log);
    return Array.from(seen.values());
  }, [data]);

  // Infinite scroll: load the next page when the sentinel nears the viewport
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || isFetchNextPageError) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  const hasFilters = !!(action || entity || from || to);
  const clearFilters = () => {
    setAction("");
    setEntity("");
    setFrom("");
    setTo("");
  };

  return (
    <div className="rounded-2xl border bg-card p-5">
      {/* Filters */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="Action (e.g. USER_UPDATED)"
            className="h-11 rounded-xl pl-10"
          />
        </div>
        <Input
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          placeholder="Entity (e.g. User)"
          className="h-11 rounded-xl"
        />
        <Input
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="From date"
          className="h-11 rounded-xl"
        />
        <Input
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => setTo(e.target.value)}
          aria-label="To date"
          className="h-11 rounded-xl"
        />
        <Button
          type="button"
          variant="outline"
          disabled={!hasFilters}
          onClick={clearFilters}
          className="h-11 rounded-xl"
        >
          <X className="mr-1.5 h-4 w-4" />
          Clear
        </Button>
      </div>

      <div className={cn("transition-opacity", isFetching && !isPending && !isFetchingNextPage && "opacity-60")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isPending &&
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: COLUMNS }).map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 w-full max-w-30 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isPending && isError && logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS} className="py-10 text-center">
                  <p className="text-sm text-destructive">Failed to load audit logs.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                    Try again
                  </Button>
                </TableCell>
              </TableRow>
            )}

            {!isPending && !isError && logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS} className="py-10 text-center text-muted-foreground">
                  No audit logs found.
                </TableCell>
              </TableRow>
            )}

            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell><AuditLogUserCell log={log} /></TableCell>
                <TableCell><ActionBadge action={log.action} /></TableCell>
                <TableCell>
                  <p className="text-sm">{log.entity}</p>
                  <p className="text-xs text-muted-foreground">#{log.entityId ?? "—"}</p>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{log.ipAddress ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap text-right text-sm text-muted-foreground">
                  {formatDateTime(log.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer: sentinel + status */}
      <div ref={sentinelRef} className="flex min-h-12 items-center justify-center py-4 text-sm text-muted-foreground">
        {isFetchingNextPage && (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading more...
          </span>
        )}

        {isFetchNextPageError && (
          <span className="flex items-center gap-3">
            <span className="text-destructive">Couldn't load more logs.</span>
            <Button variant="outline" size="sm" onClick={() => fetchNextPage()}>
              Retry
            </Button>
          </span>
        )}

        {!hasNextPage && !isPending && !isError && logs.length > 0 && (
          <span>You've reached the end · {logs.length} logs</span>
        )}
      </div>
    </div>
  );
}