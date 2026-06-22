"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogSessionDrawer } from "@/components/log-session-drawer";
import { Plus } from "lucide-react";

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
      <div
        className="fixed pointer-events-none z-30"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)", right: 20 }}
      >
        <button
          onClick={() => setOpen(true)}
          className="pointer-events-auto flex items-center justify-center rounded-full text-white transition-transform active:scale-95"
          style={{
            width: 52,
            height: 52,
            backgroundColor: "var(--sienna)",
            boxShadow: "var(--shadow-fab)",
          }}
          aria-label="Log reading session"
        >
          <Plus size={22} strokeWidth={2.5} />
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
