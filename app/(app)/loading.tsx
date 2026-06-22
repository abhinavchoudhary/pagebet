export default function AppLoading() {
  return (
    <div className="flex flex-col min-h-full animate-pulse">
      <div style={{ backgroundColor: "#3b2412", paddingBottom: "60px" }} className="px-5 pt-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="h-3 w-20 rounded mb-2" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
            <div className="h-8 w-32 rounded" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
          </div>
          <div className="w-11 h-11 rounded-full" style={{ backgroundColor: "rgba(200,145,58,0.2)" }} />
        </div>
        <div className="h-3 w-36 rounded mb-2" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
        <div className="h-16 w-24 rounded" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />
        <div className="h-1 w-12 rounded-full mt-3 mb-4" style={{ backgroundColor: "#c8913a" }} />
        <div className="h-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.12)" }} />
      </div>
      <div style={{ backgroundColor: "#fdf5e6", borderRadius: "28px 28px 0 0", marginTop: -28 }} className="flex flex-col gap-5 px-5 pt-6 flex-1">
        <div className="h-4 w-32 rounded" style={{ backgroundColor: "#dfd0b8" }} />
        <div className="h-36 rounded-[4px]" style={{ backgroundColor: "#fefaf2", boxShadow: "0 2px 12px rgba(59,36,18,0.07)" }} />
      </div>
    </div>
  );
}
