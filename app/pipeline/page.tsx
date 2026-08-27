import { getBoard, getChannels } from "@/lib/queries";
import { STATUSES } from "@/db/schema";
import { createItem } from "@/lib/actions";
import { ChannelChip, Empty, SectionHead } from "@/components/ui";
import Link from "next/link";

export const dynamic = "force-dynamic";

/** Posted items leave the board — the board is work still owed. */
const COLUMNS = STATUSES.filter((s) => s !== "posted");

export default async function PipelinePage() {
  const [channels, board] = await Promise.all([getChannels(), getBoard()]);
  const byId = new Map(channels.map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-8">
      <section>
        <SectionHead title="Pipeline" />
        <div className="overflow-x-auto">
          <div className="grid min-w-[900px] grid-cols-5 gap-3">
            {COLUMNS.map((status) => {
              const rows = board.filter((i) => i.status === status);
              return (
                <div key={status} className="flex flex-col">
                  <div className="mb-2 flex items-baseline justify-between border-b border-rule pb-1.5">
                    <span className="label">{status}</span>
                    <span className="font-mono text-[0.68rem] font-bold tabular-nums text-ink3">
                      {rows.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {rows.length === 0 && (
                      <p className="py-3 text-center font-mono text-[0.62rem] text-ink3">—</p>
                    )}
                    {rows.map((item) => {
                      const channel = byId.get(item.channelId);
                      return (
                        <Link
                          key={item.id}
                          href={`/items/${item.id}`}
                          className="card p-2 transition-colors hover:bg-surface2"
                        >
                          <div className="flex items-start gap-1.5">
                            {channel && <ChannelChip channel={channel} />}
                            <span className="min-w-0 flex-1 text-xs font-medium leading-snug">
                              {item.title}
                            </span>
                          </div>
                          {(item.recordOn || item.postOn) && (
                            <p className="mt-1.5 font-mono text-[0.6rem] text-ink3">
                              {item.recordOn && `REC ${item.recordOn.slice(5)}`}
                              {item.recordOn && item.postOn && " · "}
                              {item.postOn && `POST ${item.postOn.slice(5)}`}
                            </p>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {board.length === 0 && <Empty>Nothing in the pipeline. Generate some ideas.</Empty>}
      </section>

      <section>
        <SectionHead title="Add one by hand" />
        <form action={createItem} className="card grid gap-3 p-4 sm:grid-cols-2">
          <div className="field">
            <label className="label" htmlFor="channelId">
              Channel
            </label>
            <select id="channelId" name="channelId" className="input" required>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="title">
              Title
            </label>
            <input id="title" name="title" className="input" required placeholder="Working title" />
          </div>
          <div className="field sm:col-span-2">
            <label className="label" htmlFor="premise">
              Premise
            </label>
            <input
              id="premise"
              name="premise"
              className="input"
              placeholder="One sentence: what happens in this video"
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="recordOn">
              Record on
            </label>
            <input id="recordOn" name="recordOn" type="date" className="input" />
          </div>
          <div className="field">
            <label className="label" htmlFor="postOn">
              Post on
            </label>
            <input id="postOn" name="postOn" type="date" className="input" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">
              Add to pipeline
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
