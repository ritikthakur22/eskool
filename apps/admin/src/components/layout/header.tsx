import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <h1 className="text-lg font-semibold">Eskool Admin</h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </header>
  );
}