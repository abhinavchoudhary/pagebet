"use client";

import { useState } from "react";
import { UserPlus, Check } from "lucide-react";

export function InviteHeaderButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      aria-label="Copy invite link"
      style={{ color: copied ? "#4ade80" : "rgba(255,255,255,0.6)", lineHeight: 0 }}
    >
      {copied ? <Check size={20} /> : <UserPlus size={20} />}
    </button>
  );
}
