"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createChallenge } from "@/lib/actions/challenges";

import { TopAppBar } from "@/components/ui/top-app-bar";
import { TextField } from "@/components/ui/text-field";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

export default function NewChallengePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dailyGoal, setDailyGoal] = useState(5);
  const [penaltyAmount, setPenaltyAmount] = useState(10);
  const [penaltyCurrency, setPenaltyCurrency] = useState("₹");
  const [carryOver, setCarryOver] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
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
      toast.error((err as Error)?.message ?? "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col">
      <TopAppBar backHref="/" title="New challenge" />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-4 py-4">
        <TextField
          label="Challenge name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Book Club — 2026"
        />
        <TextField
          label="Description (optional)"
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <label className="md-label-medium text-on-surface-variant">
            Daily page goal — {dailyGoal} pages ({dailyGoal * 7}/week)
          </label>
          <input
            type="range"
            min={1}
            max={50}
            value={dailyGoal}
            onChange={(e) => setDailyGoal(Number(e.target.value))}
            className="w-full accent-[var(--md-sys-color-primary)]"
          />
          <div className="flex justify-between md-body-small text-on-surface-variant">
            <span>1/day</span>
            <span>50/day</span>
          </div>
        </div>

        <div className="flex gap-3">
          <TextField
            label="Currency"
            value={penaltyCurrency}
            maxLength={3}
            onChange={(e) => setPenaltyCurrency(e.target.value)}
            containerClassName="w-24 shrink-0"
          />
          <TextField
            label="Penalty per missed page"
            type="number"
            inputMode="numeric"
            min={0}
            value={penaltyAmount}
            onChange={(e) => setPenaltyAmount(Number(e.target.value))}
            containerClassName="flex-1"
          />
        </div>

        <div className="flex items-center justify-between rounded-corner-md bg-surface-container-low px-4 py-3">
          <div>
            <p className="md-body-large text-on-surface">Surplus carry-over</p>
            <p className="md-body-small text-on-surface-variant">
              Extra pages roll to next week
            </p>
          </div>
          <Switch
            checked={carryOver}
            onCheckedChange={setCarryOver}
            aria-label="Surplus carry-over"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={saving || !name.trim()}
          className="w-full"
        >
          {saving ? "Creating…" : "Create challenge"}
        </Button>
      </form>
    </div>
  );
}
