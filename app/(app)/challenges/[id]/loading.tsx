export default function ChallengeLoading() {
  return (
    <div className="flex animate-pulse flex-col">
      <div
        className="bg-surface-container-highest px-5 pb-10"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)" }}
      >
        <div className="mb-5 h-4 w-12 rounded-corner-xs bg-surface-container-lowest/40" />
        <div className="mb-2 h-8 w-48 rounded-corner-xs bg-surface-container-lowest/40" />
        <div className="h-3 w-36 rounded-corner-xs bg-surface-container-lowest/30" />
      </div>
      <div className="flex flex-col gap-5 px-5 pt-6">
        <div className="h-32 rounded-corner-lg bg-surface-container-low md-elevation-1" />
        <div className="h-4 w-32 rounded-corner-xs bg-surface-container-highest" />
        <div className="h-24 rounded-corner-lg bg-surface-container-low" />
        <div className="h-4 w-24 rounded-corner-xs bg-surface-container-highest" />
        <div className="h-24 rounded-corner-lg bg-surface-container-low" />
      </div>
    </div>
  );
}
