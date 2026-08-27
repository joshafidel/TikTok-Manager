export const dynamic = "force-dynamic";

export default function LockedPage() {
  return (
    <div className="card mx-auto mt-24 max-w-lg p-6">
      <p className="label !text-[var(--tally)]">Not configured</p>
      <h1 className="mt-2 text-xl font-bold tracking-tight">This deployment has no password</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink2">
        A deployed instance with no password would let anyone who finds the URL read your content
        and spend your Anthropic credit, so the app refuses to serve until one is set.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink2">
        Add an <code className="font-mono text-xs">APP_PASSWORD</code> environment variable in your
        hosting settings, then redeploy.
      </p>
    </div>
  );
}
