import Link from "next/link";
import type { Channel, Item, Status } from "@/db/schema";
import { STATUSES } from "@/db/schema";

export function ChannelChip({ channel }: { channel: Channel }) {
  return (
    <span className="chip flex-none" style={{ backgroundColor: channel.accent }}>
      {channel.name.slice(0, 2).toUpperCase()}
    </span>
  );
}

const STATUS_TONE: Record<Status, string> = {
  idea: "text-ink3 border-rule",
  scripted: "text-ink2 border-rule",
  recorded: "text-[var(--warn)] border-[var(--warn)]",
  edited: "text-[var(--good)] border-[var(--good)]",
  scheduled: "text-[var(--good)] border-[var(--good)]",
  posted: "text-ink3 border-rulesoft",
};

export function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex flex-none items-center rounded-sm border px-1.5 py-0.5 font-mono text-[0.58rem] font-bold uppercase tracking-[0.08em] ${STATUS_TONE[status]}`}
    >
      {status}
    </span>
  );
}

export function SectionHead({
  num,
  title,
  action,
}: {
  num?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-rule pb-2">
      <div className="flex items-baseline gap-3">
        {num && <span className="label !text-[var(--tally)]">{num}</span>}
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/** Banked, ready-to-post videos versus the channel's target. */
export function DepthMeter({ channel, depth }: { channel: Channel; depth: number }) {
  const short = depth < channel.targetDepth;
  const pct = Math.min(100, Math.round((depth / Math.max(1, channel.targetDepth)) * 100));
  return (
    <Link href={`/channels/${channel.id}`} className="card block p-3 transition-colors hover:bg-surface2">
      <div className="flex items-center gap-2">
        <ChannelChip channel={channel} />
        <span className="truncate text-sm font-semibold">{channel.name}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span
          className="font-mono text-2xl font-bold tabular-nums"
          style={{ color: short ? "var(--tally)" : "var(--good)" }}
        >
          {depth}
        </span>
        <span className="label">/ {channel.targetDepth} banked</span>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface2">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: short ? "var(--tally)" : "var(--good)" }}
        />
      </div>
      <p className="mt-2 font-mono text-[0.62rem] leading-relaxed text-ink3">
        {short
          ? `Short by ${channel.targetDepth - depth} — book a record session.`
          : `Healthy. ${channel.cadencePerWeek}/week.`}
      </p>
    </Link>
  );
}

export function ItemRow({
  item,
  channel,
  action,
}: {
  item: Item;
  channel?: Channel;
  action?: string;
}) {
  return (
    <Link
      href={`/items/${item.id}`}
      className="flex items-start gap-3 border-b border-rulesoft px-3 py-2.5 transition-colors last:border-b-0 hover:bg-surface2"
    >
      {channel && <ChannelChip channel={channel} />}
      <span className="min-w-0 flex-1">
        {action && <span className="label block">{action}</span>}
        <span className="block truncate text-sm font-medium">{item.title}</span>
        {item.premise && (
          <span className="mt-0.5 block truncate text-xs text-ink3">{item.premise}</span>
        )}
      </span>
      <StatusPill status={item.status} />
    </Link>
  );
}

export function StatusSelect({ value }: { value: Status }) {
  return (
    <select name="status" defaultValue={value} className="input font-mono text-xs uppercase">
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-3 py-6 text-center text-sm text-ink3">{children}</p>;
}
