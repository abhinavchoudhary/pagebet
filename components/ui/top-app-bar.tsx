import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

interface TopAppBarProps {
  title?: React.ReactNode;
  /** href for the leading back button; omit to hide it */
  backHref?: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
  className?: string;
  /** larger headline variant, title sits on its own line below the row */
  large?: boolean;
}

/**
 * Material 3 top app bar (small / large). Sits inside the safe-area inset.
 */
export function TopAppBar({
  title,
  backHref,
  onBack,
  trailing,
  className,
  large,
}: TopAppBarProps) {
  const leading =
    backHref || onBack ? (
      backHref ? (
        <Link
          href={backHref}
          aria-label="Back"
          className="md-state-layer -ml-2 flex size-10 items-center justify-center rounded-corner-full text-on-surface"
        >
          <ArrowLeft className="size-6" />
        </Link>
      ) : (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="md-state-layer -ml-2 flex size-10 items-center justify-center rounded-corner-full text-on-surface"
        >
          <ArrowLeft className="size-6" />
        </button>
      )
    ) : null;

  return (
    <header
      className={cn("bg-surface", className)}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="flex h-16 items-center gap-1 px-1">
        {leading}
        {!large && (
          <h1 className="flex-1 truncate px-2 md-title-large text-on-surface">
            {title}
          </h1>
        )}
        {large && <div className="flex-1" />}
        <div className="flex items-center gap-1 pr-1">{trailing}</div>
      </div>
      {large && (
        <h1 className="px-4 pb-4 pt-1 md-headline-medium text-on-surface">
          {title}
        </h1>
      )}
    </header>
  );
}
