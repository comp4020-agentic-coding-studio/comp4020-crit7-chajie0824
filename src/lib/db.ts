import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { and, eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { courseSeed } from "./courses-seed";
import { incompatibilitySeed } from "./incompatibilities-seed";
import { prerequisiteSeed } from "./prerequisites-seed";
import {
  type Course,
  type Incompatibility,
  type PlanEntry,
  type Prerequisite,
  courses,
  incompatibilities,
  planEntries,
  prerequisites,
  settings,
} from "./schema";

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

// The catalogue is fixed content, not user data — upserting on every boot
// (instead of insert-if-missing) is simpler than a one-off migration step
// and means editing courseSeed.ts (including a field on an existing row,
// like adding `rating`) always takes effect on the next deploy.
for (const course of courseSeed) {
  db
    .insert(courses)
    .values(course)
    .onConflictDoUpdate({
      target: courses.code,
      set: {
        title: course.title,
        units: course.units,
        semester: course.semester,
        rating: course.rating,
        termSpan: course.termSpan,
      },
    })
    .run();
}

// currentTerm starts wherever the student actually is; seeded once, then
// only ever changed via setCurrentTerm.
db.insert(settings).values({ id: 1, currentTerm: 3 }).onConflictDoNothing().run();

// Same fixed-content treatment as the catalogue itself.
db.insert(prerequisites).values([...prerequisiteSeed]).onConflictDoNothing().run();
db.insert(incompatibilities).values([...incompatibilitySeed]).onConflictDoNothing().run();

export type { Course, Incompatibility, PlanEntry, Prerequisite };

export function listCourses(): Course[] {
  return db.select().from(courses).all();
}

export function listPrerequisites(): Prerequisite[] {
  return db.select().from(prerequisites).all();
}

export function listIncompatibilities(): Incompatibility[] {
  return db.select().from(incompatibilities).all();
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

// null means "undecided" — a real, supported state (see schema.ts).
export function getSpecialisation(): string | null {
  return db.select().from(settings).get()?.specialisation ?? null;
}

export function setSpecialisation(specialisation: string | null): void {
  db.update(settings).set({ specialisation }).where(eq(settings.id, 1)).run();
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

// Writes both halves of a term-spanning course's enrolment together: the
// slot the student picked, plus its pair slot in the adjacent term
// (already chosen and validated by plan-integrity.ts's findPairSlot).
// Wrapped in one transaction so the pair can never be split by a mid-write
// failure — the write-side counterpart to clearSlot's own cascading delete.
export function assignCoursePair(
  term: number,
  position: number,
  pairTerm: number,
  pairPosition: number,
  courseCode: string,
): void {
  db.transaction((tx) => {
    for (const [t, p] of [[term, position], [pairTerm, pairPosition]] as const) {
      tx
        .insert(planEntries)
        .values({ term: t, position: p, courseCode })
        .onConflictDoUpdate({
          target: [planEntries.term, planEntries.position],
          set: { courseCode },
        })
        .run();
    }
  });
}

// Clearing one half of a term-spanning course (see Course.termSpan) would
// otherwise leave an orphan half representing a project that no longer
// makes sense on its own — so clearing a slot also clears the paired slot
// when the course being removed spans more than one term.
export function clearSlot(term: number, position: number): void {
  const entry = db
    .select()
    .from(planEntries)
    .where(and(eq(planEntries.term, term), eq(planEntries.position, position)))
    .get();

  db
    .delete(planEntries)
    .where(and(eq(planEntries.term, term), eq(planEntries.position, position)))
    .run();

  if (!entry) return;

  const course = db.select().from(courses).where(eq(courses.code, entry.courseCode)).get();
  if (!course || course.termSpan <= 1) return;

  db
    .delete(planEntries)
    .where(
      and(
        eq(planEntries.courseCode, entry.courseCode),
        or(eq(planEntries.term, term - 1), eq(planEntries.term, term + 1)),
      ),
    )
    .run();
}
