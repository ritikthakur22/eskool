"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, LogOut, Settings } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/config/routes";
import { useAuth, useLogout } from "@/features/auth/hooks";

function initials(name: string) {
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu() {
  const router = useRouter();
  const { user } = useAuth();
  const { mutate: logout, isPending } = useLogout();

  // AuthUser has no firstName (see note below), so derive a display name from the email.
  const name = user?.firstName ?? "";
  const role = user?.role.toLowerCase().replace("_", " ") ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex cursor-pointer items-center gap-3 rounded-full py-1 pl-1 pr-2 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          />
        }
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initials(name)}
        </span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block text-sm font-medium">{name}</span>
          <span className="block text-xs capitalize text-muted-foreground">
            {role}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.email}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push(ROUTES.settings)}
          className="cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => logout()}
          disabled={isPending}
          className="cursor-pointer text-destructive hover:bg-destructive/45!"
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
