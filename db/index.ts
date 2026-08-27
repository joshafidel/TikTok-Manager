import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

type DB = LibSQLDatabase<typeof schema>;

let instance: { db: DB; client: Client } | null = null;

/**
 * Built on first use, not at import time. Next.js imports this module while
 * collecting build output, where there is no database configured and no
 * writable filesystem — constructing eagerly would fail the build rather than
 * the request that actually needs a database.
 */
function init() {
  if (instance) return instance;

  const url = process.env.DATABASE_URL ?? "file:./data/app.db";

  // A deployed instance has a read-only filesystem, so the local-file default
  // cannot work there. Say so plainly instead of surfacing a driver-level ENOENT.
  if (process.env.NODE_ENV === "production" && url.startsWith("file:")) {
    throw new Error(
      "DATABASE_URL is not set. A deployed instance needs a hosted database — set " +
        "DATABASE_URL to your libsql:// URL and DATABASE_AUTH_TOKEN to its token.",
    );
  }

  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  instance = { db: drizzle(client, { schema }), client };
  return instance;
}

function lazy<T extends object>(pick: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const real = pick() as Record<string | symbol, unknown>;
      const value = real[prop];
      return typeof value === "function" ? value.bind(real) : value;
    },
  });
}

export const db = lazy<DB>(() => init().db);
export const client = lazy<Client>(() => init().client);

export * from "./schema";
