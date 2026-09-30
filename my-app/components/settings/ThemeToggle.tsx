"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { IconMoon, IconSun } from "@/components/Icons";

const subscribeNever = () => () => {};

/** True once the component has mounted on the client, false during SSR — avoids a hydration mismatch. */
function useMounted() {
  return useSyncExternalStore(subscribeNever, () => true, () => false);
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      className={className ? `icon-btn ${className}` : "icon-btn"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {mounted && (isDark ? <IconSun size={19} /> : <IconMoon size={19} />)}
    </button>
  );
}
