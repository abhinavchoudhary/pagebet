"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function InviteLinkCopy({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="flex items-center gap-2 p-3 rounded-[10px]"
      style={{ backgroundColor: "var(--bg-subtle)", border: "1px solid var(--border-default)" }}
    >
      <p className="text-xs flex-1 truncate font-mono" style={{ color: "var(--text-secondary)" }}>
        {url}
      </p>
      <button
        onClick={handleCopy}
        className="shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-[6px] transition-colors"
        style={{
          backgroundColor: copied ? "#4A7C59" : "var(--app-accent)",
          color: "#fff",
        }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
