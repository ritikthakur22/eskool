export const studentKeys = {
  all: ["students"] as const,
  lists: () => [...studentKeys.all, "list"] as const,
  list: (status: string) => [...studentKeys.lists(), status] as const,
  detail: (id: string) => [...studentKeys.all, "detail", id] as const,
};