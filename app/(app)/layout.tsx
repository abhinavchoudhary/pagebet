import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-dvh flex flex-col" style={{ backgroundColor: "var(--bg-base)" }}>
      <main className="flex-1 pb-32 px-4 pt-6 max-w-lg mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
