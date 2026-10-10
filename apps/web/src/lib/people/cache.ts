import type { QueryClient } from "@tanstack/react-query";
import type { Person } from "./types";

const newestFirst = (a: Person, b: Person) => b.createdAt.localeCompare(a.createdAt);

/**
 * Write a record into every cached list it belongs to (and remove it from the
 * ones it no longer matches), so mutations never need to refetch.
 * List keys look like [root, "list", statusFilter].
 */
export function syncIntoLists<T extends Person>(qc: QueryClient, listsKey: readonly unknown[], item: T) {
  const filterIndex = listsKey.length;

  for (const [key, list] of qc.getQueriesData<T[]>({ queryKey: listsKey })) {
    if (!list) continue;
    const filter = key[filterIndex];
    const belongs = filter === "ALL" || filter === item.status;
    const others = list.filter((row) => row.id !== item.id);
    qc.setQueryData(key, belongs ? [...others, item].sort(newestFirst) : others);
  }
}