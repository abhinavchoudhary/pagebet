"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Rss, BookOpen, User } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/feed", label: "Feed", Icon: Rss },
  { href: "/library", label: "Library", Icon: BookOpen },
  { href: "/profile", label: "Profile", Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{ backgroundColor: "var(--bg-card)", borderTop: "1px solid var(--border-default)" }}
    >
      <nav className="flex items-center justify-around px-4 pt-2" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom, 0px))" }}>
        {tabs.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 min-w-[48px] py-1 transition-all active:scale-[0.90] active:opacity-70"
            >
              <Icon
                size={22}
                strokeWidth={1.5}
                style={{ color: active ? "var(--app-accent)" : "var(--text-muted)" }}
              />
              <span
                className="text-[11px] font-medium"
                style={{ color: active ? "var(--app-accent)" : "var(--text-muted)" }}
              >
                {label}
              </span>
              {active && (
                <div
                  className="w-1 h-1 rounded-full"
                  style={{ backgroundColor: "var(--app-accent)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
