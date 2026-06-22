"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createChallenge } from "@/lib/actions/challenges";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function NewChallengePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dailyGoal, setDailyGoal] = useState(5);
  const [penaltyAmount, setPenaltyAmount] = useState(10);
  const [penaltyCurrency, setPenaltyCurrency] = useState("₹");
  const [carryOver, setCarryOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const { id } = await createChallenge({
        name: name.trim(),
        description: description.trim(),
        dailyGoal,
        penaltyAmount,
        penaltyCurrency,
        carryOver,
      });
      router.push(`/challenges/${id}`);
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/">
          <ChevronLeft size={20} style={{ color: "var(--text-secondary)" }} />
        </Link>
        <h1 className="font-serif text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          New challenge
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Challenge name">
          <input
            required
            className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
            placeholder="e.g. Book Club — 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label="Description (optional)">
          <textarea
            className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none resize-none"
            style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
            rows={3}
            placeholder="Any notes about this challenge…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <Field label={`Daily page goal — ${dailyGoal} pages (${dailyGoal * 7}/week)`}>
          <input
            type="range" min={1} max={50} value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            className="w-full accent-[#7B3B52]"
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            <span>1/day</span><span>50/day</span>
          </div>
        </Field>

        <div className="flex gap-3">
          <Field label="Currency" className="w-24 shrink-0">
            <input
              className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none text-center"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
              value={penaltyCurrency} onChange={(e) => setPenaltyCurrency(e.target.value)} maxLength={3}
            />
          </Field>
          <Field label="Penalty per missed page" className="flex-1">
            <input
              type="number" min={0}
              className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "var(--bg-subtle)", color: "var(--text-primary)", border: "1px solid var(--border-default)" }}
              value={penaltyAmount} onChange={(e) => setPenaltyAmount(Number(e.target.value))}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between py-3 px-4 rounded-[12px]"
          style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Surplus carry-over</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Extra pages roll to next week</p>
          </div>
          <button type="button" onClick={() => setCarryOver((v) => !v)}
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{ backgroundColor: carryOver ? "var(--app-accent)" : "var(--bg-subtle)", border: "1px solid var(--border-default)" }}>
            <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
              style={{ transform: carryOver ? "translateX(20px)" : "translateX(0)" }} />
          </button>
        </div>

        {error && <p className="text-sm text-center" style={{ color: "var(--penalty)" }}>{error}</p>}

        <button type="submit" disabled={saving || !name.trim()}
          className="w-full py-3.5 rounded-[10px] font-serif text-base font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: "var(--app-accent)" }}>
          {saving ? "Creating…" : "Create challenge"}
        </button>
      </form>
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
