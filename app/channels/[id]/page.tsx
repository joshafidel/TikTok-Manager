import Link from "next/link";
import { notFound } from "next/navigation";
import { getChannel, getDepths, getIdeas, getItemsByChannel } from "@/lib/queries";
import { archiveItem, bulkArchiveIdeas, updateChannel } from "@/lib/actions";
import { GenerateIdeas } from "@/components/generate";
import { ChannelChip, DepthMeter, Empty, SectionHead, StatusPill } from "@/components/ui";
import { DAY_ABBR } from "@/lib/dates";

export const dynamic = "force-dynamic";
// Script generation runs adaptive thinking at high effort — well past a default timeout.
export const maxDuration = 300;

export default async function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const channel = await getChannel(id);
  if (!channel) notFound();

  const [ideas, recent, depths] = await Promise.all([
    getIdeas(id),
    getItemsByChannel(id, 30),
    getDepths(),
  ]);
  const inProduction = recent.filter((i) => i.status !== "idea");

  return (
    <div className="flex flex-col gap-10">
      <section>
        <div className="mb-4 flex items-center gap-3">
          <ChannelChip channel={channel} />
          <h1 className="text-2xl font-bold tracking-tight">{channel.name}</h1>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
          <DepthMeter channel={channel} depth={depths[id] ?? 0} />
          <div className="card p-4">
            <p className="label">Mission</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink2">{channel.mission}</p>
            <p className="label mt-4">Voice</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink2">{channel.voice}</p>
          </div>
        </div>
      </section>

      <section>
        <SectionHead num="01" title="Generate ideas" />
        <GenerateIdeas channelId={channel.id} />
      </section>

      <section>
        <SectionHead
          num="02"
          title={`Idea list (${ideas.length})`}
          action={
            ideas.length > 0 ? (
              <form action={bulkArchiveIdeas}>
                <input type="hidden" name="channelId" value={channel.id} />
                <button type="submit" className="btn">
                  Clear all
                </button>
              </form>
            ) : undefined
          }
        />
        <div className="card overflow-hidden">
          {ideas.length === 0 ? (
            <Empty>No ideas waiting. Generate a batch above.</Empty>
          ) : (
            ideas.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 border-b border-rulesoft p-3 last:border-b-0"
              >
                <Link href={`/items/${item.id}`} className="min-w-0 flex-1 group">
                  <span className="block text-sm font-medium group-hover:underline">
                    {item.title}
                  </span>
                  {item.hook && (
                    <span className="mt-1 block text-xs italic leading-relaxed text-ink2">
                      &ldquo;{item.hook}&rdquo;
                    </span>
                  )}
                  {item.notes && (
                    <span className="mt-1 block font-mono text-[0.62rem] leading-relaxed text-ink3">
                      {item.notes}
                    </span>
                  )}
                </Link>
                <form action={archiveItem} className="flex-none">
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="btn" title="Reject this idea">
                    Reject
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <SectionHead num="03" title="In production" />
        <div className="card overflow-hidden">
          {inProduction.length === 0 ? (
            <Empty>Nothing in production for this channel yet.</Empty>
          ) : (
            inProduction.map((item) => (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="flex items-center gap-3 border-b border-rulesoft px-3 py-2.5 transition-colors last:border-b-0 hover:bg-surface2"
              >
                <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>
                {item.postOn && (
                  <span className="font-mono text-[0.62rem] tabular-nums text-ink3">
                    {item.postOn}
                  </span>
                )}
                <StatusPill status={item.status} />
              </Link>
            ))
          )}
        </div>
      </section>

      <section>
        <SectionHead num="04" title="Profile" />
        <form action={updateChannel} className="card grid gap-4 p-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={channel.id} />
          <Field label="Name" name="name" defaultValue={channel.name} />
          <Field label="Handle" name="handle" defaultValue={channel.handle ?? ""} placeholder="@" />
          <Area
            label="Mission"
            name="mission"
            defaultValue={channel.mission}
            hint="What this channel is for. Drives every generated idea."
          />
          <Area label="Audience" name="audience" defaultValue={channel.audience} />
          <Area
            label="Voice"
            name="voice"
            defaultValue={channel.voice}
            hint="How this host actually talks."
          />
          <Area
            label="Never do"
            name="neverDo"
            defaultValue={channel.neverDo.join("\n")}
            hint="One per line. This list does more work than any other field."
          />
          <Field label="Standing CTA" name="cta" defaultValue={channel.cta ?? ""} />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Posts / week"
              name="cadencePerWeek"
              type="number"
              defaultValue={String(channel.cadencePerWeek)}
            />
            <Field
              label="Target bank"
              name="targetDepth"
              type="number"
              defaultValue={String(channel.targetDepth)}
            />
          </div>
          <div className="field sm:col-span-2">
            <span className="label">Record days</span>
            <div className="flex flex-wrap gap-3 pt-1">
              {DAY_ABBR.map((d, i) => (
                <label key={d} className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    name="recordDays"
                    value={i}
                    defaultChecked={channel.recordDays.includes(i)}
                    className="accent-[var(--tally)]"
                  />
                  <span className="font-mono text-[0.68rem]">{d}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">
              Save profile
            </button>
          </div>
        </form>
      </section>

      <section>
        <SectionHead num="05" title="Format library" />
        <div className="grid gap-3 sm:grid-cols-2">
          {channel.formats.map((f) => (
            <div key={f.key} className="card p-4">
              <p className="label">{f.key}</p>
              <h3 className="mt-1 text-sm font-semibold">{f.name}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink2">{f.description}</p>
              <p className="mt-2 border-t border-rulesoft pt-2 font-mono text-[0.62rem] leading-relaxed text-ink3">
                {f.structure}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="field">
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="input"
      />
    </div>
  );
}

function Area({
  label,
  name,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <div className="field">
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <textarea id={name} name={name} defaultValue={defaultValue} rows={5} className="input" />
      {hint && <p className="font-mono text-[0.6rem] text-ink3">{hint}</p>}
    </div>
  );
}
