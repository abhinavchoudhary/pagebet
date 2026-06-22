"use client";

import { useRouter } from "next/navigation";
import { joinChallenge } from "@/lib/actions/challenges";
import { useTransition } from "react";

interface JoinButtonProps {
  challengeId: string;
  token: string;
  isLoggedIn: boolean;
}

export function JoinButton({ challengeId, token, isLoggedIn }: JoinButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleJoin() {
    if (!isLoggedIn) {
      window.location.href = `/api/auth/signin/google?callbackUrl=/join/${token}`;
      return;
    }

    startTransition(async () => {
      await joinChallenge(challengeId);
      router.push(`/challenges/${challengeId}`);
    });
  }

  return (
    <button
      onClick={handleJoin}
      disabled={pending}
      className="w-full py-4 rounded-[12px] font-serif text-lg font-semibold text-white disabled:opacity-40 transition-transform active:scale-[0.98]"
      style={{ backgroundColor: "var(--app-accent)" }}
    >
      {pending ? "Joining…" : "Join this challenge →"}
    </button>
  );
}
