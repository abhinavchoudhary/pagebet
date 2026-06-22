"use client";

import { useState } from "react";
import { LogSessionDrawer } from "@/components/log-session-drawer";
import type { Database } from "@/lib/supabase/types";

type Book = Database["public"]["Tables"]["books"]["Row"];

interface HomeLogButtonProps {
  books: Book[];
  challenges: Array<{ id: string; name: string; joined_at: string }>;
  userId: string;
}

export function HomeLogButton({ books, challenges, userId }: HomeLogButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-[64px] left-0 right-0 flex justify-center pointer-events-none z-30">
        <button
          onClick={() => setOpen(true)}
          className="pointer-events-auto px-6 py-3 rounded-full font-serif font-semibold text-sm text-white shadow-lg transition-transform active:scale-95"
          style={{
            backgroundColor: "var(--app-accent)",
            width: "160px",
            boxShadow: "0 4px 20px rgba(123, 59, 82, 0.35)",
          }}
        >
          + Log session
        </button>
      </div>

      <LogSessionDrawer
        open={open}
        onClose={() => setOpen(false)}
        books={books}
        challenges={challenges}
        userId={userId}
        onSuccess={() => {
          setTimeout(() => window.location.reload(), 500);
        }}
      />
    </>
  );
}
