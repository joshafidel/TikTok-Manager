import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE, checkPassword, createSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function signIn(formData: FormData) {
  "use server";

  const password = process.env.APP_PASSWORD;
  if (!password) redirect("/locked");

  const attempt = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!(await checkPassword(password, attempt))) {
    redirect(`/login?error=1${next !== "/" ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect(next.startsWith("/") ? next : "/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;

  return (
    <div className="mx-auto mt-24 max-w-sm">
      <form action={signIn} className="card flex flex-col gap-3 p-6">
        <div>
          <p className="label !text-[var(--tally)]">TikTok Manager</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight">Sign in</h1>
        </div>
        <input type="hidden" name="next" value={next ?? "/"} />
        <div className="field">
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoFocus
            autoComplete="current-password"
            className="input"
            required
          />
        </div>
        {error && (
          <p className="font-mono text-[0.68rem] text-[var(--tally)]">
            Wrong password. Try again.
          </p>
        )}
        <button type="submit" className="btn btn-primary justify-center">
          Sign in
        </button>
      </form>
    </div>
  );
}
