"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";
import {
  applyTheme,
  readThemePref,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemePref,
} from "@/lib/theme";

interface ThemeContextValue {
  pref: ThemePref;
  resolved: "light" | "dark";
  setPref: (p: ThemePref) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) cb();
  };
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", onStorage);
  mq.addEventListener("change", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
    mq.removeEventListener("change", cb);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // useSyncExternalStore hands React a stable server snapshot ("system") and
  // the real client snapshot, and manages the hydration transition itself —
  // no effect, no cascading setState, no hydration error.
  const pref = useSyncExternalStore<ThemePref>(
    subscribe,
    () => readThemePref(),
    () => "system"
  );
  const resolved = useSyncExternalStore<"light" | "dark">(
    subscribe,
    () => resolveTheme(readThemePref()),
    () => "light"
  );

  const setPref = useCallback((p: ThemePref) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, p);
    } catch {
      /* ignore */
    }
    applyTheme(p);
    emit();
  }, []);

  return (
    <ThemeContext.Provider value={{ pref, resolved, setPref }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
