import Link from "next/link";
import { getChannels, getItemsInRange } from "@/lib/queries";
import {
  DAY_ABBR,
  addMonths,
  endOfMonth,
  formatMonthYear,
  isSameMonth,
  monthGrid,
  startOfMonth,
  todayISO,
} from "@/lib/dates";
import { SectionHead } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m } = await searchParams;
  const anchor = m && /^\d{4}-\d{2}-\d{2}$/.test(m) ? m : todayISO();
  const today = todayISO();

  const grid = monthGrid(anchor);
  const [channels, items] = await Promise.all([
    getChannels(),
    getItemsInRange(grid[0], grid[grid.length - 1]),
  ]);
  const byId = new Map(channels.map((c) => [c.id, c]));

  return (
    <div>
      <SectionHead
        title={formatMonthYear(anchor)}
        action={
          <span className="flex gap-1.5">
            <Link href={`/calendar?m=${addMonths(anchor, -1)}`} className="btn">
              ← Prev
            </Link>
            <Link href={`/calendar?m=${startOfMonth(today)}`} className="btn">
              Today
            </Link>
            <Link href={`/calendar?m=${addMonths(anchor, 1)}`} className="btn">
              Next →
            </Link>
          </span>
        }
      />

      <div className="mb-3 flex flex-wrap gap-3">
        {channels.map((c) => (
          <span key={c.id} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.accent }} />
            <span className="label">{c.name}</span>
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full border border-ink3" />
          <span className="label">Outline = record day</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="grid grid-cols-7 gap-px border-b border-rule">
            {DAY_ABBR.map((d) => (
              <div key={d} className="bg-surface2 px-2 py-1.5">
                <span className="label">{d}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-rulesoft">
            {grid.map((date) => {
              const dayItems = items.filter((i) => i.recordOn === date || i.postOn === date);
              const inMonth = isSameMonth(date, anchor);
              return (
                <div
                  key={date}
                  className={`min-h-[92px] bg-surface p-1.5 ${inMonth ? "" : "opacity-40"}`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={`font-mono text-[0.68rem] font-bold tabular-nums ${
                        date === today ? "text-[var(--tally)]" : "text-ink3"
                      }`}
                    >
                      {Number(date.slice(8, 10))}
                    </span>
                    {date === today && <span className="label !text-[var(--tally)]">Today</span>}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayItems.slice(0, 4).map((item) => {
                      const channel = byId.get(item.channelId);
                      const isRecord = item.recordOn === date;
                      return (
                        <Link
                          key={`${date}-${item.id}-${isRecord ? "r" : "p"}`}
                          href={`/items/${item.id}`}
                          title={`${isRecord ? "Record" : "Post"}: ${item.title}`}
                          className="flex items-center gap-1 rounded-[2px] px-1 py-0.5 text-[0.66rem] leading-tight transition-colors hover:bg-surface2"
                        >
                          <span
                            className="h-1.5 w-1.5 flex-none rounded-full"
                            style={
                              isRecord
                                ? { border: `1.5px solid ${channel?.accent ?? "#888"}` }
                                : { backgroundColor: channel?.accent ?? "#888" }
                            }
                          />
                          <span className="truncate text-ink2">{item.title}</span>
                        </Link>
                      );
                    })}
                    {dayItems.length > 4 && (
                      <span className="px-1 font-mono text-[0.6rem] text-ink3">
                        +{dayItems.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
