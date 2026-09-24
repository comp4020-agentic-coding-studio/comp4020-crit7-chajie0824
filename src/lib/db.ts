import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { courseSeed } from "./courses-seed";
import { type Course, type PlanEntry, courses, planEntries, settings } from "./schema";

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

// currentTerm starts wherever the student actually is; seeded once, then
// only ever changed via setCurrentTerm.
db.insert(settings).values({ id: 1, currentTerm: 3 }).onConflictDoNothing().run();

export type { Course, PlanEntry };

export function listCourses(): Course[] {
  return db.select().from(courses).all();
}

export function listPlan(): PlanEntry[] {
  return db.select().from(planEntries).all();
}

export function getCurrentTerm(): number {
  return db.select().from(settings).get()?.currentTerm ?? 1;
}

export function setCurrentTerm(term: number): void {
  db.update(settings).set({ currentTerm: term }).where(eq(settings.id, 1)).run();
}

// A slot is (term, position); the unique index on that pair is what makes
// this an upsert rather than a second row piling into the slot.
export function assignCourse(term: number, position: number, courseCode: string): PlanEntry {
  return db
    .insert(planEntries)
    .values({ term, position, courseCode })
    .onConflictDoUpdate({
      target: [planEntries.term, planEntries.position],
      set: { courseCode },
    })
    .returning()
    .get();
}

export function clearSlot(term: number, position: number): void {
  db
    .delete(planEntries)
    .where(and(eq(planEntries.term, term), eq(planEntries.position, position)))
    .run();
}
