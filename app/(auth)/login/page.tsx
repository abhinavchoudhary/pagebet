import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/");

  const { redirect: redirectTo } = await searchParams;

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <span className="text-5xl">📖</span>
          <h1 className="font-serif text-3xl font-semibold text-center" style={{ color: "var(--text-primary)" }}>
            Reading Challenge
          </h1>
          <p className="text-sm text-center leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            Track pages, share progress,<br />hold each other accountable.
          </p>
        </div>

        <GoogleSignInButton redirectTo={redirectTo} />

        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          Sign in with Google to get started.<br />No password needed.
        </p>
      </div>
    </div>
  );
}

function GoogleSignInButton({ redirectTo }: { redirectTo?: string }) {
  return (
    <form action={`/auth/google${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`} method="GET">
      <button
        type="submit"
        className="flex items-center gap-3 px-6 py-3.5 rounded-[10px] font-medium text-sm transition-opacity hover:opacity-90"
        style={{
          backgroundColor: "var(--bg-card)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.292C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>
    </form>
  );
}
