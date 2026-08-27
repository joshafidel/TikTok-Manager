import Link from "next/link";
import { notFound } from "next/navigation";
import { getChannel, getClip, getItem, getPerformance } from "@/lib/queries";
import { deleteItem, logPerformance, setStatus, updateItem } from "@/lib/actions";
import { GenerateScript } from "@/components/generate";
import { ChannelChip, SectionHead, StatusPill, StatusSelect } from "@/components/ui";
import { STATUSES } from "@/db/schema";

export const dynamic = "force-dynamic";
// Script generation runs adaptive thinking at high effort — well past a default timeout.
export const maxDuration = 300;

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  const [channel, clip, perf] = await Promise.all([
    getChannel(item.channelId),
    item.clipId ? getClip(item.clipId) : Promise.resolve(undefined),
    getPerformance(id),
  ]);
  if (!channel) notFound();

  const nextStatus = STATUSES[Math.min(STATUSES.indexOf(item.status) + 1, STATUSES.length - 1)];
  const beats = channel.scriptStyle === "beats";

  return (
    <div className="flex flex-col gap-9">
      <section>
        <Link href={`/channels/${channel.id}`} className="label hover:text-ink">
          ← {channel.name}
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <ChannelChip channel={channel} />
            <h1 className="text-2xl font-bold leading-tight tracking-tight">{item.title}</h1>
          </div>
          <div className="flex flex-none items-center gap-2">
            <StatusPill status={item.status} />
            {item.status !== "posted" && (
              <form action={setStatus}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="status" value={nextStatus} />
                <button type="submit" className="btn btn-primary">
                  Mark {nextStatus}
                </button>
              </form>
            )}
          </div>
        </div>
        {item.premise && <p className="mt-3 max-w-2xl text-sm text-ink2">{item.premise}</p>}
        {clip && (
          <div className="card mt-4 border-l-[3px] border-l-[var(--tally)] p-3">
            <p className="label !text-[var(--tally)]">Source clip</p>
            <a
              href={clip.sourceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-1 block break-all text-xs underline"
            >
              {clip.sourceUrl}
            </a>
            {clip.premise && <p className="mt-1.5 text-xs text-ink2">{clip.premise}</p>}
          </div>
        )}
      </section>

      <section>
        <SectionHead
          num="01"
          title={beats ? "Beat sheet" : "Script"}
          action={<GenerateScript itemId={item.id} hasScript={Boolean(item.script)} />}
        />
        {item.hook && (
          <div className="card mb-3 p-4">
            <p className="label">Hook — the first line</p>
            <p className="mt-1.5 text-base font-medium leading-snug">
              &ldquo;{item.hook}&rdquo;
            </p>
          </div>
        )}
        {item.script ? (
          <div className="grid gap-3 lg:grid-cols-[3fr_2fr]">
            <div className="card p-4">
              <p className="label mb-2">{beats ? "Beats" : "Script"}</p>
              <div className="prose-script">{item.script}</div>
            </div>
            <div className="flex flex-col gap-3">
              {item.shotNotes && (
                <div className="card p-4">
                  <p className="label mb-2">Shot notes</p>
                  <div className="prose-script">{item.shotNotes}</div>
                </div>
              )}
              {item.caption && (
                <div className="card p-4">
                  <p className="label mb-2">Caption</p>
                  <p className="text-sm leading-relaxed text-ink2">{item.caption}</p>
                  {item.hashtags && (
                    <p className="mt-2 font-mono text-[0.66rem] leading-relaxed text-ink3">
                      {item.hashtags
                        .split(/\s+/)
                        .filter(Boolean)
                        .map((h) => (h.startsWith("#") ? h : `#${h}`))
                        .join(" ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card p-6 text-center">
            <p className="text-sm text-ink3">
              No {beats ? "beat sheet" : "script"} yet. Generate one, then edit it below —
              Claude&apos;s draft is a starting point, not the final read.
            </p>
          </div>
        )}
      </section>

      <section>
        <SectionHead num="02" title="Details" />
        <form action={updateItem} className="card grid gap-4 p-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={item.id} />
          <Field label="Title" name="title" defaultValue={item.title} />
          <div className="field">
            <label className="label" htmlFor="formatKey">
              Format
            </label>
            <select
              id="formatKey"
              name="formatKey"
              defaultValue={item.formatKey ?? ""}
              className="input"
            >
              <option value="">—</option>
              {channel.formats.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <Field label="Premise" name="premise" defaultValue={item.premise ?? ""} full />
          <Field label="Hook" name="hook" defaultValue={item.hook ?? ""} full />
          <Area
            label={beats ? "Beat sheet" : "Script"}
            name="script"
            defaultValue={item.script ?? ""}
            rows={14}
            full
          />
          <Area label="Shot notes" name="shotNotes" defaultValue={item.shotNotes ?? ""} rows={6} />
          <Area label="Caption" name="caption" defaultValue={item.caption ?? ""} rows={6} />
          <Field label="Hashtags" name="hashtags" defaultValue={item.hashtags ?? ""} />
          <Field
            label="Footage link"
            name="assetUrl"
            defaultValue={item.assetUrl ?? ""}
            placeholder="Drive / iCloud folder"
          />
          <Field label="Record on" name="recordOn" type="date" defaultValue={item.recordOn ?? ""} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Post on" name="postOn" type="date" defaultValue={item.postOn ?? ""} />
            <Field
              label="Post time"
              name="postTime"
              type="time"
              defaultValue={item.postTime ?? ""}
            />
          </div>
          <Field
            label="Live post URL"
            name="postUrl"
            defaultValue={item.postUrl ?? ""}
            placeholder="tiktok.com/..."
          />
          <Area label="Notes" name="notes" defaultValue={item.notes ?? ""} rows={4} />
          <div className="sm:col-span-2">
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </section>

      <section>
        <SectionHead num="03" title="Status" />
        <div className="flex flex-wrap items-end gap-3">
          <form action={setStatus} className="flex items-end gap-2">
            <input type="hidden" name="id" value={item.id} />
            <div className="field">
              <span className="label">Set status</span>
              <StatusSelect value={item.status} />
            </div>
            <button type="submit" className="btn">
              Apply
            </button>
          </form>
          <form action={deleteItem}>
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" className="btn">
              Delete
            </button>
          </form>
        </div>
      </section>

      <section>
        <SectionHead num="04" title="Performance" />
        <p className="mb-3 max-w-2xl text-sm text-ink2">
          Log the numbers a day or two after posting. They feed straight back into idea generation —
          the app learns which formats actually land on this channel.
        </p>
        <form action={logPerformance} className="card grid gap-3 p-4 sm:grid-cols-6">
          <input type="hidden" name="itemId" value={item.id} />
          {(["views", "likes", "comments", "shares", "saves", "follows"] as const).map((k) => (
            <div key={k} className="field">
              <label className="label" htmlFor={k}>
                {k}
              </label>
              <input id={k} name={k} type="number" min={0} className="input" />
            </div>
          ))}
          <div className="sm:col-span-6">
            <button type="submit" className="btn btn-primary">
              Log numbers
            </button>
          </div>
        </form>

        {perf.length > 0 && (
          <div className="card mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-rule bg-surface2">
                  {["Logged", "Views", "Likes", "Comments", "Shares", "Saves", "Follows"].map(
                    (h) => (
                      <th key={h} className="label px-3 py-2 text-left">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {perf.map((p) => (
                  <tr key={p.id} className="border-b border-rulesoft last:border-b-0">
                    <td className="px-3 py-2 font-mono text-xs text-ink3">
                      {p.recordedAt.slice(0, 10)}
                    </td>
                    {[p.views, p.likes, p.comments, p.shares, p.saves, p.follows].map((n, i) => (
                      <td key={i} className="px-3 py-2 font-mono text-xs tabular-nums">
                        {n?.toLocaleString() ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
  full,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
  full?: boolean;
}) {
  return (
    <div className={`field ${full ? "sm:col-span-2" : ""}`}>
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
  rows = 5,
  full,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  full?: boolean;
}) {
  return (
    <div className={`field ${full ? "sm:col-span-2" : ""}`}>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="input font-mono text-xs leading-relaxed"
      />
    </div>
  );
}
