import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "./api";
import {AuditLogParams} from "./types"

export const useAuditLogs = (params?: AuditLogParams) => {
  return useQuery({
    queryKey: ["audit-logs", params],
    queryFn: () => getAuditLogs(params),
  });
};