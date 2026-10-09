import { useQuery } from "@tanstack/react-query";
import { getAuditLogs, getNoticesCount, getUserCounts } from "./api";
import {AuditLogParams} from "./types"
import { dashboardKeys } from "./keys";

export const useAuditLogs = (params?: AuditLogParams) => {
  return useQuery({
    queryKey: dashboardKeys.auditLogs(params),
    queryFn: () => getAuditLogs(params),
  });
};


export const useUserCounts = () => {
  return useQuery({
    queryKey: dashboardKeys.userCount(),
    queryFn: getUserCounts,
    refetchOnWindowFocus: false
  })
}

export const useNoticeCounts = () => {
  return useQuery({
    queryKey: dashboardKeys.noticeCount(),
    queryFn: getNoticesCount,
    refetchOnWindowFocus: false
  })
}