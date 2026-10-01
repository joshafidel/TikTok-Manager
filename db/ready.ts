import { eq, sql } from "drizzle-orm";
import { db, channels } from "./index";
import { BOOTSTRAP_DDL } from "./bootstrap";
import { CHANNEL_SEED } from "./channels";
import { SEED_CONTENT } from "./seed-content";
import { items } from "./schema";
import { profileVersion } from "@/lib/profile-version";
import { pruneAllChannels } from "@/lib/prune";
import { randomUUID } from "node:crypto";

/**
 * First-run setup, done by the app itself.
 *
 * A fresh deployment points at an empty database, and asking someone to run
 * migration commands from a terminal before the site works is a bad first
 * experience. So the app creates its own tables and loads the channel profiles
 * the first time it touches the database.
 *
 * Every statement is idempotent, because on serverless this runs again on every
 * cold start and several instances may do it at once.
 */
let started: Promise<void> | null = null;

/**
 * `CREATE TABLE IF NOT EXISTS` is re-runnable, but `ALTER TABLE ... ADD COLUMN`
 * is not — SQLite has no IF NOT EXISTS for it. Since this runs on every cold
 * start, swallow exactly the "already applied" errors and let anything else
 * surface.
 */
const ALREADY_APPLIED = /duplicate column name|already exists/i;

/** The driver reports the real SQLite message on `cause`, not on the error itself. */
function isAlreadyApplied(err: unknown): boolean {
  const e = err as { message?: string; cause?: { message?: string } } | null;
  return ALREADY_APPLIED.test(`${e?.message ?? ""} ${e?.cause?.message ?? ""}`);
}

async function bootstrap(): Promise<void> {
  for (const statement of BOOTSTRAP_DDL) {
    try {
      await db.run(sql.raw(statement));
    } catch (err) {
      if (!isAlreadyApplied(err)) throw err;
    }
  }

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(channels);

  // Only seed an empty table — never overwrite profiles the user has edited.
  if (Number(n) === 0) {
    for (const row of CHANNEL_SEED) {
      await db.insert(channels).values(row).onConflictDoNothing();
    }
  } else {
    await refreshUntouchedProfiles();
  }

  // Runs on both paths. Returning early after seeding channels meant a fresh
  // database never received any of this content.
  await installSeedContent();

  // Clear out everything written under rules that have since changed, for every
  // channel, without waiting for anyone to open the page. Runs after the
  // profile refresh above so it compares against the corrected profiles, and
  // after seeding so today's content is stamped current and survives.
  await pruneAllChannels();
}

/**
 * Puts content written in conversation into the database.
 *
 * Inserted once per entry and matched on title, so redeploying does not
 * duplicate anything and an entry the user has deleted stays deleted. Stamped
 * with the current profile, so it ages out under the same rules as generated
 * work rather than being privileged.
 */
async function installSeedContent(): Promise<void> {
  if (!SEED_CONTENT.length) return;

  const all = await db.select().from(channels);
  const versions = new Map(all.map((c) => [c.id, profileVersion(c)]));
  const existing = await db
    .select({
      id: items.id,
      channelId: items.channelId,
      title: items.title,
      archived: items.archived,
      archivedReason: items.archivedReason,
      profileVersion: items.profileVersion,
    })
    .from(items);
  const byKey = new Map(existing.map((e) => [`${e.channelId}::${e.title}`, e]));

  // Content shipped with this build was written against today's rules, so a
  // copy sitting in the database under an older stamp is brought up to date
  // rather than cleared out a moment later — including one that was already
  // cleared out, which is housekeeping rather than a decision.
  //
  // An entry turned down on purpose stays gone. Rows archived before that
  // distinction was recorded carry no reason, and the shipped version wins for
  // those, once.
  for (const entry of SEED_CONTENT) {
    const version = versions.get(entry.channelId);
    const row = byKey.get(`${entry.channelId}::${entry.title}`);
    if (!version || !row || row.archivedReason === "rejected") continue;
    if (!row.archived && row.profileVersion === version) continue;
    await db
      .update(items)
      .set({ archived: false, archivedReason: null, profileVersion: version })
      .where(eq(items.id, row.id));
  }

  const fresh = SEED_CONTENT.filter(
    (entry) => versions.has(entry.channelId) && !byKey.has(`${entry.channelId}::${entry.title}`),
  );
  if (!fresh.length) return;

  const stamp = new Date().toISOString();
  await db.insert(items).values(
    fresh.map((entry) => ({
      id: randomUUID(),
      channelId: entry.channelId,
      title: entry.title,
      hook: entry.hook ?? null,
      premise: entry.premise ?? null,
      script: entry.script ?? null,
      loopLine: entry.loopLine ?? null,
      estimatedSeconds: entry.estimatedSeconds ?? null,
      realAnswer: entry.realAnswer ?? null,
      fakeAnswer: entry.fakeAnswer ?? null,
      handle: entry.handle ?? null,
      sourceUrl: entry.sourceUrl ?? null,
      notes: entry.notes ?? null,
      status: "scripted" as const,
      profileVersion: versions.get(entry.channelId) ?? null,
      createdAt: stamp,
      updatedAt: stamp,
    })),
  );
}

/**
 * Makes the channel profiles in the database match the ones in the code.
 *
 * The profiles are the product, and they are corrected in conversation — so
 * the code has to be the source of truth for them, or a correction never
 * arrives. Previously only the mission was replaced, and only when the old one
 * had been explicitly listed as retired: a change to any other part of a
 * profile simply never reached a database that already existed, which is why
 * entries written under old rules kept surviving.
 *
 * The one exception is a channel someone has edited by hand on the Channels
 * screen. That sets a flag, and from then on the code leaves it alone.
 */
async function refreshUntouchedProfiles(): Promise<void> {
  const existing = await db.select().from(channels);

  for (const row of CHANNEL_SEED) {
    const current = existing.find((c) => c.id === row.id);

    // A channel added after this database was seeded has to be inserted, or it
    // would never appear on an instance that is already running.
    if (!current) {
      await db.insert(channels).values(row).onConflictDoNothing();
      continue;
    }

    if (current.userEdited) continue;

    await db
      .update(channels)
      .set({
        name: row.name,
        mission: row.mission,
        audience: row.audience,
        voice: row.voice,
        formats: row.formats,
        neverDo: row.neverDo,
        cta: row.cta ?? null,
        productNotes: row.productNotes ?? null,
        styleNotes: row.styleNotes ?? null,
        mode: row.mode ?? ("scripts" as const),
        scriptStyle: row.scriptStyle,
        cadencePerWeek: row.cadencePerWeek,
        targetDepth: row.targetDepth,
        recordDays: row.recordDays,
        sortOrder: row.sortOrder,
        logo: row.logo,
        newsDriven: row.newsDriven ?? false,
      })
      .where(eq(channels.id, row.id));
  }
}

export function ready(): Promise<void> {
  started ??= bootstrap().catch((err) => {
    // Let the next request retry rather than caching a failure forever —
    // a cold-start race or a brief network blip shouldn't wedge the instance.
    started = null;
    throw err;
  });
  return started;
}
