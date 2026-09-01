"use client";

import { Toaster as SonnerToaster } from "sonner";

import { useTheme } from "@/components/theme-provider";

/**
 * Sonner (Emil Kowalski's toast library), themed to the Material 3 palette.
 */
export function Toaster() {
  const { resolved } = useTheme();
  return (
    <SonnerToaster
      theme={resolved}
      position="bottom-center"
      offset={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)" }}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "!bg-inverse-surface !text-inverse-on-surface !border-none !rounded-corner-xs !md-elevation-3 !md-body-medium",
          actionButton:
            "!bg-inverse-primary !text-on-primary !rounded-corner-full !md-label-large !px-3 !h-8",
          cancelButton:
            "!bg-transparent !text-inverse-on-surface !md-label-large",
          description: "!text-inverse-on-surface/80",
        },
      }}
    />
  );
}
