import { eq, sql } from "drizzle-orm";
import { db, channels } from "./index";
import { BOOTSTRAP_DDL } from "./bootstrap";
import { CHANNEL_SEED, SUPERSEDED_MISSIONS } from "./channels";
import { SEED_CONTENT } from "./seed-content";
import { items } from "./schema";
import { profileVersion } from "@/lib/profile-version";
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
  const existing = await db.select({ channelId: items.channelId, title: items.title }).from(items);
  const seen = new Set(existing.map((e) => `${e.channelId}::${e.title}`));

  const fresh = SEED_CONTENT.filter(
    (entry) => versions.has(entry.channelId) && !seen.has(`${entry.channelId}::${entry.title}`),
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
      status: "scripted" as const,
      profileVersion: versions.get(entry.channelId) ?? null,
      createdAt: stamp,
      updatedAt: stamp,
    })),
  );
}

/**
 * Replaces profiles that still carry a superseded default. Seeding alone only
 * ever runs against an empty table, so without this a corrected profile would
 * never reach a database that already exists. Anything the user has edited is
 * left exactly as they wrote it.
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

    if (!SUPERSEDED_MISSIONS.has(current.mission)) continue;

    await db
      .update(channels)
      .set({
        // Renaming a channel has to reach existing databases too.
        name: row.name,
        mission: row.mission,
        audience: row.audience,
        voice: row.voice,
        formats: row.formats,
        neverDo: row.neverDo,
        newsDriven: row.newsDriven ?? false,
        cta: row.cta ?? null,
        productNotes: row.productNotes ?? null,
        styleNotes: row.styleNotes ?? null,
        scriptStyle: row.scriptStyle,
        sortOrder: row.sortOrder,
        logo: row.logo,
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
