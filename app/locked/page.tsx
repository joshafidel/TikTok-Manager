export const dynamic = "force-dynamic";

export default function LockedPage() {
  const dbUrl = process.env.DATABASE_URL;
  const missing = [
    (!dbUrl || dbUrl.startsWith("file:")) && {
      name: "DATABASE_URL",
      why: "The libsql:// address of your Turso database. A hosted app can't use a local file, because the filesystem is wiped on every deploy.",
    },
    (!dbUrl || dbUrl.startsWith("file:")) && {
      name: "DATABASE_AUTH_TOKEN",
      why: "The token for that same database. Goes together with DATABASE_URL.",
    },
  ].filter(Boolean) as { name: string; why: string }[];

  return (
    <div className="card mx-auto mt-16 max-w-xl p-6">
      <p className="label !text-[var(--tally)]">Almost there</p>
      <h1 className="mt-2 text-xl font-bold tracking-tight">
        {missing.length === 1 ? "One setting is missing" : `${missing.length} settings are missing`}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink2">
        Add {missing.length === 1 ? "it" : "them"} in Vercel under{" "}
        <strong>Settings → Environment Variables</strong>, then redeploy from the Deployments tab.
      </p>
      <dl className="mt-5 space-y-4">
        {missing.map((m) => (
          <div key={m.name} className="border-t border-rulesoft pt-3">
            <dt className="font-mono text-xs font-bold text-[var(--tally)]">{m.name}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-ink2">{m.why}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 border-t border-rulesoft pt-3 font-mono text-[0.66rem] leading-relaxed text-ink3">
        Nothing is broken — the app just refuses to run half-configured.
      </p>
    </div>
  );
}
