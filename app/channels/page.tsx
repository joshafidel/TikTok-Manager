import Link from "next/link";
import { getChannels, getDepths } from "@/lib/queries";
import { DAY_ABBR } from "@/lib/dates";
import { ChannelChip, SectionHead } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ChannelsPage() {
  const [channels, depths] = await Promise.all([getChannels(), getDepths()]);

  return (
    <div>
      <SectionHead title="Channels" />
      <p className="mb-5 max-w-2xl text-sm text-ink2">
        These profiles are the highest-leverage thing in the app — every generated idea and script
        is written against them. Keep them specific, and keep the &ldquo;never do&rdquo; list
        honest.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {channels.map((c) => (
          <Link
            key={c.id}
            href={`/channels/${c.id}`}
            className="card flex flex-col p-4 transition-colors hover:bg-surface2"
            style={{ borderTop: `3px solid ${c.accent}` }}
          >
            <div className="flex items-center gap-2">
              <ChannelChip channel={c} />
              <span className="font-semibold">{c.name}</span>
            </div>
            <p className="mt-2.5 line-clamp-4 text-xs leading-relaxed text-ink2">{c.mission}</p>
            <dl className="mt-auto space-y-1.5 pt-3">
              <Row k="Cadence" v={`${c.cadencePerWeek}/week`} />
              <Row k="Banked" v={`${depths[c.id] ?? 0} / ${c.targetDepth}`} />
              <Row k="Record days" v={c.recordDays.map((d) => DAY_ABBR[d]).join(", ") || "—"} />
              <Row k="Scripts" v={c.scriptStyle === "beats" ? "Beat sheets" : "Full scripts"} />
            </dl>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-t border-rulesoft pt-1.5">
      <dt className="label">{k}</dt>
      <dd className="font-mono text-[0.68rem] tabular-nums text-ink2">{v}</dd>
    </div>
  );
}
