import { sql } from "drizzle-orm";
import { db, channels } from "./index";
import { BOOTSTRAP_DDL } from "./bootstrap";
import { CHANNEL_SEED } from "./channels";

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

async function bootstrap(): Promise<void> {
  for (const statement of BOOTSTRAP_DDL) {
    await db.run(sql.raw(statement));
  }

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(channels);

  // Only seed an empty table — never overwrite profiles the user has edited.
  if (Number(n) === 0) {
    for (const row of CHANNEL_SEED) {
      await db.insert(channels).values(row).onConflictDoNothing();
    }
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
