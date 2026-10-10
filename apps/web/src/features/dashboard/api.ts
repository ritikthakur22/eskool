import { api } from "@/lib/client";
import { AuditLogParams, AuditLogsResponse } from "./types";

// export const getAuditLogs = async (
//   params?: AuditLogParams,
// ): Promise<AuditLogsResponse> => {
//   const { data } = await api.get<AuditLogsResponse>("/audit-logs", {
//     params,
//   });

//   return data;
// };

export const getAuditLogs = async (
  params?: AuditLogParams,
  signal?: AbortSignal,
): Promise<AuditLogsResponse> => {
  const { data } = await api.get<AuditLogsResponse>("/audit-logs", { params, signal });
  return data;
};


export const getUserCounts = async () => {
  const { data } = await api.get("/users/stats/counts");
  // teacherCount, studentCount, adminCount
  return data;
};

export const getNoticesCount = async () => {
  const { data } = await api.get("/notices/stats/count");
  return data;
};

// /notices/stats/count
