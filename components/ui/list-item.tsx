import * as React from "react";

import { cn } from "@/lib/utils";

interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  overline?: React.ReactNode;
  headline: React.ReactNode;
  supportingText?: React.ReactNode;
  interactive?: boolean;
}

/**
 * Material 3 list item — leading slot, two-line text block, trailing slot.
 */
export const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  (
    {
      leading,
      trailing,
      overline,
      headline,
      supportingText,
      interactive,
      className,
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-4 px-4 py-3",
        interactive && "md-state-layer cursor-pointer text-on-surface",
        className
      )}
      {...props}
    >
      {leading != null && <div className="z-[1] shrink-0">{leading}</div>}
      <div className="z-[1] min-w-0 flex-1">
        {overline != null && (
          <p className="md-label-small text-on-surface-variant">{overline}</p>
        )}
        <p className="truncate md-body-large text-on-surface">{headline}</p>
        {supportingText != null && (
          <p className="truncate md-body-medium text-on-surface-variant">
            {supportingText}
          </p>
        )}
      </div>
      {trailing != null && (
        <div className="z-[1] shrink-0 md-label-medium text-on-surface-variant">
          {trailing}
        </div>
      )}
    </div>
  )
);
ListItem.displayName = "ListItem";
