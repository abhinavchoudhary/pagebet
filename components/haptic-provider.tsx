"use client";

import { useEffect } from "react";
import { triggerHaptic } from "@/lib/haptic";

export function HapticProvider() {
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (e.pointerType !== "touch") return;
      const target = e.target as Element;
      if (target.closest("button:not(:disabled), a[href], [role='button']")) {
        triggerHaptic();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return null;
}
