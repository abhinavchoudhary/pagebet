"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { RefreshCw, Trash2 } from "lucide-react";
import {
  updateChallenge,
  regenerateInviteToken,
  removeMember,
  archiveChallenge,
} from "@/lib/actions/challenges";

import { TopAppBar } from "@/components/ui/top-app-bar";
import { TextField } from "@/components/ui/text-field";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";

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
        <p className="md-body-medium text-on-surface-variant">Loading…</p>
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
      toast.success("Challenge updated");
      router.push(`/challenges/${id}`);
    });
  }

  function update(patch: Partial<ChallengeData>) {
    setData((d) => (d ? { ...d, ...patch } : d));
  }

  return (
    <div className="flex flex-col">
      <TopAppBar backHref={`/challenges/${id}`} title="Settings" />

      <form onSubmit={handleSave} className="flex flex-col gap-5 px-4 py-4">
        <TextField
          label="Challenge name"
          required
          value={data.name}
          onChange={(e) => update({ name: e.target.value })}
        />
        <TextField
          label="Description"
          multiline
          rows={3}
          value={data.description}
          onChange={(e) => update({ description: e.target.value })}
        />

        <div className="flex flex-col gap-2">
          <label className="md-label-medium text-on-surface-variant">
            Daily goal — {data.dailyGoal} pages ({data.dailyGoal * 7}/week)
          </label>
          <input
            type="range"
            min={1}
            max={50}
            value={data.dailyGoal}
            onChange={(e) => update({ dailyGoal: Number(e.target.value) })}
            className="w-full accent-[var(--md-sys-color-primary)]"
          />
        </div>

        <div className="flex gap-3">
          <TextField
            label="Currency"
            value={data.penaltyCurrency}
            maxLength={3}
            onChange={(e) => update({ penaltyCurrency: e.target.value })}
            containerClassName="w-24 shrink-0"
          />
          <TextField
            label="Penalty / page"
            type="number"
            inputMode="numeric"
            min={0}
            value={data.penaltyAmount}
            onChange={(e) => update({ penaltyAmount: Number(e.target.value) })}
            containerClassName="flex-1"
          />
        </div>

        <SettingToggle
          label="Surplus carry-over"
          description="Extra pages roll to next week"
          value={data.carryOver}
          onChange={(v) => update({ carryOver: v })}
        />
        <SettingToggle
          label="Invite link active"
          description="Allow new members to join"
          value={data.inviteActive}
          onChange={(v) => update({ inviteActive: v })}
        />

        <Button type="submit" size="lg" disabled={saving} className="w-full">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>

      <div className="px-4 pb-4">
        <p className="mb-3 md-label-medium text-on-surface-variant">Members</p>
        <div className="flex flex-col gap-2">
          {data.members.map((m) => (
            <div
              key={m.userId}
              className="flex items-center gap-3 rounded-corner-md bg-surface-container-low p-3"
            >
              {m.avatarUrl ? (
                <img
                  src={m.avatarUrl}
                  alt={m.displayName}
                  className="size-8 rounded-corner-full object-cover"
                />
              ) : (
                <div className="flex size-8 items-center justify-center rounded-corner-full bg-primary-container md-label-medium text-on-primary-container">
                  {m.displayName[0]?.toUpperCase()}
                </div>
              )}
              <p className="flex-1 md-body-medium text-on-surface">
                {m.displayName}
                {m.userId === data.currentUserId ? " (you)" : ""}
              </p>
              {m.userId !== data.currentUserId && (
                <button
                  aria-label={`Remove ${m.displayName}`}
                  onClick={async () => {
                    await removeMember(id, m.userId);
                    update({
                      members: data.members.filter(
                        (x) => x.userId !== m.userId
                      ),
                    });
                    toast.success(`Removed ${m.displayName}`);
                  }}
                  className="md-state-layer flex size-9 items-center justify-center rounded-corner-full text-on-surface-variant"
                >
                  <Trash2 className="z-[1] size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 px-4 pb-10">
        <Button
          variant="tonal"
          onClick={() => {
            regenerateInviteToken(id);
            toast.success("Invite link regenerated");
          }}
        >
          <RefreshCw className="size-4" /> Regenerate invite link
        </Button>
        <Button variant="danger" onClick={() => archiveChallenge(id)}>
          Archive challenge
        </Button>
      </div>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-corner-md bg-surface-container-low px-4 py-3">
      <div>
        <p className="md-body-large text-on-surface">{label}</p>
        <p className="md-body-small text-on-surface-variant">{description}</p>
      </div>
      <Switch checked={value} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
