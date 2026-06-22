export default function ChallengeLoading() {
  return (
    <div className="flex flex-col animate-pulse">
      {/* Dark header skeleton */}
      <div style={{ backgroundColor: "#3b2412", paddingBottom: "52px" }} className="px-5 pt-5">
        <div className="flex items-center justify-between mb-5">
          <div className="h-4 w-12 rounded" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
        </div>
        <div className="h-7 w-48 rounded mb-2" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
        <div className="h-3 w-36 rounded" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
      </div>
      {/* Ivory panel skeleton */}
      <div
        className="flex flex-col gap-5 px-5 pt-6 flex-1"
        style={{ backgroundColor: "#fdf5e6", borderRadius: "28px 28px 0 0", marginTop: -28 }}
      >
        <div className="rounded-[4px] p-4" style={{ backgroundColor: "#fefaf2", boxShadow: "0 4px 20px rgba(59,36,18,0.09)" }}>
          <div className="h-10 w-24 rounded mb-3" style={{ backgroundColor: "#dfd0b8" }} />
          <div className="h-2 rounded-full" style={{ backgroundColor: "#dfd0b8" }} />
        </div>
        <div className="h-4 w-32 rounded" style={{ backgroundColor: "#dfd0b8" }} />
        <div className="h-20 rounded-[4px]" style={{ backgroundColor: "#fefaf2", boxShadow: "0 2px 8px rgba(59,36,18,0.06)" }} />
        <div className="h-4 w-24 rounded" style={{ backgroundColor: "#dfd0b8" }} />
        <div className="h-24 rounded-[4px]" style={{ backgroundColor: "#fefaf2" }} />
      </div>
    </div>
  );
}
