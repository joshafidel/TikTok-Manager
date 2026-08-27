import { db, channels } from "./index";
import { CHANNEL_SEED } from "./channels";

for (const row of CHANNEL_SEED) {
  await db.insert(channels).values(row).onConflictDoUpdate({ target: channels.id, set: row });
}

console.log(`Seeded ${CHANNEL_SEED.length} channels: ${CHANNEL_SEED.map((r) => r.id).join(", ")}`);
process.exit(0);
