import { BottomNav } from "@/components/bottom-nav";
import { HapticProvider } from "@/components/haptic-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
      <main
        className="flex-1 max-w-lg mx-auto w-full"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)" }}
      >
        {children}
      </main>
      <BottomNav />
      <HapticProvider />
    </div>
  );
}
