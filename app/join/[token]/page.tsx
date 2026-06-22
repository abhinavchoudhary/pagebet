import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { JoinButton } from "@/components/join-button";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: challenge } = await supabase
    .from("challenges")
    .select("*, profiles!challenges_creator_id_fkey(display_name, avatar_url)")
    .eq("invite_token", token)
    .eq("invite_active", true)
    .single();

  if (!challenge) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6" style={{ backgroundColor: "var(--bg-base)" }}>
        <div className="text-center">
          <p className="text-4xl mb-4">🔒</p>
          <h1 className="font-serif text-2xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            Link not found
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            This invite link may have expired or been disabled.
          </p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();

  const creator = challenge.profiles as Record<string, unknown>;

  if (user) {
    const { data: existing } = await supabase
      .from("challenge_members")
      .select("challenge_id")
      .eq("challenge_id", challenge.id)
      .eq("user_id", user.id)
      .single();

    if (existing) redirect(`/challenges/${challenge.id}`);
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 py-10"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <span className="text-5xl">📖</span>
          <h1 className="font-serif text-3xl font-semibold mt-4 leading-tight" style={{ color: "var(--text-primary)" }}>
            {challenge.name}
          </h1>
          {challenge.description && (
            <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {challenge.description}
            </p>
          )}
        </div>

        <div
          className="rounded-[16px] p-5 flex flex-col gap-4"
          style={{
            backgroundColor: "var(--bg-card)",
            boxShadow: "var(--shadow-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="flex items-center gap-3">
            {creator?.avatar_url ? (
              <img src={creator.avatar_url as string} alt={creator.display_name as string} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold"
                style={{ backgroundColor: "var(--app-accent-light)", color: "var(--app-accent)" }}>
                {(creator?.display_name as string)?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Created by</p>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {creator?.display_name as string}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t" style={{ borderColor: "var(--border-default)" }}>
            <StatBox label="Daily goal" value={`${challenge.daily_goal} pg`} />
            <StatBox label="Weekly goal" value={`${challenge.weekly_goal} pg`} />
            <StatBox
              label="Penalty"
              value={`${challenge.penalty_currency}${challenge.penalty_amount}/pg`}
            />
          </div>

          {challenge.carry_over && (
            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
              Surplus pages carry over to next week
            </p>
          )}
        </div>

        <JoinButton
          challengeId={challenge.id}
          token={token}
          isLoggedIn={!!user}
        />

        {!user && (
          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
            You'll be asked to sign in with Google first
          </p>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}
