import { api } from "@/lib/client";
import {  AuditLogParams, AuditLogsResponse } from "./types";


export const getAuditLogs = async (params?: AuditLogParams): Promise<AuditLogsResponse> => {
  const { data } = await api.get<AuditLogsResponse>("/audit-logs", {
    params,
  });

  return data;
};