import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ backgroundColor: "#3b2412" }}
    >
      {/* Top brand zone */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="flex flex-col items-center gap-6 w-full max-w-sm">
          {/* Logo mark */}
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 72,
              height: 72,
              background: "rgba(200,145,58,0.2)",
              border: "2px solid rgba(200,145,58,0.45)",
            }}
          >
            <span style={{ fontSize: 32 }}>📖</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1
              className="font-serif font-semibold text-center"
              style={{ fontSize: 38, color: "#ffffff", letterSpacing: "-0.02em" }}
            >
              Pagebet
            </h1>
            {/* Amber underline */}
            <div
              style={{
                width: 52,
                height: 4,
                backgroundColor: "#c8913a",
                borderRadius: 2,
              }}
            />
          </div>

          <p
            className="text-sm text-center leading-relaxed"
            style={{
              color: "rgba(255,255,255,0.6)",
              fontFamily: "var(--font-inter)",
            }}
          >
            Track pages. Share progress.
            <br />
            Hold each other accountable.
          </p>
        </div>
      </div>

      {/* Bottom sign-in card */}
      <div
        className="px-5 pt-8 pb-10 flex flex-col gap-4"
        style={{
          backgroundColor: "#fdf5e6",
          borderRadius: "28px 28px 0 0",
        }}
      >
        <p
          className="text-[10px] font-semibold uppercase text-center"
          style={{
            letterSpacing: "0.1em",
            color: "#9c826a",
            fontFamily: "var(--font-inter)",
          }}
        >
          Sign in to continue
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-[4px] font-semibold text-sm transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "#3b2412",
              color: "#ffffff",
              fontFamily: "var(--font-inter)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.292C4.672 5.163 6.656 3.58 9 3.58z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </form>

        <p
          className="text-xs text-center"
          style={{ color: "#9c826a", fontFamily: "var(--font-inter)" }}
        >
          No password needed. Sign in with your Google account.
        </p>
      </div>
    </div>
  );
}
