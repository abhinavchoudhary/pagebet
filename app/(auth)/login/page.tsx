import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
        <div className="flex w-full max-w-sm flex-col items-center gap-6">
          <div className="flex size-[72px] items-center justify-center rounded-corner-lg bg-primary-container text-[32px]">
            📖
          </div>
          <div className="flex flex-col items-center gap-3">
            <h1 className="md-display-medium text-on-surface">Pagebet</h1>
            <div className="h-1 rounded-corner-full bg-primary" style={{ width: 52 }} />
          </div>
          <p className="text-center md-body-large text-on-surface-variant">
            Track pages. Share progress.
            <br />
            Hold each other accountable.
          </p>
        </div>
      </div>

      <div
        className="flex flex-col gap-4 rounded-t-[28px] bg-surface-container px-5 pt-8"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}
      >
        <p className="text-center md-label-medium text-on-surface-variant">
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
            className="md-state-layer flex w-full items-center justify-center gap-3 rounded-corner-full bg-primary px-6 py-4 md-label-large text-on-primary"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="z-[1]">
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
            <span className="z-[1]">Continue with Google</span>
          </button>
        </form>
        <p className="text-center md-body-small text-on-surface-variant">
          No password needed. Sign in with your Google account.
        </p>
      </div>
    </div>
  );
}
