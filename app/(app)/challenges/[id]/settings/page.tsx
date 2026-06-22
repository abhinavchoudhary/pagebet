"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  updateChallenge,
  regenerateInviteToken,
  removeMember,
  archiveChallenge,
} from "@/lib/actions/challenges";

interface Member {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

interface ChallengeData {
  name: string;
  description: string;
  dailyGoal: number;
  penaltyAmount: number;
  penaltyCurrency: string;
  carryOver: boolean;
  inviteActive: boolean;
  isCreator: boolean;
  members: Member[];
  currentUserId: string;
}

export default function ChallengeSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ChallengeData | null>(null);
  const [saving, startSaving] = useTransition();

  useEffect(() => {
    fetch(`/api/challenges/${id}/settings-data`)
      .then((r) => r.json())
      .then(setData);
  }, [id]);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  if (!data.isCreator) {
    router.push(`/challenges/${id}`);
    return null;
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data) return;
    startSaving(async () => {
      await updateChallenge(id, {
        name: data.name,
        description: data.description,
        dailyGoal: data.dailyGoal,
        penaltyAmount: data.penaltyAmount,
        penaltyCurrency: data.penaltyCurrency,
        carryOver: data.carryOver,
        inviteActive: data.inviteActive,
      });
      router.push(`/challenges/${id}`);
    });
  }

  function update(patch: Partial<ChallengeData>) {
    setData((d) => d ? { ...d, ...patch } : d);
  }

  return (
    <div className="flex flex-col gap-6 px-5 pb-10" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)" }}>
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
          <input required
            className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
            value={data.name} onChange={(e) => update({ name: e.target.value })}
          />
        </Field>

        <Field label="Description">
          <textarea rows={3}
            className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none resize-none"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
            value={data.description} onChange={(e) => update({ description: e.target.value })}
          />
        </Field>

        <Field label={`Daily goal — ${data.dailyGoal} pages (${data.dailyGoal * 7}/week)`}>
          <input type="range" min={1} max={50} value={data.dailyGoal}
            onChange={(e) => update({ dailyGoal: Number(e.target.value) })}
            className="w-full accent-[#7B3B52]"
          />
        </Field>

        <div className="flex gap-3">
          <Field label="Currency" className="w-24 shrink-0">
            <input className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none text-center"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
              value={data.penaltyCurrency} onChange={(e) => update({ penaltyCurrency: e.target.value })} maxLength={3}
            />
          </Field>
          <Field label="Penalty / page" className="flex-1">
            <input type="number" min={0}
              className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
              value={data.penaltyAmount} onChange={(e) => update({ penaltyAmount: Number(e.target.value) })}
            />
          </Field>
        </div>

        <Toggle label="Surplus carry-over" description="Extra pages roll to next week" value={data.carryOver} onChange={(v) => update({ carryOver: v })} />
        <Toggle label="Invite link active" description="Allow new members to join" value={data.inviteActive} onChange={(v) => update({ inviteActive: v })} />

        <button type="submit" disabled={saving}
          className="w-full py-3.5 rounded-[10px] font-serif text-base font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: "var(--app-accent)" }}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Members</p>
        <div className="flex flex-col gap-2">
          {data.members.map((m) => (
            <div key={m.userId} className="flex items-center gap-3 p-3 rounded-[10px]"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
              {m.avatarUrl ? (
                <img src={m.avatarUrl} alt={m.displayName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
                  {m.displayName[0]?.toUpperCase()}
                </div>
              )}
              <p className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>
                {m.displayName}{m.userId === data.currentUserId ? " (you)" : ""}
              </p>
              {m.userId !== data.currentUserId && (
                <button onClick={async () => {
                  await removeMember(id, m.userId);
                  update({ members: data.members.filter((x) => x.userId !== m.userId) });
                }}>
                  <Trash2 size={16} style={{ color: "var(--text-muted)" }} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button onClick={() => regenerateInviteToken(id)}
          className="flex items-center gap-2 text-sm py-2.5 px-4 rounded-[10px]"
          style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-secondary)" }}>
          <RefreshCw size={16} /> Regenerate invite link
        </button>
        <button onClick={() => archiveChallenge(id)}
          className="flex items-center gap-2 text-sm py-2.5 px-4 rounded-[10px]"
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
