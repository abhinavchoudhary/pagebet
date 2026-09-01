import { BottomNav } from "@/components/bottom-nav";
import { HapticProvider } from "@/components/haptic-provider";
import { Toaster } from "@/components/ui/toaster";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <main
        className="mx-auto w-full max-w-lg flex-1"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 104px)" }}
      >
        {children}
      </main>
      <BottomNav />
      <HapticProvider />
      <Toaster />
    </div>
  );
}
