"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { ensurePoolAction, writeScriptsAction } from "@/lib/actions";

/**
 * Keeps an account topped up to ten scripted ideas.
 *
 * Ten scripts is far more than one serverless request can write, so this drives
 * the work in batches from the browser: top up the ideas, then write scripts a
 * few at a time, refreshing between rounds so they appear as they land.
 */
export function PoolFiller({
  channelId,
  missingIdeas,
  missingScripts,
}: {
  channelId: string;
  missingIdeas: number;
  missingScripts: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(missingScripts);

  const running = useRef(false);

  const run = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError(null);

    try {
      if (missingIdeas > 0) {
        const r = await ensurePoolAction(channelId);
        if (r.error) throw new Error(r.error);
        router.refresh();
      }

      // Keep going until every idea has a script, or a batch reports failure.
      for (let guard = 0; guard < 12; guard++) {
        const r = await writeScriptsAction(channelId);
        if (r.error) throw new Error(r.error);
        setLeft(r.remaining);
        router.refresh();
        if (r.remaining === 0) break;
        if (r.written === 0) break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, [channelId, missingIdeas, router]);

  // Start automatically when the account is short — the point is that ten
  // scripts are simply there when you open it. Re-runs when crossing an idea
  // off draws a replacement that still needs writing.
  useEffect(() => {
    if (missingIdeas > 0 || missingScripts > 0) void run();
  }, [missingIdeas, missingScripts, run]);

  if (!busy && !error && left === 0) return null;

  return (
    <div className="card mb-5 border-l-[3px] border-l-[var(--tally)] p-4">
      {error ? (
        <>
          <p className="label !text-[var(--tally)]">Couldn&apos;t finish</p>
          <p className="mt-1.5 text-sm text-ink2">{error}</p>
          <button type="button" className="btn mt-3" onClick={() => void run()}>
            Try again
          </button>
        </>
      ) : (
        <>
          <p className="label !text-[var(--tally)]">Writing your scripts</p>
          <p className="mt-1.5 text-sm text-ink2">
            {left > 0 ? `${left} still to write.` : "Working…"} You can start reading the ones
            below — they appear as they finish.
          </p>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface2">
            <div className="h-full w-1/3 animate-pulse rounded-full bg-[var(--tally)]" />
          </div>
        </>
      )}
    </div>
  );
}

export function CrossOffButton({
  reason,
  children,
}: {
  reason: "rejected" | "recorded";
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <>
      <input type="hidden" name="reason" value={reason} />
      <button type="submit" className="btn" disabled={pending}>
        {pending ? "Replacing…" : children}
      </button>
    </>
  );
}
