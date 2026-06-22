export default function FeedLoading() {
  return (
    <div
      className="flex flex-col gap-5 px-4 animate-pulse"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)" }}
    >
      {/* Header */}
      <div className="h-7 w-16 rounded" style={{ backgroundColor: "#dfd0b8" }} />

      {/* Feed item skeletons */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="rounded-[4px] p-4 flex gap-3"
          style={{ backgroundColor: "var(--cream)", border: "1px solid var(--border-default)" }}
        >
          {/* Book cover */}
          <div
            className="shrink-0 w-10 rounded-[4px]"
            style={{ aspectRatio: "2/3", backgroundColor: "#dfd0b8" }}
          />
          {/* Text */}
          <div className="flex flex-col gap-2 flex-1 justify-center">
            <div className="h-3 w-3/4 rounded" style={{ backgroundColor: "#dfd0b8" }} />
            <div className="h-2.5 w-1/2 rounded" style={{ backgroundColor: "#dfd0b8" }} />
            <div className="h-2.5 w-2/3 rounded" style={{ backgroundColor: "#dfd0b8" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
