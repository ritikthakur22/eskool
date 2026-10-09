"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/config/routes";
// import { useAuthStore } from "@/store/auth-store";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu() {
  const router = useRouter();
//   const { user, logout } = useAuthStore();

//   const name = user?.name ?? "Admin";
const name = "Admin"

  const handleLogout = () => {
    // logout();
    router.replace(ROUTES.login);
  };

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
            {/* {user?.role?.toLowerCase() ?? "admin"} */}
            admin
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {/* {user?.email} */}
            test@gmail.com
            </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(ROUTES.settings)} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} className="text-destructive hover:bg-destructive/45! cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}