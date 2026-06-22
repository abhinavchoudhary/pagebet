import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Settings } from "lucide-react";
import { Leaderboard } from "@/components/leaderboard";
import { InviteLinkCopy } from "@/components/invite-link-copy";

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: challenge } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .single();

  if (!challenge) notFound();

  const { data: membership } = await supabase
    .from("challenge_members")
    .select("joined_at")
    .eq("challenge_id", id)
    .eq("user_id", user.id)
    .single();

  if (!membership) redirect("/");

  const { data: leaderboard } = await supabase.rpc("get_leaderboard", {
    p_challenge_id: id,
  });

  const isCreator = challenge.creator_id === user.id;
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/join/${challenge.invite_token}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/">
            <ChevronLeft size={20} style={{ color: "var(--text-secondary)" }} />
          </Link>
          <h1 className="font-serif text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {challenge.name}
          </h1>
        </div>
        {isCreator && (
          <Link href={`/challenges/${id}/settings`}>
            <Settings size={20} style={{ color: "var(--text-muted)" }} />
          </Link>
        )}
      </div>

      {challenge.description && (
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {challenge.description}
        </p>
      )}

      <div
        className="grid grid-cols-3 gap-3 p-4 rounded-[12px]"
        style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}
      >
        <Stat label="Daily goal" value={`${challenge.daily_goal} pg`} />
        <Stat label="Weekly goal" value={`${challenge.weekly_goal} pg`} />
        <Stat
          label="Penalty"
          value={`${challenge.penalty_currency}${challenge.penalty_amount}/pg`}
        />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          This week
        </p>
        <Leaderboard
          entries={(leaderboard ?? []).map((e) => ({
            user_id: e.user_id,
            display_name: e.display_name,
            avatar_url: e.avatar_url,
            pages_this_week: Number(e.pages_this_week),
            weekly_goal: e.weekly_goal,
            penalty_exposure: Number(e.penalty_exposure),
          }))}
          penaltyCurrency={challenge.penalty_currency}
          currentUserId={user.id}
        />
      </div>

      {challenge.invite_active && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Invite link
          </p>
          <InviteLinkCopy url={inviteUrl} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}
