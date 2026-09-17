import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db, videos } from "@/db";
import { getChannel } from "@/lib/queries";
import { getPool, POOL_SIZE } from "@/lib/pool";
import { crossOffIdea } from "@/lib/actions";
import { RECORDING_TIPS } from "@/lib/playbook";
import { CrossOffButton, PoolFiller } from "@/components/pool-client";
import { VideoUploader } from "@/components/video-client";
import { SectionHead } from "@/components/ui";

export const dynamic = "force-dynamic";
// Generating ideas and scripts runs well past a default function timeout.
export const maxDuration = 300;

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const channel = await getChannel(id);
  if (!channel) notFound();

  const pool = await getPool(id);
  const scripted = pool.filter((p) => p.script);
  const edits = await db
    .select()
    .from(videos)
    .where(eq(videos.channelId, id))
    .orderBy(desc(videos.createdAt))
    .limit(5);

  return (
    <div className="flex flex-col gap-10">
      <section>
        <Link href="/" className="label hover:text-ink">
          ← All accounts
        </Link>
        <div className="mt-3 flex items-center gap-4">
          {channel.logo && (
            <Image
              src={channel.logo}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 flex-none rounded-full"
              priority
            />
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{channel.name}</h1>
            <p className="label mt-1">
              {scripted.length} of {POOL_SIZE} ready to record
            </p>
          </div>
        </div>
      </section>

      <section>
        <SectionHead num="01" title="Your ten ideas" />
        <PoolFiller
          channelId={channel.id}
          missingIdeas={Math.max(0, POOL_SIZE - pool.length)}
          missingScripts={pool.length - scripted.length}
        />

        <div className="flex flex-col gap-3">
          {pool.map((item, i) => (
            <article key={item.id} className="card p-4">
              <div className="flex items-start gap-3">
                <span className="label w-6 flex-none pt-1 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold leading-snug">{item.title}</h3>

                  {item.hook && (
                    <p className="mt-2 border-l-2 border-[var(--tally)] pl-3 text-[0.95rem] font-medium italic leading-snug">
                      &ldquo;{item.hook}&rdquo;
                    </p>
                  )}

                  {item.premise && (
                    <p className="mt-2 text-sm leading-relaxed text-ink2">{item.premise}</p>
                  )}

                  {!item.script && (
                    <p className="mt-2 font-mono text-[0.68rem] text-ink3">
                      Writing the script…
                    </p>
                  )}

                  {item.script && (
                    <details className="mt-3 border-t border-rulesoft pt-3">
                      <summary className="label cursor-pointer hover:text-ink">
                        Read the script
                        {item.estimatedSeconds ? ` · ~${item.estimatedSeconds}s` : ""}
                      </summary>
                      <div className="prose-script mt-3">{item.script}</div>

                      {item.loopLine && (
                        <div className="mt-3 border-t border-rulesoft pt-3">
                          <p className="label">Closing line — sends them back to the start</p>
                          <p className="mt-1 text-sm italic text-ink2">
                            &ldquo;{item.loopLine}&rdquo;
                          </p>
                        </div>
                      )}

                      {item.shotNotes && (
                        <div className="mt-3 border-t border-rulesoft pt-3">
                          <p className="label">How to shoot it</p>
                          <div className="prose-script mt-1">{item.shotNotes}</div>
                        </div>
                      )}

                      {item.caption && (
                        <div className="mt-3 border-t border-rulesoft pt-3">
                          <p className="label">Caption</p>
                          <p className="mt-1 text-sm text-ink2">{item.caption}</p>
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
                      <CrossOffButton reason="recorded">Recorded it</CrossOffButton>
                    </form>
                    <form action={crossOffIdea}>
                      <input type="hidden" name="id" value={item.id} />
                      <CrossOffButton reason="rejected">Not for me</CrossOffButton>
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

        {pool.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-ink3">
            Drawing your first ten ideas — this takes a minute.
          </p>
        )}
      </section>

      <section>
        <SectionHead num="02" title="Auto-edit a recording" />
        <VideoUploader channelId={channel.id} />

        {edits.length > 0 && (
          <div className="card mt-3 overflow-hidden">
            {edits.map((v) => (
              <div
                key={v.id}
                className="flex flex-wrap items-center gap-3 border-b border-rulesoft px-3 py-2.5 last:border-b-0"
              >
                <span className="label w-20 flex-none">{v.status}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{v.filename}</span>
                {v.plan && (
                  <span className="font-mono text-[0.62rem] tabular-nums text-ink3">
                    {v.plan.sourceDuration.toFixed(1)}s → {v.plan.keptDuration.toFixed(1)}s
                  </span>
                )}
                {v.renderUrl && (
                  <a
                    href={v.renderUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="label hover:text-ink"
                  >
                    Open →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHead num="03" title="How to record it well" />
        <div className="grid gap-3 sm:grid-cols-2">
          {RECORDING_TIPS.map((tip) => (
            <div key={tip.title} className="card p-4">
              <h3 className="text-sm font-semibold">{tip.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink2">{tip.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
