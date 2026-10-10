import { and, eq, inArray } from "drizzle-orm";
import { db, channels, items } from "@/db";
import type { Channel } from "@/db/schema";
import { profileVersion } from "./profile-version";

/**
 * Removes entries that were written under rules that no longer apply.
 *
 * This used to happen only as a side effect of topping a channel back up,
 * which meant it only happened if someone had the page open, the browser ran
 * the top-up, and the generation that followed succeeded. Any one of those
 * failing left the old entries sitting on screen — which is exactly what kept
 * happening.
 *
 * So it is unconditional now, it runs on the server, and it runs before
 * anything is read: on startup for every channel, and again on every read of
 * any channel's list. Clearing out is never blocked by whether a replacement
 * can be written.
 *
 * Ideas typed in by hand are kept. Those are the user's, not ours.
 */
export async function pruneChannel(channel: Channel): Promise<number> {
  const version = profileVersion(channel);
  const live = await db
    .select({
      id: items.id,
      fromUser: items.fromUser,
      sourceUrl: items.sourceUrl,
      briefDate: items.briefDate,
      createdAt: items.createdAt,
      profileVersion: items.profileVersion,
    })
    .from(items)
    .where(and(eq(items.channelId, channel.id), eq(items.archived, false)));

  // A null stamp means it predates versioning, which makes it older than any
  // current profile — not exempt from being cleared.
  //
  // On a scripts channel, an entry built on a real story (it has a source, or
  // the daily scan wrote it) is not cleared: the story is still true, only the
  // words are out of date, so it keeps its place and the script is rewritten.
  // An invented idea has nothing under it and goes.
  // Only recent ones, though: a story from more than a week ago is not worth
  // rewriting, because it is no longer news.
  const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const grounded = (i: {
    sourceUrl: string | null;
    briefDate: string | null;
    createdAt: string;
  }) =>
    channel.mode === "scripts" &&
    (!!i.sourceUrl || !!i.briefDate) &&
    i.createdAt >= cutoff;
  const stale = live.filter(
    (i) => !i.fromUser && !grounded(i) && i.profileVersion !== version,
  );
  if (!stale.length) return 0;

  await db
    .update(items)
    .set({
      archived: true,
      archivedReason: "stale",
      updatedAt: new Date().toISOString(),
    })
    .where(
      inArray(
        items.id,
        stale.map((i) => i.id),
      ),
    );

  return stale.length;
}

/** Every channel at once, for startup. */
export async function pruneAllChannels(): Promise<number> {
  const all = await db.select().from(channels);
  let dropped = 0;
  for (const channel of all) {
    dropped += await pruneChannel(channel);
  }
  return dropped;
}
