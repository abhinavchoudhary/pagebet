export default function FeedLoading() {
  return (
    <div
      className="flex animate-pulse flex-col gap-4 px-4"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)" }}
    >
      <div className="h-8 w-20 rounded-corner-xs bg-surface-container-highest" />
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="rounded-corner-lg bg-surface-container-low p-4 md-elevation-1"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="size-9 rounded-corner-full bg-surface-container-highest" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-24 rounded-corner-xs bg-surface-container-highest" />
              <div className="h-2.5 w-16 rounded-corner-xs bg-surface-container-highest" />
            </div>
          </div>
          <div className="h-20 rounded-corner-md bg-surface-container-highest" />
        </div>
      ))}
    </div>
  );
}
