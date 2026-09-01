"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { SegmentedButton } from "@/components/ui/segmented-button";
import type { ThemePref } from "@/lib/theme";

export function ThemeToggle() {
  const { pref, setPref } = useTheme();
  return (
    <div className="flex flex-col gap-2">
      <p className="md-label-medium text-on-surface-variant">Appearance</p>
      <SegmentedButton<ThemePref>
        value={pref}
        onChange={setPref}
        options={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "system", label: "System" },
        ]}
      />
      <p className="flex items-center gap-1.5 md-body-small text-on-surface-variant">
        {pref === "light" && <Sun className="size-3.5" />}
        {pref === "dark" && <Moon className="size-3.5" />}
        {pref === "system" && <Monitor className="size-3.5" />}
        {pref === "system"
          ? "Following your device setting"
          : `Always ${pref}`}
      </p>
    </div>
  );
}
