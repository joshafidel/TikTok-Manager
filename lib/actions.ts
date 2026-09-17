"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, channels, items, clips, performance } from "@/db";
import type { Status } from "@/db/schema";
import { generateIdeas, generateScript, GenerationError } from "./claude";
import { getChannel, getClip, getItem, getRecentTitles, getTopPerformers } from "./queries";
import { todayISO } from "./dates";

function now() {
  return new Date().toISOString();
}

function refreshAll() {
  revalidatePath("/", "layout");
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function num(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === null) return null;
  const n = Number(v.replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/* -------------------------------------------------------------------------- */
/* Items                                                                      */
/* -------------------------------------------------------------------------- */

export async function createItem(fd: FormData) {
  const channelId = str(fd, "channelId");
  const title = str(fd, "title");
  if (!channelId || !title) return;

  const id = randomUUID();
  await db.insert(items).values({
    id,
    channelId,
    title,
    formatKey: str(fd, "formatKey"),
    premise: str(fd, "premise"),
    status: "idea",
    recordOn: str(fd, "recordOn"),
    postOn: str(fd, "postOn"),
    createdAt: now(),
    updatedAt: now(),
  });
  refreshAll();
  redirect(`/items/${id}`);
}

export async function updateItem(fd: FormData) {
  const id = str(fd, "id");
  if (!id) return;

  await db
    .update(items)
    .set({
      title: str(fd, "title") ?? undefined,
      formatKey: str(fd, "formatKey"),
      premise: str(fd, "premise"),
      hook: str(fd, "hook"),
      script: str(fd, "script"),
      shotNotes: str(fd, "shotNotes"),
      caption: str(fd, "caption"),
      hashtags: str(fd, "hashtags"),
      recordOn: str(fd, "recordOn"),
      postOn: str(fd, "postOn"),
      postTime: str(fd, "postTime"),
      assetUrl: str(fd, "assetUrl"),
      postUrl: str(fd, "postUrl"),
      notes: str(fd, "notes"),
      updatedAt: now(),
    })
    .where(eq(items.id, id));
  refreshAll();
}

export async function setStatus(fd: FormData) {
  const id = str(fd, "id");
  const status = str(fd, "status") as Status | null;
  if (!id || !status) return;

  const patch: Record<string, unknown> = { status, updatedAt: now() };
  // Posting without a recorded post date is almost always an oversight.
  if (status === "posted") {
    const item = await getItem(id);
    if (item && !item.postOn) patch.postOn = todayISO();
  }
  await db.update(items).set(patch).where(eq(items.id, id));
  refreshAll();
}

export async function archiveItem(fd: FormData) {
  const id = str(fd, "id");
  if (!id) return;
  await db.update(items).set({ archived: true, updatedAt: now() }).where(eq(items.id, id));
  refreshAll();
}

export async function deleteItem(fd: FormData) {
  const id = str(fd, "id");
  if (!id) return;
  await db.delete(performance).where(eq(performance.itemId, id));
  await db.delete(items).where(eq(items.id, id));
  refreshAll();
  redirect("/pipeline");
}

/* -------------------------------------------------------------------------- */
/* Generation                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Generated ideas land straight in the channel's idea list. Rejecting is one
 * click — the batch is meant to be culled, not curated in a modal.
 */
export async function runIdeaGeneration(fd: FormData) {
  const channelId = str(fd, "channelId");
  if (!channelId) return { error: "No channel." };

  const channel = await getChannel(channelId);
  if (!channel) return { error: "Channel not found." };

  const count = Math.min(Math.max(num(fd, "count") ?? 10, 1), 25);

  try {
    const [recentTitles, topPerformers] = await Promise.all([
      getRecentTitles(channelId),
      getTopPerformers(channelId),
    ]);

    const ideas = await generateIdeas({
      channel,
      count,
      recentTitles,
      topPerformers,
      steer: str(fd, "steer") ?? undefined,
    });

    if (ideas.length) {
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
    }
    refreshAll();
    return { ok: `Generated ${ideas.length} ideas.` };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

export async function runScriptGeneration(fd: FormData) {
  const id = str(fd, "id");
  if (!id) return { error: "No item." };

  const item = await getItem(id);
  if (!item) return { error: "Item not found." };

  const channel = await getChannel(item.channelId);
  if (!channel) return { error: "Channel not found." };

  try {
    const clip = item.clipId ? await getClip(item.clipId) : null;
    const result = await generateScript({
      channel,
      item,
      clip: clip ? { sourceUrl: clip.sourceUrl, premise: clip.premise } : null,
    });

    await db
      .update(items)
      .set({
        hook: result.hook,
        script: result.script,
        loopLine: result.loopLine,
        estimatedSeconds: Math.round(result.estimatedSeconds),
        shotNotes: result.shotNotes,
        caption: result.caption,
        hashtags: result.hashtags.join(" "),
        // Only advance the pipeline; never walk a filmed video back to scripted.
        status: item.status === "idea" ? "scripted" : item.status,
        updatedAt: now(),
      })
      .where(eq(items.id, id));

    refreshAll();
    return { ok: "Script written." };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

function errorMessage(err: unknown): string {
  if (err instanceof GenerationError) return err.message;
  if (err instanceof Error) return `Generation failed: ${err.message}`;
  return "Generation failed.";
}

/* -------------------------------------------------------------------------- */
/* Clips                                                                      */
/* -------------------------------------------------------------------------- */

export async function addClip(fd: FormData) {
  const channelId = str(fd, "channelId");
  const sourceUrl = str(fd, "sourceUrl");
  if (!channelId || !sourceUrl) return;

  await db.insert(clips).values({
    id: randomUUID(),
    channelId,
    sourceUrl,
    premise: str(fd, "premise"),
    source: str(fd, "source"),
    status: "queued",
    addedAt: now(),
  });
  refreshAll();
}

export async function setClipStatus(fd: FormData) {
  const id = str(fd, "id");
  const status = str(fd, "status") as "queued" | "used" | "rejected" | null;
  if (!id || !status) return;
  await db.update(clips).set({ status }).where(eq(clips.id, id));
  refreshAll();
}

export async function deleteClip(fd: FormData) {
  const id = str(fd, "id");
  if (!id) return;
  await db.delete(clips).where(eq(clips.id, id));
  refreshAll();
}

/** Pull a clip out of the queue and turn it into a video in the pipeline. */
export async function clipToItem(fd: FormData) {
  const clipId = str(fd, "id");
  if (!clipId) return;

  const clip = await getClip(clipId);
  if (!clip) return;

  const itemId = randomUUID();
  await db.insert(items).values({
    id: itemId,
    channelId: clip.channelId,
    title: clip.premise ?? "Reaction",
    status: "idea",
    premise: clip.premise,
    clipId: clip.id,
    createdAt: now(),
    updatedAt: now(),
  });
  await db.update(clips).set({ status: "used", usedByItemId: itemId }).where(eq(clips.id, clipId));
  refreshAll();
  redirect(`/items/${itemId}`);
}

/* -------------------------------------------------------------------------- */
/* Channels & performance                                                     */
/* -------------------------------------------------------------------------- */

export async function updateChannel(fd: FormData) {
  const id = str(fd, "id");
  if (!id) return;

  const recordDays = fd
    .getAll("recordDays")
    .map((d) => Number(d))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);

  await db
    .update(channels)
    .set({
      name: str(fd, "name") ?? undefined,
      handle: str(fd, "handle"),
      mission: str(fd, "mission") ?? undefined,
      audience: str(fd, "audience") ?? undefined,
      voice: str(fd, "voice") ?? undefined,
      cta: str(fd, "cta"),
      neverDo: (str(fd, "neverDo") ?? "")
        .split("\n")
        .map((l) => l.replace(/^[-*]\s*/, "").trim())
        .filter(Boolean),
      cadencePerWeek: num(fd, "cadencePerWeek") ?? undefined,
      targetDepth: num(fd, "targetDepth") ?? undefined,
      recordDays,
    })
    .where(eq(channels.id, id));
  refreshAll();
}

export async function logPerformance(fd: FormData) {
  const itemId = str(fd, "itemId");
  if (!itemId) return;

  await db.insert(performance).values({
    id: randomUUID(),
    itemId,
    views: num(fd, "views"),
    likes: num(fd, "likes"),
    comments: num(fd, "comments"),
    shares: num(fd, "shares"),
    saves: num(fd, "saves"),
    follows: num(fd, "follows"),
    recordedAt: now(),
  });
  refreshAll();
}

export async function bulkArchiveIdeas(fd: FormData) {
  const channelId = str(fd, "channelId");
  if (!channelId) return;
  await db
    .update(items)
    .set({ archived: true, updatedAt: now() })
    .where(and(eq(items.channelId, channelId), eq(items.status, "idea")));
  refreshAll();
}

/* -------------------------------------------------------------------------- */
/* Form-state wrappers                                                        */
/* -------------------------------------------------------------------------- */

export type ActionResult = { ok?: string; error?: string } | null;

export async function ideaFormAction(
  _prev: ActionResult,
  fd: FormData,
): Promise<ActionResult> {
  return runIdeaGeneration(fd);
}

export async function scriptFormAction(
  _prev: ActionResult,
  fd: FormData,
): Promise<ActionResult> {
  return runScriptGeneration(fd);
}

/* -------------------------------------------------------------------------- */
/* Session                                                                    */
/* -------------------------------------------------------------------------- */

export async function signOut() {
  const { cookies } = await import("next/headers");
  const { SESSION_COOKIE } = await import("./auth");
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

/* -------------------------------------------------------------------------- */
/* Idea pool                                                                  */
/* -------------------------------------------------------------------------- */

export type PoolResult = { added?: number; error?: string };

/** Tops the account back up to ten ideas. Scripts follow via writeScriptsAction. */
export async function ensurePoolAction(channelId: string): Promise<PoolResult> {
  try {
    const { ensurePool } = await import("./pool");
    const r = await ensurePool(channelId);
    refreshAll();
    return r;
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

export type ScriptBatchResult = { written: number; remaining: number; error?: string };

/** Writes the next few scripts. The client repeats until nothing remains. */
export async function writeScriptsAction(channelId: string): Promise<ScriptBatchResult> {
  try {
    const { writeNextScripts } = await import("./pool");
    const r = await writeNextScripts(channelId);
    refreshAll();
    return r;
  } catch (err) {
    return { written: 0, remaining: 0, error: errorMessage(err) };
  }
}

/**
 * Crosses an idea off. Rejected ideas are archived; recorded ones move into the
 * pipeline so they keep their script. Either way a replacement idea is drawn so
 * the account always shows ten.
 */
export async function crossOffIdea(fd: FormData): Promise<void> {
  const id = str(fd, "id");
  const reason = str(fd, "reason");
  if (!id) return;

  const item = await getItem(id);
  if (!item) return;

  if (reason === "recorded") {
    await db
      .update(items)
      .set({ status: "recorded", recordOn: todayISO(), updatedAt: now() })
      .where(eq(items.id, id));
  } else {
    await db.update(items).set({ archived: true, updatedAt: now() }).where(eq(items.id, id));
  }

  // Draw the replacement idea now; its script is written by the pool filler on
  // the next render, which keeps this click from waiting on two model calls.
  await ensurePoolAction(item.channelId);
  refreshAll();
}

/**
 * Takes an idea you typed and writes the script for it. Yours go to the top of
 * the list, above the generated suggestions.
 */
export async function scriptMyIdea(input: {
  channelId: string;
  idea: string;
}): Promise<{ id?: string; error?: string }> {
  const idea = input.idea.trim();
  if (!idea) return { error: "Type an idea first." };

  const channel = await getChannel(input.channelId);
  if (!channel) return { error: "Channel not found." };

  const id = randomUUID();
  try {
    await db.insert(items).values({
      id,
      channelId: input.channelId,
      // A one-line idea doubles as its working title until the script names it.
      title: idea.length > 70 ? `${idea.slice(0, 67)}…` : idea,
      premise: idea,
      status: "idea",
      fromUser: true,
      createdAt: now(),
      updatedAt: now(),
    });

    const { generateScript } = await import("./claude");
    const item = await getItem(id);
    if (!item) return { error: "Could not save the idea." };

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
      .where(eq(items.id, id));

    refreshAll();
    return { id };
  } catch (err) {
    // Keep the idea even if the script failed — the pool filler retries it.
    refreshAll();
    return { error: errorMessage(err) };
  }
}
