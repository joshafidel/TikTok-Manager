import "server-only";
import { and, desc, eq, gte, inArray, lte, ne, or, sql } from "drizzle-orm";
import { db, channels, items, clips, performance } from "@/db";
import type { Channel, Item, Status } from "@/db/schema";
import { ready } from "@/db/ready";
import type { ISODate } from "./dates";

/** Statuses that count as a banked, ready-to-post video. */
export const READY_STATUSES: Status[] = ["edited", "scheduled"];

export async function getChannels(): Promise<Channel[]> {
  await ready();
  return db.select().from(channels).orderBy(channels.sortOrder);
}

export async function getChannel(id: string): Promise<Channel | undefined> {
  await ready();
  const [row] = await db.select().from(channels).where(eq(channels.id, id));
  return row;
}

const live = and(eq(items.archived, false));

export async function getItem(id: string): Promise<Item | undefined> {
  await ready();
  const [row] = await db.select().from(items).where(eq(items.id, id));
  return row;
}

/** Everything happening on one date — filming and posting are different jobs. */
export async function getDay(date: ISODate) {
  await ready();
  const rows = await db
    .select()
    .from(items)
    .where(and(live, or(eq(items.recordOn, date), eq(items.postOn, date))));

  return {
    recording: rows.filter((r) => r.recordOn === date && r.status !== "posted"),
    posting: rows.filter((r) => r.postOn === date),
  };
}

export async function getItemsInRange(start: ISODate, end: ISODate): Promise<Item[]> {
  await ready();
  return db
    .select()
    .from(items)
    .where(
      and(
        live,
        or(
          and(gte(items.recordOn, start), lte(items.recordOn, end)),
          and(gte(items.postOn, start), lte(items.postOn, end)),
        ),
      ),
    );
}

/**
 * How many edited videos are banked per channel. When this drops below the
 * channel's target the calendar stops suggesting ideas and starts asking for a
 * record session — the single number that keeps a multi-channel operation alive.
 */
export async function getDepths(): Promise<Record<string, number>> {
  await ready();
  const rows = await db
    .select({ channelId: items.channelId, n: sql<number>`count(*)` })
    .from(items)
    .where(and(live, inArray(items.status, READY_STATUSES)))
    .groupBy(items.channelId);
  return Object.fromEntries(rows.map((r) => [r.channelId, Number(r.n)]));
}

export async function getBoard(): Promise<Item[]> {
  await ready();
  return db
    .select()
    .from(items)
    .where(and(live, ne(items.status, "posted")))
    .orderBy(items.postOn, items.createdAt);
}

export async function getItemsByChannel(channelId: string, limit = 200): Promise<Item[]> {
  await ready();
  return db
    .select()
    .from(items)
    .where(and(live, eq(items.channelId, channelId)))
    .orderBy(desc(items.createdAt))
    .limit(limit);
}

export async function getIdeas(channelId: string): Promise<Item[]> {
  await ready();
  return db
    .select()
    .from(items)
    .where(and(live, eq(items.channelId, channelId), eq(items.status, "idea")))
    .orderBy(desc(items.createdAt));
}

export async function getClips(channelId?: string) {
  await ready();
  const where = channelId ? eq(clips.channelId, channelId) : undefined;
  return db.select().from(clips).where(where).orderBy(desc(clips.addedAt));
}

export async function getClip(id: string) {
  await ready();
  const [row] = await db.select().from(clips).where(eq(clips.id, id));
  return row;
}

export async function getPerformance(itemId: string) {
  await ready();
  return db
    .select()
    .from(performance)
    .where(eq(performance.itemId, itemId))
    .orderBy(desc(performance.recordedAt));
}

/** Titles that actually landed — fed back into idea generation. */
export async function getTopPerformers(channelId: string, limit = 5): Promise<string[]> {
  await ready();
  const rows = await db
    .select({ title: items.title, views: performance.views })
    .from(performance)
    .innerJoin(items, eq(items.id, performance.itemId))
    .where(eq(items.channelId, channelId))
    .orderBy(desc(performance.views))
    .limit(limit);
  return rows.filter((r) => r.views != null).map((r) => r.title);
}

export async function getRecentTitles(channelId: string, limit = 40): Promise<string[]> {
  await ready();
  const rows = await db
    .select({ title: items.title })
    .from(items)
    .where(and(live, eq(items.channelId, channelId)))
    .orderBy(desc(items.createdAt))
    .limit(limit);
  return rows.map((r) => r.title);
}
