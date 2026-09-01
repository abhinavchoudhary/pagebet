"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Rss, User, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs: {
  href: string;
  label: string;
  Icon: LucideIcon;
  match: (p: string) => boolean;
}[] = [
  {
    href: "/",
    label: "Challenges",
    Icon: Home,
    match: (p) => p === "/" || p.startsWith("/challenges"),
  },
  {
    href: "/library",
    label: "Library",
    Icon: BookOpen,
    match: (p) => p.startsWith("/library"),
  },
  { href: "/feed", label: "Feed", Icon: Rss, match: (p) => p.startsWith("/feed") },
  { href: "/profile", label: "You", Icon: User, match: (p) => p.startsWith("/profile") },
];

/**
 * Material 3 navigation bar. Active item shows a pill indicator behind the icon
 * that scales in (transform/opacity only — Emil Kowalski, fast + cheap).
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-surface-container"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex h-20 max-w-lg items-stretch justify-around px-2">
        {tabs.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="group flex flex-1 flex-col items-center justify-center gap-1 pt-3"
              >
                <span className="relative flex h-8 w-16 items-center justify-center">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-0 rounded-corner-full bg-secondary-container transition-[transform,opacity] duration-[var(--md-sys-motion-duration-medium-2)] ease-[var(--md-sys-motion-easing-emphasized)]",
                      active
                        ? "scale-100 opacity-100"
                        : "scale-x-50 scale-y-90 opacity-0"
                    )}
                  />
                  <Icon
                    className={cn(
                      "relative size-6 transition-colors duration-[var(--md-sys-motion-duration-short-3)]",
                      active
                        ? "text-on-secondary-container"
                        : "text-on-surface-variant group-active:text-on-surface"
                    )}
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                </span>
                <span
                  className={cn(
                    "md-label-medium transition-colors duration-[var(--md-sys-motion-duration-short-3)]",
                    active ? "text-on-surface" : "text-on-surface-variant"
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
