import "server-only";
import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import * as z from "zod/v4";
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import { db, items } from "@/db";
import type { Channel, Item } from "@/db/schema";
import { ready } from "@/db/ready";
import { generateScript } from "./claude";
import { addDays, fromISODate, todayISO, type ISODate } from "./dates";
import { profileVersion } from "./profile-version";
import { getChannel, getRecentTitles } from "./queries";

/**
 * The daily AI brief: the three biggest stories of the day, each with a
 * script, written into the AI News channel and shown on their own page.
 *
 * Runs once a day on a timer (see vercel.json) and on demand from the page.
 * Everything it writes is an ordinary item — it shows up in the channel's
 * list, can be crossed off, and ages out under the same rules as the rest.
 */
const MODEL = "claude-opus-5";
export const BRIEF_CHANNEL = "ai";
export const BRIEF_SIZE = 3;

let cached: Anthropic | null = null;
function client(): Anthropic {
  cached ??= new Anthropic();
  return cached;
}

const StoriesSchema = z.object({
  stories: z.array(
    z.object({
      headline: z
        .string()
        .describe(
          "Plain and specific, under ten words. Name the company or product.",
        ),
      reportedOn: z
        .string()
        .describe("The date it was first reported, as YYYY-MM-DD"),
      whatHappened: z
        .string()
        .describe(
          "Two or three sentences. What actually happened, with the numbers and names.",
        ),
      whyItMatters: z
        .string()
        .describe(
          "One or two sentences on what this changes for an ordinary person.",
        ),
      sourceName: z.string().describe("The outlet that reported it"),
      sourceUrl: z.string().describe("The article's URL, exactly as found"),
    }),
  ),
});

export type BriefStory = z.infer<typeof StoriesSchema>["stories"][number];

/** "2026-10-02" → "Oct 2", for the front of a title. */
function shortDate(iso: string): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? fromISODate(iso) : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Finds the three stories. Search first, then a separate pass turns the
 * findings into a clean list — the second pass may only use what the first
 * one actually found, which is what keeps invented stories out.
 */
async function findTopStories(
  channel: Channel,
  date: ISODate,
  exclude: string[],
): Promise<BriefStory[]> {
  const research = await client().messages.create({
    model: MODEL,
    max_tokens: 6000,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 12 }],
    messages: [
      {
        role: "user",
        content: [
          `Today is ${date}. Search the web and find the three biggest AI stories reported today or yesterday — nothing older. Search for yesterday's and today's dates by name, and for "this week" lists published today, so you see what is actually new.`,
          ``,
          `CHANNEL: ${channel.name}`,
          `WHAT IT COVERS: ${channel.mission}`,
          `AUDIENCE: ${channel.audience}`,
          ``,
          `Biggest means most consequential for an ordinary person — a launch they can use, a decision that changes what a company can do, a number that reframes the industry. Not the most hyped, and not opinion pieces.`,
          ``,
          `For each story give: what happened, with names and numbers; the date it was first reported; the outlet and the article URL; and one line on why it matters.`,
          ``,
          `Rules:`,
          `- Real and confirmed by at least two outlets. Something only one site claims is labelled as a single-source report, or dropped.`,
          `- Every story has a date. An undated story cannot be used.`,
          `- Prefer stories with a product, a filing, a price or a measurement in them over announcements of intent.`,
          `- Three different companies or topics. Not three angles on one story.`,
          `- One event per story: a launch, a filing, a ruling, a result. Never a roundup, a trend piece or "several companies did X".`,
          exclude.length
            ? `- Already covered on this channel, skip these and anything that is the same story: ${exclude.join(" | ")}`
            : ``,
          ``,
          `Report what you found as a plain list. No preamble.`,
        ].join("\n"),
      },
    ],
  });

  const findings = research.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!findings) return [];

  const floor = addDays(date, -1);
  const structured = await client().messages.parse({
    model: MODEL,
    max_tokens: 6000,
    output_config: { effort: "low", format: zodOutputFormat(StoriesSchema) },
    messages: [
      {
        role: "user",
        content: [
          `Here are research findings on today's AI news. Turn them into exactly the ${BRIEF_SIZE} biggest stories, most consequential first.`,
          ``,
          findings,
          ``,
          `Use only what appears above. Do not add a story, a number or a date that is not there. Copy each URL exactly as written. Each story is one named event at one company — leave out roundups and trend pieces. Leave out anything reported before ${floor}. If fewer than ${BRIEF_SIZE} stories qualify, return fewer.`,
        ].join("\n"),
      },
    ],
  });

  // The prompt asks for recent stories; this is what guarantees it. A story
  // older than yesterday is not news, however good it is.
  return (structured.parsed_output?.stories ?? [])
    .filter(
      (st) =>
        /^\d{4}-\d{2}-\d{2}$/.test(st.reportedOn) && st.reportedOn >= floor,
    )
    .slice(0, BRIEF_SIZE);
}

