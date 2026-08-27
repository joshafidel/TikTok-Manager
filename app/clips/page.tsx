import Link from "next/link";
import { getChannels, getClips } from "@/lib/queries";
import { addClip, clipToItem, deleteClip, setClipStatus } from "@/lib/actions";
import { Empty, SectionHead } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ClipsPage() {
  const [channels, clips] = await Promise.all([getChannels(), getClips()]);

  // The reaction channel is the one with a sourcing bottleneck, so it's the default.
  const defaultChannel = channels.find((c) => c.scriptStyle === "beats") ?? channels[0];
  const queued = clips.filter((c) => c.status === "queued");
  const rest = clips.filter((c) => c.status !== "queued");

  return (
    <div className="flex flex-col gap-9">
      <section>
        <SectionHead title="Clip queue" />
        <p className="max-w-2xl text-sm text-ink2">
          On a reaction channel the bottleneck is sourcing, not writing. Keep this stocked — twenty
          links banked means a record session never stalls looking for material.
        </p>
      </section>

      <section>
        <form action={addClip} className="card grid gap-3 p-4 sm:grid-cols-2">
          <div className="field">
            <label className="label" htmlFor="channelId">
              Channel
            </label>
            <select
              id="channelId"
              name="channelId"
              className="input"
              defaultValue={defaultChannel?.id}
              required
            >
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="source">
              Where from
            </label>
            <input id="source" name="source" className="input" placeholder="Instagram, TikTok, X" />
          </div>
          <div className="field sm:col-span-2">
            <label className="label" htmlFor="sourceUrl">
              Link
            </label>
            <input
              id="sourceUrl"
              name="sourceUrl"
              className="input"
              required
              placeholder="https://..."
            />
          </div>
          <div className="field sm:col-span-2">
            <label className="label" htmlFor="premise">
              One-line premise
            </label>
            <input
              id="premise"
              name="premise"
              className="input"
              placeholder="What is in it, in the words you'd use to describe it out loud"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">
              Add to queue
            </button>
          </div>
        </form>
      </section>

      <section>
        <SectionHead num="01" title={`Queued (${queued.length})`} />
        <div className="card overflow-hidden">
          {queued.length === 0 ? (
            <Empty>Queue is empty. Add links as you find them, not on record day.</Empty>
          ) : (
            queued.map((clip) => (
              <div
                key={clip.id}
                className="flex flex-wrap items-start gap-3 border-b border-rulesoft p-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{clip.premise ?? "No premise written"}</p>
                  <a
                    href={clip.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-0.5 block break-all font-mono text-[0.62rem] text-ink3 underline"
                  >
                    {clip.sourceUrl}
                  </a>
                </div>
                <div className="flex flex-none gap-1.5">
                  <form action={clipToItem}>
                    <input type="hidden" name="id" value={clip.id} />
                    <button type="submit" className="btn btn-primary">
                      Make video
                    </button>
                  </form>
                  <form action={setClipStatus}>
                    <input type="hidden" name="id" value={clip.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <button type="submit" className="btn">
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {rest.length > 0 && (
        <section>
          <SectionHead num="02" title="Used and rejected" />
          <div className="card overflow-hidden">
            {rest.map((clip) => (
              <div
                key={clip.id}
                className="flex flex-wrap items-center gap-3 border-b border-rulesoft p-3 last:border-b-0"
              >
                <span className="label w-16 flex-none">{clip.status}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink2">
                  {clip.premise ?? clip.sourceUrl}
                </span>
                {clip.usedByItemId && (
                  <Link href={`/items/${clip.usedByItemId}`} className="label hover:text-ink">
                    Open video →
                  </Link>
                )}
                <form action={deleteClip} className="flex-none">
                  <input type="hidden" name="id" value={clip.id} />
                  <button type="submit" className="btn">
                    Delete
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
