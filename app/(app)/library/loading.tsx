export default function LibraryLoading() {
  return (
    <div
      className="flex flex-col gap-6 px-4 animate-pulse"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)" }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-28 rounded" style={{ backgroundColor: "#dfd0b8" }} />
        <div className="h-8 w-8 rounded-full" style={{ backgroundColor: "#dfd0b8" }} />
      </div>

      {/* Section label */}
      <div>
        <div className="h-2.5 w-24 rounded mb-3" style={{ backgroundColor: "#dfd0b8" }} />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div
                className="w-full rounded-[4px]"
                style={{ aspectRatio: "2/3", backgroundColor: "#dfd0b8" }}
              />
              <div className="h-2.5 w-3/4 rounded" style={{ backgroundColor: "#dfd0b8" }} />
              <div className="h-2.5 w-1/2 rounded" style={{ backgroundColor: "#dfd0b8" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
