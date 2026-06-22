import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const { data: challengeMemberships } = await supabase
    .from("challenge_members")
    .select("challenge_id, joined_at, challenges(name, weekly_goal, penalty_amount, penalty_currency)")
    .eq("user_id", user.id);

  const membershipCount = (challengeMemberships ?? []).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Profile
        </h1>
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-[8px]"
            style={{ color: "var(--text-muted)", backgroundColor: "var(--bg-subtle)" }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </form>
      </div>

      <div
        className="flex items-center gap-4 p-5 rounded-[16px]"
        style={{
          backgroundColor: "var(--bg-card)",
          boxShadow: "var(--shadow-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.display_name} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold"
            style={{ backgroundColor: "var(--app-accent-light)", color: "var(--app-accent)" }}
          >
            {profile?.display_name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div>
          <p className="font-serif text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {profile?.display_name}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {membershipCount} challenge{membershipCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          My challenges
        </p>
        <div className="flex flex-col gap-2">
          {(challengeMemberships ?? []).map((m) => {
            const c = m.challenges as Record<string, unknown>;
            return (
              <Link
                key={m.challenge_id}
                href={`/challenges/${m.challenge_id}`}
                className="flex items-center justify-between p-4 rounded-[12px]"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {c?.name as string}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {c?.weekly_goal as number} pages/week · {c?.penalty_currency as string}{c?.penalty_amount as number}/page
                  </p>
                </div>
                <span style={{ color: "var(--text-muted)" }}>›</span>
              </Link>
            );
          })}

          <Link
            href="/challenges/new"
            className="flex items-center justify-center p-4 rounded-[12px] text-sm font-medium"
            style={{
              border: `1px dashed var(--border-strong)`,
              color: "var(--text-muted)",
            }}
          >
            + Create a challenge
          </Link>
        </div>
      </div>
    </div>
  );
}
