"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { runBriefAction } from "@/lib/actions";

/**
 * Starts today's scan when the page opens and nothing has been written yet,
 * and offers a button to run it again. The timer normally gets there first;
 * this is for the days it hasn't, and for a second look.
 */
export function BriefRunner({
  hasToday,
  missingScripts,
}: {
  hasToday: boolean;
  missingScripts: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);

  const run = useCallback(
    async (force: boolean) => {
      if (running.current) return;
      running.current = true;
      setBusy(true);
      setError(null);
      try {
        const r = await runBriefAction(force);
        if (r.error) throw new Error(r.error);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "The scan failed.");
      } finally {
        running.current = false;
        setBusy(false);
      }
    },
    [router],
  );

  useEffect(() => {
    if (!hasToday || missingScripts > 0) void run(false);
  }, [hasToday, missingScripts, run]);

  if (busy) {
    return (
      <div className="card mb-5 border-l-[3px] border-l-[var(--tally)] p-4">
        <p className="label !text-[var(--tally)]">
          {hasToday ? "Writing the scripts" : "Scanning today's AI news"}
        </p>
        <p className="mt-1.5 text-sm text-ink2">
          {hasToday
            ? "The stories are in. The scripts take about a minute each and appear as they finish."
            : "Reading the news, picking the three that matter, then writing a script for each. Two to three minutes."}
        </p>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface2">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-[var(--tally)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <button type="button" className="btn" onClick={() => void run(true)}>
        {hasToday ? "Scan again" : "Scan now"}
      </button>
      {error && (
        <span className="font-mono text-[0.62rem] leading-relaxed text-[var(--tally)]">
          {error}
        </span>
      )}
    </div>
  );
}
