import { migrate } from "drizzle-orm/libsql/migrator";
import { mkdirSync } from "node:fs";
import { db } from "./index";

mkdirSync("data", { recursive: true });

await migrate(db, { migrationsFolder: "./drizzle" });
console.log("Migrations applied.");
process.exit(0);
