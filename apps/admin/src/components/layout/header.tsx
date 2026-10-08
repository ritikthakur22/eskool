"use client";

import { Bell, Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/stores/ui-store";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function Header() {
  const { sidebarCollapsed, toggleSidebar, setMobileSidebar } = useUIStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileSidebar(true)}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={toggleSidebar}
      >
        {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      <div className="relative hidden w-full max-w-sm md:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search" className="h-10 rounded-full bg-muted/50 pl-10" />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <Button variant="outline" size="icon" className="relative rounded-full">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
            3
          </span>
          <span className="sr-only">Notifications</span>
        </Button>

        <ThemeToggle />

        <div className="mx-2 hidden h-8 w-px bg-border sm:block" />
        <UserMenu />
      </div>
    </header>
  );
}