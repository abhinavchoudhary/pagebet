"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowRight } from "lucide-react";

import { joinChallenge } from "@/lib/actions/challenges";
import { Button } from "@/components/ui/button";

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
    <Button
      onClick={handleJoin}
      disabled={pending}
      size="lg"
      className="w-full"
    >
      {pending ? "Joining…" : "Join this challenge"}
      {!pending && <ArrowRight className="size-5" />}
    </Button>
  );
}
