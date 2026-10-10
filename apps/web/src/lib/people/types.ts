export type Person = {
  id: string;
  email: string;
  status: string; // "ACTIVE" | "DISABLED"
  createdAt: string;
  updatedAt: string;
  disabledAt: string | null;
};

export type ListQuery = { page: number; pageSize: number; search: string; status: string };
export type ListPage<T> = { data: T[]; total: number };

// Same contract as the real endpoints: replace the mock with axios calls later.
export type PeopleApi<T extends Person, TCreate, TUpdate> = {
  list: (status: string) => Promise<T[]>;
  get: (id: string) => Promise<T>;
  create: (input: TCreate) => Promise<T>;
  update: (id: string, input: TUpdate) => Promise<T>;
  setStatus: (id: string, active: boolean) => Promise<{ id: string; status: string }>;
};