export default function ProfileLoading() {
  return (
    <div
      className="flex animate-pulse flex-col gap-6 px-4"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)" }}
    >
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 rounded-corner-xs bg-surface-container-highest" />
        <div className="size-9 rounded-corner-full bg-surface-container-highest" />
      </div>
      <div className="flex flex-col items-center gap-3 border-b border-outline-variant pb-5">
        <div className="size-[72px] rounded-corner-full bg-surface-container-highest" />
        <div className="h-6 w-32 rounded-corner-xs bg-surface-container-highest" />
        <div className="h-3 w-24 rounded-corner-xs bg-surface-container-highest" />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-corner-lg bg-surface-container-low md-elevation-1"
          />
        ))}
      </div>
    </div>
  );
}
