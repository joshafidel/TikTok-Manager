import { and, eq, inArray } from "drizzle-orm";
import { db, channels, items } from "@/db";
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
export async function pruneChannel(channelId: string, version: string): Promise<number> {
  const live = await db
    .select({
      id: items.id,
      fromUser: items.fromUser,
      profileVersion: items.profileVersion,
    })
    .from(items)
    .where(and(eq(items.channelId, channelId), eq(items.archived, false)));

  // A null stamp means it predates versioning, which makes it older than any
  // current profile — not exempt from being cleared.
  const stale = live.filter((i) => !i.fromUser && i.profileVersion !== version);
  if (!stale.length) return 0;

  await db
    .update(items)
    .set({ archived: true, updatedAt: new Date().toISOString() })
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
    dropped += await pruneChannel(channel.id, profileVersion(channel));
  }
  return dropped;
}
