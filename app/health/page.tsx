import { getChannels } from "@/lib/queries";
import { buildInfo } from "@/lib/build-info";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Check = {
  name: string;
  need: string;
  state: "ok" | "bad-key" | "missing" | "unreachable";
  detail: string;
};

const TIMEOUT = 12_000;

/** Never surfaces the key itself — only whether the service accepted it. */
async function probe(
  name: string,
  need: string,
  key: string | undefined,
  url: string,
  headers: Record<string, string>,
): Promise<Check> {
  if (!key) {
    return { name, need, state: "missing", detail: `${need} is not set in your environment.` };
  }

  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT) });

    if (res.status === 401) {
      return { name, need, state: "bad-key", detail: "The service rejected this key (401)." };
    }
    if (res.status === 403) {
      // A 403 can come from the service OR from a network layer in front of it,
      // so don't assert the key is wrong on this alone.
      return {
        name,
        need,
        state: "bad-key",
        detail: "Refused with 403 — usually a wrong key, but a network block looks the same.",
      };
    }
    if (res.ok || res.status === 404) {
      // 404 means authentication passed and the probe path simply isn't a thing.
      return { name, need, state: "ok", detail: "Key accepted." };
    }
    return { name, need, state: "unreachable", detail: `Unexpected response (HTTP ${res.status}).` };
  } catch (err) {
    return {
      name,
      need,
      state: "unreachable",
      detail: err instanceof Error ? err.message : "Could not reach the service.",
    };
  }
}

export default async function HealthPage() {
  const shotstackBase =
    process.env.SHOTSTACK_ENV === "production"
      ? "https://api.shotstack.io/edit/v1"
      : "https://api.shotstack.io/edit/stage";

  const checks = await Promise.all([
    probe("Anthropic", "ANTHROPIC_API_KEY", process.env.ANTHROPIC_API_KEY, "https://api.anthropic.com/v1/models?limit=1", {
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    }),
    probe("AssemblyAI", "ASSEMBLYAI_API_KEY", process.env.ASSEMBLYAI_API_KEY, "https://api.assemblyai.com/v2/transcript?limit=1", {
      authorization: process.env.ASSEMBLYAI_API_KEY ?? "",
    }),
    probe("Shotstack", "SHOTSTACK_API_KEY", process.env.SHOTSTACK_API_KEY, `${shotstackBase}/templates`, {
      "x-api-key": process.env.SHOTSTACK_API_KEY ?? "",
    }),
  ]);

  let db: Check;
  try {
    const rows = await getChannels();
    db = {
      name: "Database",
      need: "DATABASE_URL",
      state: "ok",
      detail: `Connected. ${rows.length} channels.`,
    };
  } catch (err) {
    db = {
      name: "Database",
      need: "DATABASE_URL",
      state: "unreachable",
      detail: err instanceof Error ? err.message : "Could not connect.",
    };
  }

  const blob: Check = process.env.BLOB_READ_WRITE_TOKEN
    ? { name: "Video storage", need: "BLOB_READ_WRITE_TOKEN", state: "ok", detail: "Blob storage is connected." }
    : {
        name: "Video storage",
        need: "BLOB_READ_WRITE_TOKEN",
        state: "missing",
        detail: "Add Blob storage in Vercel (Storage → Create → Blob). Needed only for video upload.",
      };

  const all = [checks[0], db, checks[1], checks[2], blob];
  const bad = all.filter((c) => c.state !== "ok");

  const build = buildInfo();

  return (
    <div className="mx-auto max-w-2xl">
      <p className="label">Diagnostics</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">What&apos;s working</h1>
      <p className="mt-2 text-sm text-ink2">
        Tested live from the server, right now. Keys are never shown — only whether each service
        accepted them.
      </p>

      <div className="card mt-5 p-3">
        <p className="label">This deployment</p>
        <dl className="mt-2 grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1 font-mono text-[0.7rem]">
          <dt className="text-ink3">Commit</dt>
          <dd className="tabular-nums">{build.shortCommit}</dd>
          <dt className="text-ink3">Branch</dt>
          <dd className="break-all">{build.branch}</dd>
          <dt className="text-ink3">Environment</dt>
          <dd>{build.env}</dd>
          {build.message && (
            <>
              <dt className="text-ink3">Built from</dt>
              <dd className="break-words">{build.message.split("\n")[0]}</dd>
            </>
          )}
        </dl>
        <p className="mt-2 border-t border-rulesoft pt-2 font-mono text-[0.62rem] leading-relaxed text-ink3">
          If this commit is not the newest one pushed, you are looking at an older build — most
          often because an earlier deployment was redeployed, or the newest build failed.
        </p>
      </div>

      <div className="card mt-3 overflow-hidden">
        {all.map((c) => (
          <div key={c.name} className="flex items-start gap-3 border-b border-rulesoft p-3 last:border-b-0">
            <span
              className="mt-1.5 h-2.5 w-2.5 flex-none rounded-full"
              style={{
                backgroundColor:
                  c.state === "ok" ? "var(--good)" : c.state === "missing" ? "var(--ink-3)" : "var(--tally)",
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{c.name}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink2">{c.detail}</p>
              {c.state !== "ok" && (
                <p className="mt-1 font-mono text-[0.62rem] text-ink3">{c.need}</p>
              )}
            </div>
            <span className="label flex-none pt-0.5">
              {c.state === "ok" ? "OK" : c.state === "missing" ? "Not set" : c.state === "bad-key" ? "Bad key" : "Error"}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 max-w-prose text-sm text-ink2">
        {bad.length === 0
          ? "Everything is connected. Ideas, scripts and auto-editing should all work."
          : "Add the missing values in Vercel under Settings → Environment Variables, then redeploy from the Deployments tab — environment changes don't apply to a build that already ran."}
      </p>

      {!process.env.APP_PASSWORD && (
        <p className="mt-4 max-w-prose border-t border-rulesoft pt-3 font-mono text-[0.66rem] leading-relaxed text-ink3">
          No APP_PASSWORD is set, so this site is open to anyone with the URL and they can spend
          your API credit. Set APP_PASSWORD in Vercel to turn a login back on.
        </p>
      )}
    </div>
  );
}
