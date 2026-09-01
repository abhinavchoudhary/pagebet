"use client";

import { Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

export function InviteLinkCopy({ url }: { url: string }) {
  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  }

  return (
    <div className="flex items-center gap-2 rounded-corner-md bg-surface-container-high p-2 pl-3">
      <p className="min-w-0 flex-1 truncate md-body-small text-on-surface-variant">
        {url}
      </p>
      <Button variant="tonal" size="sm" onClick={handleCopy}>
        <Copy className="size-4" /> Copy
      </Button>
    </div>
  );
}
