"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogSessionDrawer } from "@/components/log-session-drawer";

interface Book {
  id: string;
  title: string;
  authors: string[] | null;
  coverUrl: string | null;
}

interface HomeLogButtonProps {
  books: Book[];
  userId: string;
}

export function HomeLogButton({ books }: HomeLogButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <div className="fixed left-0 right-0 flex justify-center pointer-events-none z-30" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 88px)" }}>
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
        onSuccess={() => {
          setOpen(false);
          setTimeout(() => router.refresh(), 300);
        }}
      />
    </>
  );
}
