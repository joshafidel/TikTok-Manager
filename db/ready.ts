import { eq, sql } from "drizzle-orm";
import { db, channels } from "./index";
import { BOOTSTRAP_DDL } from "./bootstrap";
import { CHANNEL_SEED, SUPERSEDED_MISSIONS } from "./channels";

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
    return;
  }

  await refreshUntouchedProfiles();
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
    if (!current || !SUPERSEDED_MISSIONS.has(current.mission)) continue;

    await db
      .update(channels)
      .set({
        mission: row.mission,
        audience: row.audience,
        voice: row.voice,
        formats: row.formats,
        neverDo: row.neverDo,
        newsDriven: row.newsDriven ?? false,
        productNotes: row.productNotes ?? null,
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
