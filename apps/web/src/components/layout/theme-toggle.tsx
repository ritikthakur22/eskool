"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Placeholder with the same size avoids layout shift and hydration mismatch
  if (!mounted) {
    return <div className="h-8 w-14 shrink-0 rounded-full border bg-muted" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="relative h-8 w-14 shrink-0 cursor-pointer rounded-full border border-border bg-muted p-1 transition-colors hover:border-primary/50 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Background track icons */}
      <div className="flex h-full w-full items-center justify-between px-1 opacity-20">
        <Sun className="h-3 w-3 text-foreground" />
        <Moon className="h-3 w-3 text-foreground" />
      </div>

      {/* Animated thumb */}
      <motion.div
        className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-md"
        initial={false}
        animate={{ x: isDark ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-foreground" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-foreground" />
        )}
      </motion.div>

      <span className="sr-only">Toggle theme</span>
    </button>
  );
}