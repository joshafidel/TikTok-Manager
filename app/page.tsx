import Link from "next/link";
import { getChannels, getDay, getDepths, getItemsInRange } from "@/lib/queries";
import { addDays, dayOfWeek, formatLong, formatShort, todayISO } from "@/lib/dates";
import { ChannelChip, DepthMeter, Empty, ItemRow, SectionHead, StatusPill } from "@/components/ui";
import type { Channel } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const today = todayISO();

  // The app creates its tables and seeds channels on first use, so an empty
  // database is not a state that needs handling here.
  const channels: Channel[] = await getChannels();

  const [{ recording, posting }, depths, upcoming] = await Promise.all([
    getDay(today),
    getDepths(),
    getItemsInRange(addDays(today, 1), addDays(today, 7)),
  ]);

  const byId = new Map(channels.map((c) => [c.id, c]));
  const dow = dayOfWeek(today);

  // A record day with a short bank is the one thing that must not be missed.
  const recordDayChannels = channels.filter(
    (c) => c.recordDays.includes(dow) && (depths[c.id] ?? 0) < c.targetDepth,
  );

  return (
    <div className="flex flex-col gap-10">
      <section>
        <div className="mb-4">
          <p className="label">Today</p>
          <h1 className="text-3xl font-bold tracking-tight">{formatLong(today)}</h1>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {channels.map((c) => (
            <DepthMeter key={c.id} channel={c} depth={depths[c.id] ?? 0} />
          ))}
        </div>

        {recordDayChannels.length > 0 && (
          <div className="mt-3 rounded-sm border border-rulesoft border-l-[3px] border-l-[var(--tally)] bg-surface p-4">
            <p className="label !text-[var(--tally)]">Record day</p>
            <p className="mt-1.5 text-sm text-ink2">
              Today is a filming day for{" "}
              <strong className="font-semibold text-ink">
                {recordDayChannels.map((c) => c.name).join(" and ")}
              </strong>
              , and {recordDayChannels.length > 1 ? "those channels are" : "that channel is"} below
              target. Batch a session — this is what keeps the calendar from going dark next week.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {recordDayChannels.map((c) => (
                <Link key={c.id} href={`/channels/${c.id}`} className="btn">
                  Open {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <SectionHead num="01" title="Posting today" />
        <div className="card overflow-hidden">
          {posting.length === 0 ? (
            <Empty>
              Nothing scheduled to post today.{" "}
              <Link href="/pipeline" className="underline">
                Pull something from the pipeline.
              </Link>
            </Empty>
          ) : (
            posting.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                channel={byId.get(item.channelId)}
                action={item.postTime ? `Post · ${item.postTime}` : "Post"}
              />
            ))
          )}
        </div>
      </section>

      <section>
        <SectionHead num="02" title="Recording today" />
        <div className="card overflow-hidden">
          {recording.length === 0 ? (
            <Empty>No filming booked for today.</Empty>
          ) : (
            recording.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                channel={byId.get(item.channelId)}
                action="Record"
              />
            ))
          )}
        </div>
      </section>

      <section>
        <SectionHead
          num="03"
          title="Next seven days"
          action={
            <Link href="/calendar" className="label hover:text-ink">
              Full calendar →
            </Link>
          }
        />
        <div className="card overflow-hidden">
          {upcoming.length === 0 ? (
            <Empty>The week ahead is empty.</Empty>
          ) : (
            Array.from({ length: 7 }, (_, i) => addDays(today, i + 1)).map((date) => {
              const rows = upcoming.filter((it) => it.recordOn === date || it.postOn === date);
              if (!rows.length) return null;
              return (
                <div key={date} className="border-b border-rulesoft last:border-b-0">
                  <div className="bg-surface2 px-3 py-1.5">
                    <span className="label">{formatShort(date)}</span>
                  </div>
                  {rows.map((item) => {
                    const channel = byId.get(item.channelId);
                    return (
                      <Link
                        key={`${date}-${item.id}`}
                        href={`/items/${item.id}`}
                        className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-surface2"
                      >
                        {channel && <ChannelChip channel={channel} />}
                        <span className="label w-14 flex-none">
                          {item.recordOn === date ? "Record" : "Post"}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
                        <StatusPill status={item.status} />
                      </Link>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
