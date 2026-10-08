"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";

import { navigation } from "@/config/navigation";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import Image from "next/image";

const fade = (collapsed: boolean) =>
  cn(
    "whitespace-nowrap transition-opacity duration-150 motion-reduce:transition-none",
    collapsed ? "lg:opacity-0" : "lg:opacity-100 lg:delay-150",
  );

export function Sidebar() {
  const pathname = usePathname();
  const {
    sidebarCollapsed: collapsed,
    mobileSidebarOpen,
    setMobileSidebar,
  } = useUIStore();

  const isActive = (href: string) =>
    href === ROUTES.dashboard ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebar(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-hidden border-r bg-card transition-[width,transform] duration-300 ease-in-out motion-reduce:transition-none",
          "lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0",
          collapsed && "lg:w-19",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-3 border-b px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
            <Image src={"/icon.png"} alt="logo" width={100} height={100} className="rounded-full"/>
          </div>
          <span className={cn("text-xl font-bold", fade(collapsed))}>
            Eskool
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto p-3">
          {navigation.map((section) => (
            <div key={section.title}>
              <div className="relative mb-2 h-5 px-4">
                <p
                  className={cn(
                    "text-xs font-medium uppercase tracking-wider text-muted-foreground",
                    fade(collapsed),
                  )}
                >
                  {section.title}
                </p>
                <div
                  className={cn(
                    "absolute inset-x-4 top-1/2 hidden h-px bg-border transition-opacity duration-200 lg:block",
                    collapsed ? "opacity-100 delay-100" : "opacity-0",
                  )}
                />
              </div>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={item.label}
                      onClick={() => setMobileSidebar(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className={fade(collapsed)}>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
