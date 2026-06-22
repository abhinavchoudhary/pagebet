"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Rss, User } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", Icon: Home, match: (p: string) => p === "/" },
  { href: "/library", label: "Bets", Icon: BookOpen, match: (p: string) => p.startsWith("/library") || p.startsWith("/challenges") },
  { href: "/feed", label: "Feed", Icon: Rss, match: (p: string) => p.startsWith("/feed") },
  { href: "/profile", label: "You", Icon: User, match: (p: string) => p.startsWith("/profile") },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{ backgroundColor: "var(--old-lace)", borderTop: "1px solid var(--border-default)" }}
    >
      <nav
        className="flex items-center justify-around px-4 pt-2"
        style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom, 0px))" }}
      >
        {tabs.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 min-w-[52px] py-1 transition-all active:scale-[0.90] active:opacity-70"
            >
              <Icon
                size={22}
                strokeWidth={1.75}
                style={{ color: active ? "var(--espresso)" : "var(--text-muted)" }}
              />
              <span
                className="text-[10px]"
                style={{
                  color: active ? "var(--espresso)" : "var(--text-muted)",
                  fontWeight: active ? 600 : 400,
                  fontFamily: "var(--font-inter)",
                }}
              >
                {label}
              </span>
              {active ? (
                <div
                  style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "var(--amber)" }}
                />
              ) : (
                <div style={{ width: 4, height: 4 }} />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
