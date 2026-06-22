"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

interface JoinButtonProps {
  challengeId: string;
  token: string;
  isLoggedIn: boolean;
}

export function JoinButton({ challengeId, token, isLoggedIn }: JoinButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [joining, setJoining] = useState(false);

  async function handleJoin() {
    if (!isLoggedIn) {
      window.location.href = `/auth/google?redirect=/join/${token}`;
      return;
    }

    setJoining(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/auth/google?redirect=/join/${token}`;
      return;
    }

    await supabase.from("challenge_members").upsert({
      challenge_id: challengeId,
      user_id: user.id,
    }, { onConflict: "challenge_id,user_id" });

    router.push(`/challenges/${challengeId}`);
  }

  return (
    <button
      onClick={handleJoin}
      disabled={joining}
      className="w-full py-4 rounded-[12px] font-serif text-lg font-semibold text-white disabled:opacity-40 transition-transform active:scale-[0.98]"
      style={{ backgroundColor: "var(--app-accent)" }}
    >
      {joining ? "Joining…" : "Join this challenge →"}
    </button>
  );
}
