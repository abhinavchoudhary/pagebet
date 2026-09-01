"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface TextFieldProps {
  label: string;
  supportingText?: string;
  error?: boolean;
  containerClassName?: string;
  className?: string;
  id?: string;
  multiline?: boolean;
  rows?: number;
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  name?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLElement>["inputMode"];
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>;
}

/**
 * Material 3 filled text field with a floating label.
 */
export const TextField = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  TextFieldProps
>(function TextField(
  {
    label,
    supportingText,
    error,
    className,
    containerClassName,
    id,
    multiline,
    rows = 3,
    ...field
  },
  ref
) {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  const fieldClass = cn(
    "peer w-full resize-none bg-transparent px-4 pb-2 pt-6 md-body-large text-on-surface outline-none placeholder:text-transparent",
    className
  );

  return (
    <div className={cn("flex flex-col gap-1", containerClassName)}>
      <div
        className={cn(
          "group relative rounded-t-[4px] bg-surface-container-highest border-b-2 transition-colors duration-[var(--md-sys-motion-duration-short-3)]",
          error
            ? "border-error"
            : "border-on-surface-variant focus-within:border-primary"
        )}
      >
        {multiline ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={fieldId}
            rows={rows}
            placeholder=" "
            className={fieldClass}
            {...field}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            id={fieldId}
            placeholder=" "
            className={fieldClass}
            {...field}
          />
        )}
        <label
          htmlFor={fieldId}
          className={cn(
            "pointer-events-none absolute left-4 top-2 md-body-small origin-left transition-all duration-[var(--md-sys-motion-duration-short-3)] ease-[var(--md-sys-motion-easing-standard)]",
            "peer-placeholder-shown:top-4 peer-placeholder-shown:md-body-large peer-focus:top-2 peer-focus:md-body-small",
            error ? "text-error" : "text-on-surface-variant peer-focus:text-primary"
          )}
        >
          {label}
        </label>
      </div>
      {supportingText && (
        <p
          className={cn(
            "px-4 md-body-small",
            error ? "text-error" : "text-on-surface-variant"
          )}
        >
          {supportingText}
        </p>
      )}
    </div>
  );
});
