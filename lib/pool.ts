import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { db, items } from "@/db";
import type { Item } from "@/db/schema";
import { generateIdeas, generateQuestions, generateScript } from "./claude";
import { profileVersion } from "./profile-version";
import { pruneChannel } from "./prune";
import { getChannel, getRecentTitles, getTopPerformers } from "./queries";
import { ready } from "@/db/ready";

/** How many scripted ideas each account keeps on hand. */
export const POOL_SIZE = 10;

/** Generating ten scripts in one request would blow the function timeout. */
export const SCRIPT_BATCH = 3;

const now = () => new Date().toISOString();

/**
 * The live pool: ideas waiting to be recorded, newest last so it reads as a queue.
 *
 * Clears out anything written under older rules first, so a stale entry is
 * never read and therefore never shown — not even for the one page load before
 * a replacement arrives.
 */
export async function getPool(channelId: string): Promise<Item[]> {
  await ready();
  const channel = await getChannel(channelId);
  if (channel) await pruneChannel(channelId, profileVersion(channel));
  return readPool(channelId);
}

/** The same read without the clear-out, for callers that have just done one. */
async function readPool(channelId: string): Promise<Item[]> {
  return db
    .select()
    .from(items)
    .where(
      and(
        eq(items.channelId, channelId),
        eq(items.archived, false),
        inArray(items.status, ["idea", "scripted"]),
      ),
    )
    // Your own ideas first — you asked for those, the rest are suggestions.
    .orderBy(desc(items.fromUser), asc(items.createdAt))
    .limit(POOL_SIZE * 2);
}

/** Tops the pool back up to POOL_SIZE. Ideas only — scripts follow in batches. */
export async function ensurePool(channelId: string, target = POOL_SIZE) {
  const channel = await getChannel(channelId);
  if (!channel) return { added: 0, error: "Channel not found." };

  const version = profileVersion(channel);
  const dropped = await pruneChannel(channelId, version);

  const pool = await readPool(channelId);
  const missing = target - pool.length;
  if (missing <= 0) return { added: 0, dropped };

  // A question channel collects prompts to ask strangers, not scripts.
  if (channel.mode === "questions") {
    const qs = await generateQuestions({
      channel,
      count: missing,
      existing: pool.map((p) => p.title),
    });
    if (!qs.length) return { added: 0, dropped };

    await db.insert(items).values(
      qs.map((q) => ({
        id: randomUUID(),
        channelId,
        title: q.question,
        realAnswer: q.realAnswer,
        fakeAnswer: q.fakeAnswer,
        status: "scripted" as const,
        profileVersion: version,
        createdAt: now(),
        updatedAt: now(),
      })),
    );
    return { added: qs.length, dropped };
  }

  // A source channel collects accounts to pull material from, not scripts.
  if (channel.mode === "sources") {
    const { findSources } = await import("./sources");
    const found = await findSources({
      channel,
      count: missing,
      existing: pool.map((p) => p.handle ?? p.title).filter(Boolean) as string[],
    });
    if (!found.length) return { added: 0, dropped };

    await db.insert(items).values(
      found.map((f) => ({
        id: randomUUID(),
        channelId,
        title: f.handle,
        handle: f.handle,
        sourceUrl: f.url,
        status: "scripted" as const,
        premise: f.posts,
        notes: `${f.whyItFits}\n\nFound on: ${f.foundAt}`,
        profileVersion: version,
        createdAt: now(),
        updatedAt: now(),
      })),
    );
    return { added: found.length, dropped };
  }

  const [recentTitles, topPerformers] = await Promise.all([
    getRecentTitles(channelId),
    getTopPerformers(channelId),
  ]);

  // A news channel needs real material in front of it, or it invents plausible
  // fiction — which is exactly what makes it read as fake.
  let newsDigest: string | undefined;
  if (channel.newsDriven) {
    const { getNewsDigest } = await import("./news");
    try {
      newsDigest = await getNewsDigest(channel);
    } catch {
      // Fall through without it rather than blocking the batch entirely.
    }
  }

  const generated = await generateIdeas({
    channel,
    count: missing,
    recentTitles,
    topPerformers,
    newsDigest,
  });

  // Discard anything that breaks the channel's own rules before it is ever shown.
  const { auditIdeas } = await import("./audit");
  const { kept: ideas, rejected } = await auditIdeas(channel, generated);
  if (!ideas.length) return { added: 0, dropped, rejected };

  await db.insert(items).values(
    ideas.map((idea) => ({
      id: randomUUID(),
      channelId,
      title: idea.title,
      formatKey: idea.formatKey,
      status: "idea" as const,
      premise: idea.premise,
      hook: idea.hook,
      notes: idea.whyItWorks,
      profileVersion: version,
      createdAt: now(),
      updatedAt: now(),
    })),
  );

  return { added: ideas.length, dropped, rejected };
}

/** Pool entries still waiting on a script. */
export async function unscripted(channelId: string): Promise<Item[]> {
  await ready();
  return db
    .select()
    .from(items)
    .where(
      and(
        eq(items.channelId, channelId),
        eq(items.archived, false),
        eq(items.status, "idea"),
        or(isNull(items.script), eq(items.script, "")),
      ),
    )
    .orderBy(asc(items.createdAt));
}

/**
 * Writes the next few scripts. The caller repeats until `remaining` is 0, which
 * keeps every individual request well inside the function time limit.
 */
export async function writeNextScripts(channelId: string, batch = SCRIPT_BATCH) {
  const channel = await getChannel(channelId);
  if (!channel) return { written: 0, remaining: 0, error: "Channel not found." };

  if (channel.mode !== "scripts") return { written: 0, remaining: 0 };

  const pending = await unscripted(channelId);
  if (!pending.length) return { written: 0, remaining: 0 };

  const slice = pending.slice(0, batch);

  const results = await Promise.allSettled(
    slice.map(async (item) => {
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
          updatedAt: now(),
        })
        .where(eq(items.id, item.id));
    }),
  );

  const written = results.filter((r) => r.status === "fulfilled").length;
  const failure = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;

  return {
    written,
    remaining: Math.max(0, pending.length - written),
    // Surface one failure rather than looping forever on a script that won't write.
    error: failure ? String(failure.reason?.message ?? failure.reason) : undefined,
  };
}
