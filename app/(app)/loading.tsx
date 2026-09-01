export default function AppLoading() {
  return (
    <div className="flex animate-pulse flex-col">
      <div
        className="rounded-b-[28px] bg-surface-container-highest px-5 pb-7"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)" }}
      >
        <div className="mb-5 flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="h-3 w-20 rounded-corner-xs bg-surface-container-lowest/50" />
            <div className="h-7 w-28 rounded-corner-xs bg-surface-container-lowest/50" />
          </div>
          <div className="size-11 rounded-corner-full bg-surface-container-lowest/50" />
        </div>
        <div className="h-3 w-40 rounded-corner-xs bg-surface-container-lowest/50" />
        <div className="mt-2 h-14 w-24 rounded-corner-xs bg-surface-container-lowest/50" />
        <div className="mt-4 h-2 rounded-corner-full bg-surface-container-lowest/50" />
      </div>
      <div className="flex flex-col gap-6 px-5 py-6">
        <div className="h-4 w-28 rounded-corner-xs bg-surface-container-highest" />
        <div className="h-40 rounded-corner-lg bg-surface-container-low md-elevation-1" />
      </div>
    </div>
  );
}
