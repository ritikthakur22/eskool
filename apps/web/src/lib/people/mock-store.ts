import type { PeopleApi, Person } from "./types";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const newestFirst = (a: Person, b: Person) => b.createdAt.localeCompare(a.createdAt);

type Options<T extends Person, TCreate, TUpdate> = {
  seed: T[];
  /** Turn form input into a full record. `base` already has id, email, status and dates. */
  build: (input: TCreate, base: Person) => T;
  /** Apply form input to an existing record. */
  apply: (current: T, input: TUpdate) => T;
};

// In-memory store: resets on a full page reload.
export function createMockPeopleApi<
  T extends Person,
  TCreate extends { email: string },
  TUpdate extends { email: string },
>({ seed, build, apply }: Options<T, TCreate, TUpdate>): PeopleApi<T, TCreate, TUpdate> {
  let db = [...seed];

  const emailTaken = (email: string, exceptId?: string) =>
    db.some((p) => p.id !== exceptId && p.email.toLowerCase() === email.trim().toLowerCase());

  const find = (id: string) => {
    const person = db.find((p) => p.id === id);
    if (!person) throw new Error("Record not found");
    return person;
  };

  return {
    async list(status) {
      await wait(300);
      return db.filter((p) => status === "ALL" || p.status === status).sort(newestFirst);
    },

    async get(id) {
      await wait(150);
      return find(id);
    },

    async create(input) {
      await wait(500);
      if (emailTaken(input.email)) throw new Error("A user with this email already exists");

      const now = new Date().toISOString();
      const person = build(input, {
        id: `usr_${Date.now().toString(36)}`,
        email: input.email.trim().toLowerCase(),
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
        disabledAt: null,
      });
      db = [person, ...db];
      return person;
    },

    async update(id, input) {
      await wait(500);
      const current = find(id);
      if (emailTaken(input.email, id)) throw new Error("A user with this email already exists");

      const updated = { ...apply(current, input), updatedAt: new Date().toISOString() };
      db = db.map((p) => (p.id === id ? updated : p));
      return updated;
    },

    async setStatus(id, active) {
      await wait(300);
      find(id);
      const status = active ? "ACTIVE" : "DISABLED";
      db = db.map((p) =>
        p.id === id ? { ...p, status, disabledAt: active ? null : new Date().toISOString() } : p
      );
      return { id, status };
    },
  };
}