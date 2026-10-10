import { useCallback } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/client";
import { syncIntoLists } from "./cache";
import type { ListPage, ListQuery, PeopleApi, Person } from "./types";

const DETAIL_STALE_TIME = 5 * 60_000;
const DETAIL_GC_TIME = 30 * 60_000;

// The mock API throws plain Errors; the real one throws axios errors.
const errorMessage = (error: unknown) =>
  error instanceof Error && !axios.isAxiosError(error)
    ? error.message
    : getErrorMessage(error);

type Config<T extends Person, TCreate, TUpdate> = {
  key: string; // query-key root, e.g. "teachers"
  noun: string; // used in toasts, e.g. "Teacher"
  api: PeopleApi<T, TCreate, TUpdate>;
  routes: { list: string; detail: (id: string) => string };
  searchText: (row: T) => string; // what the search box matches against
};

export function createPeopleHooks<T extends Person, TCreate, TUpdate>({
  key,
  noun,
  api,
  routes,
  searchText,
}: Config<T, TCreate, TUpdate>) {
  const keys = {
    all: [key] as const,
    lists: [key, "list"] as const,
    list: (status: string) => [key, "list", status] as const,
    detail: (id: string) => [key, "detail", id] as const,
  };

  // Detail seed: the full record if cached, otherwise the row we already have in a list
  const findCached = (qc: QueryClient, id: string) =>
    qc.getQueryData<T>(keys.detail(id)) ??
    qc
      .getQueriesData<T[]>({ queryKey: keys.lists })
      .flatMap(([, rows]) => rows ?? [])
      .find((row) => row.id === id);

  // One request per status filter; search and paging run on the cached list.
  function useList({ page, pageSize, search, status }: ListQuery) {
    const select = useCallback(
      (rows: T[]): ListPage<T> => {
        const q = search.trim().toLowerCase();
        const filtered = q
          ? rows.filter((row) => searchText(row).toLowerCase().includes(q))
          : rows;
        const start = (page - 1) * pageSize;
        return {
          data: filtered.slice(start, start + pageSize),
          total: filtered.length,
        };
      },
      [page, pageSize, search],
    );

    return useQuery<T[], Error, ListPage<T>>({
      queryKey: keys.list(status),
      queryFn: () => api.list(status),
      select,
      placeholderData: keepPreviousData,
    });
  }

  function useOne(id: string) {
    const qc = useQueryClient();
    return useQuery<T, Error>({
      queryKey: keys.detail(id),
      queryFn: () => api.get(id),
      staleTime: DETAIL_STALE_TIME,
      gcTime: DETAIL_GC_TIME,
      retry: false,
      placeholderData: (() => findCached(qc, id)) as never,
    });
  }

  function usePrefetch() {
    const qc = useQueryClient();
    return useCallback(
      (id: string) => {
        void qc.prefetchQuery({
          queryKey: keys.detail(id),
          queryFn: () => api.get(id),
          staleTime: DETAIL_STALE_TIME,
        });
      },
      [qc],
    );
  }

  function useCreate() {
    const qc = useQueryClient();
    const router = useRouter();

    return useMutation({
      mutationFn: (input: TCreate) => api.create(input),
      onSuccess: (item) => {
        qc.setQueryData(keys.detail(item.id), item);
        syncIntoLists(qc, keys.lists, item);
        toast.success(`${noun} added`);
        router.push(routes.list);
      },
      onError: (error) => toast.error(errorMessage(error)),
    });
  }

  function useUpdate(id: string) {
    const qc = useQueryClient();
    const router = useRouter();

    return useMutation({
      mutationFn: (input: TUpdate) => api.update(id, input),
      onSuccess: (item) => {
        qc.setQueryData(keys.detail(id), item);
        syncIntoLists(qc, keys.lists, item);
        toast.success(`${noun} updated`);
        router.push(routes.detail(id));
      },
      onError: (error) => toast.error(errorMessage(error)),
    });
  }

  function useSetStatus() {
    const qc = useQueryClient();

    return useMutation({
      mutationFn: ({ id, active }: { id: string; active: boolean }) =>
        api.setStatus(id, active),
      onSuccess: ({ id, status }, { active }) => {
        const detail = qc.getQueryData<T>(keys.detail(id));
        const base = detail ?? findCached(qc, id);
        if (base) {
          const updated = {
            ...base,
            status,
            disabledAt: active ? null : new Date().toISOString(),
          };
          if (detail) qc.setQueryData(keys.detail(id), updated);
          syncIntoLists(qc, keys.lists, updated);
        }
        toast.success(active ? `${noun} restored` : `${noun} disabled`);
      },
      onError: (error) => toast.error(errorMessage(error)),
    });
  }

  return {
    keys,
    useList,
    useOne,
    usePrefetch,
    useCreate,
    useUpdate,
    useSetStatus,
  };
}
