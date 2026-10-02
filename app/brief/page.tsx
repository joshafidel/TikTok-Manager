import Link from "next/link";
import { getBrief, getBriefDates, BRIEF_CHANNEL } from "@/lib/brief";
import { getChannel } from "@/lib/queries";
import { formatLong, formatShort, todayISO } from "@/lib/dates";
import { crossOffIdea } from "@/lib/actions";
import { BriefRunner } from "@/components/brief-client";
import { CrossOffButton } from "@/components/pool-client";
import { SectionHead } from "@/components/ui";

export const dynamic = "force-dynamic";
// The scan reads the web and writes three scripts; well past a default timeout.
export const maxDuration = 300;

export default async function BriefPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: picked } = await searchParams;
  const today = todayISO();
  const date = picked && /^\d{4}-\d{2}-\d{2}$/.test(picked) ? picked : today;

  const [stories, dates, channel] = await Promise.all([
    getBrief(date),
    getBriefDates(),
    getChannel(BRIEF_CHANNEL),
  ]);
  const isToday = date === today;
  const missingScripts = stories.filter((s) => !s.script).length;

  return (
    <div className="flex flex-col gap-10">
      <section>
        <p className="label">AI brief</p>
        <h1 className="text-3xl font-bold tracking-tight">
          {formatLong(date)}
        </h1>
        <p className="mt-1.5 max-w-prose text-sm text-ink2">
          The three biggest AI stories of the day, each with a script ready to
          record. Scans on its own every morning, and goes into the{" "}
          {channel?.name ?? "AI News"} account.
        </p>
      </section>

      <section>
        <SectionHead
          num="01"
          title={
            isToday ? "Today's three" : `The three from ${formatShort(date)}`
          }
          action={
            !isToday ? (
              <Link href="/brief" className="btn">
                Back to today
              </Link>
            ) : undefined
          }
        />

        {isToday && (
          <BriefRunner
            hasToday={stories.length > 0}
            missingScripts={missingScripts}
          />
        )}

        {stories.length === 0 && !isToday && (
          <p className="px-3 py-6 text-center text-sm text-ink3">
            Nothing was written that day.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {stories.map((item, i) => (
            <article key={item.id} className="card p-4">
              <div className="flex items-start gap-3">
                <span className="label w-6 flex-none pt-1 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold leading-snug">
                    {item.title}
                  </h3>
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="label mt-1 inline-block underline decoration-1 underline-offset-2 hover:text-ink"
                    >
                      Read the source
                    </a>
                  )}

                  {item.premise && (
                    <div className="mt-3">
                      <p className="label">What happened</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink2">
                        {item.premise}
                      </p>
                    </div>
                  )}

                  {item.notes && (
                    <div className="mt-3">
                      <p className="label">Why it matters</p>
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink2">
                        {item.notes
                          .replace(/^Why it matters:\s*/, "")
                          .replace(/\n\nSource:.*$/s, "")}
                      </p>
                    </div>
                  )}

                  {item.hook && (
                    <p className="mt-3 border-l-2 border-[var(--tally)] pl-3 text-[0.95rem] font-medium italic leading-snug">
                      &ldquo;{item.hook}&rdquo;
                    </p>
                  )}

                  {!item.script && (
                    <p className="mt-2 font-mono text-[0.68rem] text-ink3">
                      Writing the script…
                    </p>
                  )}

                  {item.script && (
                    <details
                      className="mt-3 border-t border-rulesoft pt-3"
                      open={i === 0}
                    >
                      <summary className="label cursor-pointer hover:text-ink">
                        Read the script
                        {item.estimatedSeconds
                          ? ` · ~${item.estimatedSeconds}s`
                          : ""}
                      </summary>
                      <div className="prose-script mt-3">{item.script}</div>

                      {item.loopLine && (
                        <div className="mt-3 border-t border-rulesoft pt-3">
                          <p className="label">
                            Closing line — sends them back to the start
                          </p>
                          <p className="mt-1 text-sm italic text-ink2">
                            &ldquo;{item.loopLine}&rdquo;
                          </p>
                        </div>
                      )}

                      {item.caption && (
                        <div className="mt-3 border-t border-rulesoft pt-3">
                          <p className="label">Caption</p>
                          <p className="mt-1 text-sm text-ink2">
                            {item.caption}
                          </p>
                          {item.hashtags && (
                            <p className="mt-1 font-mono text-[0.66rem] text-ink3">
                              {item.hashtags
                                .split(/\s+/)
                                .filter(Boolean)
                                .map((h) => (h.startsWith("#") ? h : `#${h}`))
                                .join(" ")}
                            </p>
                          )}
                        </div>
                      )}
                    </details>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2 border-t border-rulesoft pt-3">
                    <form action={crossOffIdea}>
                      <input type="hidden" name="id" value={item.id} />
                      <CrossOffButton reason="recorded">
                        Recorded it
                      </CrossOffButton>
                    </form>
                    <form action={crossOffIdea}>
                      <input type="hidden" name="id" value={item.id} />
                      <CrossOffButton reason="rejected">
                        Not for me
                      </CrossOffButton>
                    </form>
                    <Link href={`/items/${item.id}`} className="btn">
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {dates.filter((d) => d !== date).length > 0 && (
        <section>
          <SectionHead num="02" title="Earlier days" />
          <div className="card overflow-hidden">
            {dates
              .filter((d) => d !== date)
              .map((d) => (
                <Link
                  key={d}
                  href={`/brief?date=${d}`}
                  className="flex items-center justify-between border-b border-rulesoft px-3 py-2.5 text-sm last:border-b-0 hover:bg-surface2"
                >
                  <span>{formatLong(d)}</span>
                  <span className="label">Open</span>
                </Link>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
