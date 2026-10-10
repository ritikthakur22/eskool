import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/features/dashboard/api";
import { auditLogsKeys, type AuditLogFilters } from "@/features/auditLogs/keys";

export const useInfiniteAuditLogs = (filters: AuditLogFilters = {}) => {
  return useInfiniteQuery({
    queryKey: auditLogsKeys.auditLogsInfinite(filters),
    queryFn: ({ pageParam, signal }) => getAuditLogs({ ...filters, offset: pageParam }, signal),
    initialPageParam: 0,
    // Backend tells us whether there is more and where to continue from
    getNextPageParam: (last) => (last.hasMore ? (last.nextOffset ?? undefined) : undefined),
    placeholderData: keepPreviousData, // keep old rows visible while filters change
    staleTime: 30_000,
    refetchOnWindowFocus: false
  });
};