"use client";

import { UserPlus } from "lucide-react";

import { toast } from "@/lib/toast";

export function InviteHeaderButton({ url }: { url: string }) {
  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy invite link"
      className="md-state-layer flex size-10 items-center justify-center rounded-corner-full text-on-surface-variant"
    >
      <UserPlus className="z-[1] size-5" />
    </button>
  );
}
