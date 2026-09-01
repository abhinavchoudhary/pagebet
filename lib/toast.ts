import { toast as sonner } from "sonner";

/** Thin wrapper around Sonner so call-sites stay tidy. */
export const toast = {
  success: (message: string) => sonner.success(message),
  error: (message: string) => sonner.error(message),
  message: (message: string) => sonner(message),
  /** Toast with an Undo action — used for destructive actions. */
  undo: (message: string, onUndo: () => void) =>
    sonner(message, {
      action: { label: "Undo", onClick: onUndo },
      duration: 6000,
    }),
};