/** The stories written on one day, in the order they were written. */
export async function getBrief(date: ISODate): Promise<Item[]> {
  await ready();
  return db
    .select()
    .from(items)
    .where(
      and(
        eq(items.channelId, BRIEF_CHANNEL),
        eq(items.briefDate, date),
        eq(items.archived, false),
      ),
    )
    .orderBy(asc(items.createdAt));
}

/** Days that have a brief, newest first. */
export async function getBriefDates(limit = 14): Promise<ISODate[]> {
  await ready();
  const rows = await db
    .selectDistinct({ date: items.briefDate })
    .from(items)
    .where(
      and(
        eq(items.channelId, BRIEF_CHANNEL),
        isNotNull(items.briefDate),
        eq(items.archived, false),
      ),
    )
    .orderBy(desc(items.briefDate))
    .limit(limit);
  return rows.map((r) => r.date).filter((d): d is string => !!d);
}

async function writeScripts(channel: Channel, rows: Item[]): Promise<number> {
  const results = await Promise.allSettled(
    rows
      .filter((r) => !r.script)
      .map(async (item) => {
        const script = await generateScript({ channel, item });
        await db
          .update(items)
          .set({
            hook: script.hook,
            script: script.script,
            loopLine: script.loopLine,
            estimatedSeconds: Math.round(script.estimatedSeconds),
            caption: script.caption,
            hashtags: script.hashtags.join(" "),
            status: "scripted",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(items.id, item.id));
      }),
  );
  return results.filter((r) => r.status === "fulfilled").length;
}

export type BriefResult = {
  date: ISODate;
  stories: Item[];
  created: number;
  scripted: number;
  error?: string;
};

/**
 * Runs today's scan. Safe to call repeatedly: a day that already has its
 * three only gets any missing scripts written. `force` throws today's out
 * and scans again.
 */
export async function runDailyBrief(
  opts: { force?: boolean } = {},
): Promise<BriefResult> {
  await ready();
  const date = todayISO();
  const channel = await getChannel(BRIEF_CHANNEL);
  if (!channel)
    return {
      date,
      stories: [],
      created: 0,
      scripted: 0,
      error: "AI News channel not found.",
    };

  const now = new Date().toISOString();
  let existing = await getBrief(date);

  if (opts.force && existing.length) {
    await db
      .update(items)
      .set({ archived: true, archivedReason: "stale", updatedAt: now })
      .where(
        and(eq(items.channelId, BRIEF_CHANNEL), eq(items.briefDate, date)),
      );
    existing = [];
  }

  if (existing.length >= BRIEF_SIZE) {
    const scripted = await writeScripts(channel, existing);
    return { date, stories: await getBrief(date), created: 0, scripted };
  }

  // A quiet day can come back short. One more pass, told what it already has,
  // usually finds the next story down; a second miss is accepted as a short day.
  const covered = [
    ...(await getRecentTitles(BRIEF_CHANNEL)),
    ...existing.map((e) => e.title),
  ];
  const stories: BriefStory[] = [];
  for (
    let pass = 0;
    pass < 2 && existing.length + stories.length < BRIEF_SIZE;
    pass++
  ) {
    const found = await findTopStories(channel, date, [
      ...covered,
      ...stories.map((st) => st.headline),
    ]);
    for (const st of found) {
      if (!stories.some((x) => x.headline === st.headline)) stories.push(st);
    }
  }
  const have = new Set(existing.map((e) => e.title));
  const fresh = stories.filter(
    (s) => !have.has(`${shortDate(s.reportedOn)} — ${s.headline}`),
  );
  if (!fresh.length && !existing.length) {
    return {
      date,
      stories: [],
      created: 0,
      scripted: 0,
      error: "Couldn't find today's stories. Try again in a few minutes.",
    };
  }

  const version = profileVersion(channel);
  if (fresh.length) {
    await db.insert(items).values(
      fresh.slice(0, BRIEF_SIZE - existing.length).map((s) => ({
        id: randomUUID(),
        channelId: BRIEF_CHANNEL,
        title: `${shortDate(s.reportedOn)} — ${s.headline}`,
        formatKey: "what-happened",
        status: "idea" as const,
        premise: s.whatHappened,
        notes: `Why it matters: ${s.whyItMatters}\n\nSource: ${s.sourceName} — ${s.sourceUrl}`,
        sourceUrl: s.sourceUrl,
        briefDate: date,
        profileVersion: version,
        createdAt: now,
        updatedAt: now,
      })),
    );
  }

  const rows = await getBrief(date);
  const scripted = await writeScripts(channel, rows);
  return {
    date,
    stories: await getBrief(date),
    created: fresh.length,
    scripted,
  };
}
