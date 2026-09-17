import "server-only";
import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import { db, items } from "@/db";
import type { Item } from "@/db/schema";
import { generateIdeas, generateScript } from "./claude";
import { getChannel, getRecentTitles, getTopPerformers } from "./queries";
import { ready } from "@/db/ready";

/** How many scripted ideas each account keeps on hand. */
export const POOL_SIZE = 10;

/** Generating ten scripts in one request would blow the function timeout. */
export const SCRIPT_BATCH = 3;

const now = () => new Date().toISOString();

/** The live pool: ideas waiting to be recorded, newest last so it reads as a queue. */
export async function getPool(channelId: string): Promise<Item[]> {
  await ready();
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
    .orderBy(asc(items.createdAt))
    .limit(POOL_SIZE * 2);
}

/** Tops the pool back up to POOL_SIZE. Ideas only — scripts follow in batches. */
export async function ensurePool(channelId: string, target = POOL_SIZE) {
  const channel = await getChannel(channelId);
  if (!channel) return { added: 0, error: "Channel not found." };

  const pool = await getPool(channelId);
  const missing = target - pool.length;
  if (missing <= 0) return { added: 0 };

  const [recentTitles, topPerformers] = await Promise.all([
    getRecentTitles(channelId),
    getTopPerformers(channelId),
  ]);

  const ideas = await generateIdeas({ channel, count: missing, recentTitles, topPerformers });
  if (!ideas.length) return { added: 0 };

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
      createdAt: now(),
      updatedAt: now(),
    })),
  );

  return { added: ideas.length };
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
          shotNotes: script.shotNotes,
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
