import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { courseSeed } from "./courses-seed";
import { type Course, type PlanEntry, courses, planEntries } from "./schema";

// One SQLite file is the app's whole persistent state. In production
// fly.toml points DATABASE_PATH at the machine's volume (/data), which is
// how state survives a reload and a redeploy; locally it defaults to an
// untracked file in .data/.
const path = process.env.DATABASE_PATH ?? "./.data/app.db";
mkdirSync(dirname(path), { recursive: true });

const client = new Database(path);
client.pragma("journal_mode = WAL");

export const db = drizzle(client);

// Migrations run at boot, on whatever machine holds the volume — the
// recommended shape for SQLite on Fly, where there's no separate machine to
// run them from. The flow: edit src/lib/schema.ts, `pnpm db:generate`,
// commit the migration it writes to drizzle/.
migrate(db, { migrationsFolder: "./drizzle" });

// The catalogue is fixed content, not user data — re-seeding on every boot
// (skipping rows that already exist) is simpler than a one-off migration
// step and lets editing courseSeed.ts take effect on the next deploy.
db.insert(courses).values([...courseSeed]).onConflictDoNothing().run();

export type { Course, PlanEntry };

export function listCourses(): Course[] {
  return db.select().from(courses).all();
}

export function listPlan(): PlanEntry[] {
  return db.select().from(planEntries).all();
}

// A slot is (year, semester, position); the unique index on that triple is
// what makes this an upsert rather than a second row piling into the slot.
export function assignCourse(year: number, semester: string, position: number, courseCode: string): PlanEntry {
  return db
    .insert(planEntries)
    .values({ year, semester, position, courseCode })
    .onConflictDoUpdate({
      target: [planEntries.year, planEntries.semester, planEntries.position],
      set: { courseCode },
    })
    .returning()
    .get();
}

export function clearSlot(year: number, semester: string, position: number): void {
  db
    .delete(planEntries)
    .where(and(eq(planEntries.year, year), eq(planEntries.semester, semester), eq(planEntries.position, position)))
    .run();
}
