"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function ChallengeSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dailyGoal, setDailyGoal] = useState(5);
  const [penaltyAmount, setPenaltyAmount] = useState(10);
  const [penaltyCurrency, setPenaltyCurrency] = useState("₹");
  const [carryOver, setCarryOver] = useState(false);
  const [inviteActive, setInviteActive] = useState(true);
  const [members, setMembers] = useState<Array<{ user_id: string; display_name: string; avatar_url: string | null }>>([]);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: c } = await supabase.from("challenges").select("*").eq("id", id).single();
      if (!c || c.creator_id !== user.id) {
        router.push(`/challenges/${id}`);
        return;
      }

      setName(c.name);
      setDescription(c.description ?? "");
      setDailyGoal(c.daily_goal);
      setPenaltyAmount(Number(c.penalty_amount));
      setPenaltyCurrency(c.penalty_currency);
      setCarryOver(c.carry_over);
      setInviteActive(c.invite_active);

      const { data: memberships } = await supabase
        .from("challenge_members")
        .select("user_id, profiles(display_name, avatar_url)")
        .eq("challenge_id", id);

      setMembers(
        (memberships ?? []).map((m) => ({
          user_id: m.user_id,
          display_name: (m.profiles as Record<string, unknown>)?.display_name as string ?? "Unknown",
          avatar_url: (m.profiles as Record<string, unknown>)?.avatar_url as string ?? null,
        }))
      );
    }
    load();
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("challenges").update({
      name,
      description: description || null,
      daily_goal: dailyGoal,
      weekly_goal: dailyGoal * 7,
      penalty_amount: penaltyAmount,
      penalty_currency: penaltyCurrency,
      carry_over: carryOver,
      invite_active: inviteActive,
    }).eq("id", id);
    setSaving(false);
    router.push(`/challenges/${id}`);
  }

  async function regenerateToken() {
    const token = generateToken();
    await supabase.from("challenges").update({ invite_token: token }).eq("id", id);
    router.refresh();
  }

  async function removeMember(memberId: string) {
    if (memberId === userId) return;
    await supabase
      .from("challenge_members")
      .delete()
      .eq("challenge_id", id)
      .eq("user_id", memberId);
    setMembers((m) => m.filter((x) => x.user_id !== memberId));
  }

  async function archiveChallenge() {
    await supabase.from("challenges").update({ archived: true }).eq("id", id);
    router.push("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href={`/challenges/${id}`}>
          <ChevronLeft size={20} style={{ color: "var(--text-secondary)" }} />
        </Link>
        <h1 className="font-serif text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Settings
        </h1>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <Field label="Challenge name">
          <input
            required
            className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label="Description">
          <textarea
            className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none resize-none"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <Field label={`Daily goal — ${dailyGoal} pages (${dailyGoal * 7}/week)`}>
          <input type="range" min={1} max={50} value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            className="w-full accent-[#7B3B52]"
          />
        </Field>

        <div className="flex gap-3">
          <Field label="Currency" className="w-24 shrink-0">
            <input className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none text-center"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
              value={penaltyCurrency} onChange={(e) => setPenaltyCurrency(e.target.value)} maxLength={3}
            />
          </Field>
          <Field label="Penalty / page" className="flex-1">
            <input type="number" min={0}
              className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
              value={penaltyAmount} onChange={(e) => setPenaltyAmount(Number(e.target.value))}
            />
          </Field>
        </div>

        <Toggle label="Surplus carry-over" description="Extra pages roll to next week" value={carryOver} onChange={setCarryOver} />
        <Toggle label="Invite link active" description="Allow new members to join" value={inviteActive} onChange={setInviteActive} />

        <button type="submit" disabled={saving} className="w-full py-3.5 rounded-[10px] font-serif text-base font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: "var(--app-accent)" }}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          Members
        </p>
        <div className="flex flex-col gap-2">
          {members.map((m) => (
            <div key={m.user_id} className="flex items-center gap-3 p-3 rounded-[10px]"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
              {m.avatar_url ? (
                <img src={m.avatar_url} alt={m.display_name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                  {m.display_name[0]?.toUpperCase()}
                </div>
              )}
              <p className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>
                {m.display_name}{m.user_id === userId ? " (you)" : ""}
              </p>
              {m.user_id !== userId && (
                <button onClick={() => removeMember(m.user_id)}>
                  <Trash2 size={16} style={{ color: "var(--text-muted)" }} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button onClick={regenerateToken} className="flex items-center gap-2 text-sm py-2.5 px-4 rounded-[10px]"
          style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
          <RefreshCw size={16} />
          Regenerate invite link
        </button>
        <button onClick={archiveChallenge} className="flex items-center gap-2 text-sm py-2.5 px-4 rounded-[10px]"
          style={{ backgroundColor: "var(--penalty-bg)", color: "var(--penalty)" }}>
          Archive challenge
        </button>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-[12px]"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{description}</p>
      </div>
      <button type="button" onClick={() => onChange(!value)}
        className="relative w-11 h-6 rounded-full transition-colors"
        style={{ backgroundColor: value ? "var(--app-accent)" : "var(--bg-subtle)", border: "1px solid var(--border-default)" }}>
        <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
          style={{ transform: value ? "translateX(20px)" : "translateX(0)" }} />
      </button>
    </div>
  );
}
