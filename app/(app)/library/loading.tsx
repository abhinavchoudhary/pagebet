export default function LibraryLoading() {
  return (
    <div
      className="flex animate-pulse flex-col gap-6 px-4"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)" }}
    >
      <div className="flex items-center justify-between">
        <div className="h-8 w-28 rounded-corner-xs bg-surface-container-highest" />
        <div className="h-9 w-24 rounded-corner-full bg-surface-container-highest" />
      </div>
      <div>
        <div className="mb-3 h-3 w-24 rounded-corner-xs bg-surface-container-highest" />
        <div className="grid grid-cols-3 gap-x-3 gap-y-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div
                className="w-full rounded-corner-sm bg-surface-container-highest"
                style={{ aspectRatio: "2 / 3" }}
              />
              <div className="h-2.5 w-3/4 rounded-corner-xs bg-surface-container-highest" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
