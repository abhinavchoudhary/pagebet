"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

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
      <div
        className="pointer-events-none fixed inset-x-0 z-30 mx-auto flex max-w-lg justify-end px-5"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)" }}
      >
        <button
          onClick={() => setOpen(true)}
          aria-label="Log a reading session"
          className="md-state-layer pointer-events-auto flex h-14 items-center gap-2 rounded-corner-lg bg-primary-container px-5 text-on-primary-container md-elevation-3 transition-[box-shadow] hover:md-elevation-4"
        >
          <Plus className="z-[1] size-6" strokeWidth={2.25} />
          <span className="z-[1] md-label-large">Log session</span>
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
