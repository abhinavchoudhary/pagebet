export default function ProfileLoading() {
  return (
    <div
      className="flex flex-col gap-6 px-4 animate-pulse"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)" }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 rounded" style={{ backgroundColor: "#dfd0b8" }} />
        <div className="h-8 w-8 rounded-full" style={{ backgroundColor: "#dfd0b8" }} />
      </div>

      {/* Avatar + name block */}
      <div
        className="flex flex-col items-center gap-3 pb-5"
        style={{ borderBottom: "1px solid var(--border-default)" }}
      >
        <div className="w-[72px] h-[72px] rounded-full" style={{ backgroundColor: "#dfd0b8" }} />
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-32 rounded" style={{ backgroundColor: "#dfd0b8" }} />
          <div className="h-3 w-24 rounded" style={{ backgroundColor: "#dfd0b8" }} />
        </div>
      </div>

      {/* Stats 2×2 grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-[4px]"
            style={{ backgroundColor: "var(--cream)", border: "1px solid var(--border-default)" }}
          >
            <div className="h-8 w-16 rounded mb-2" style={{ backgroundColor: "#dfd0b8" }} />
            <div className="h-2.5 w-20 rounded" style={{ backgroundColor: "#dfd0b8" }} />
          </div>
        ))}
      </div>

      {/* Book row */}
      <div>
        <div className="h-2.5 w-28 rounded mb-3" style={{ backgroundColor: "#dfd0b8" }} />
        <div className="flex gap-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="shrink-0 w-14">
              <div
                className="w-14 rounded-[4px]"
                style={{ aspectRatio: "2/3", backgroundColor: "#dfd0b8" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
