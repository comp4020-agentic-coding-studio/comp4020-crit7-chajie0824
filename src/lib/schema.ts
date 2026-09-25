import { sql } from "drizzle-orm";
import { int, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.

// Reference data: the slice of the Master of Computing catalogue this
// prototype models (program 7706XMCOMP core, plus all 7 specialisations).
// Seeded at boot from courseSeed in db.ts, not user-editable — it's the
// catalogue, not the plan. Which requirement group(s) a course counts
// towards is NOT stored here — a course can count differently depending on
// which specialisation is active (e.g. COMP6262 is Artificial
// Intelligence's compulsory course and Computational Foundations' list 2),
// so that mapping lives in src/lib/requirements.ts and
// src/lib/specialisations.ts as static reference data instead.
export const courses = sqliteTable("courses", {
  code: text().primaryKey(), // e.g. "COMP6710"
  title: text().notNull(),
  units: int().notNull(),
  // "S1" | "S2" | "BOTH" | "NONE" — NONE means the catalogue currently lists
  // no offering at all (a real state some courses are actually in).
  semester: text().notNull(),
  // Illustrative only — ANU doesn't publish a student rating for courses the
  // way the reference 教务系统 screenshots do. Seeded with plausible demo
  // values so the UI has something to show; not a real ANU data point.
  rating: real().notNull(),
  // How many consecutive terms one enrolment in this course occupies.
  // Almost everything is 1; COMP8715 is a year-long project taken across
  // two consecutive semesters (6 units each, 12 total) — see
  // src/lib/plan-integrity.ts for how that's enforced. Defaulted here (not
  // left to application code) so the migration can add the column with a
  // real default instead of hitting SQLite's NOT-NULL-without-default
  // restriction on an already-populated table.
  termSpan: int("term_span").notNull().default(1),
});

export type Course = typeof courses.$inferSelect;

// User data: the plan being built. One row per filled slot in the Term ×
// position grid (term 1-4, see src/lib/terms.ts for what each term maps to
// on the calendar); an empty slot simply has no row. This is the state that
// must survive a reload.
export const planEntries = sqliteTable(
  "plan_entries",
  {
    id: int().primaryKey({ autoIncrement: true }),
    term: int().notNull(), // 1..4
    position: int().notNull(), // 1..4 (a standard 24-unit semester of 6-unit courses)
    courseCode: text("course_code")
      .notNull()
      .references(() => courses.code),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [uniqueIndex("plan_entries_slot_unique").on(t.term, t.position)],
);

export type PlanEntry = typeof planEntries.$inferSelect;

// Single-row settings table: which term "now" is, and which specialisation
// the student has committed to (if any). `specialisation` is nullable —
// null means "undecided", which is a real, supported state: the student can
// keep selecting courses before committing (see requirements.ts's
// groupsForSpecialisation, which shows only the program-wide requirements
// until this is set).
export const settings = sqliteTable("settings", {
  id: int().primaryKey().default(1),
  currentTerm: int("current_term").notNull(),
  specialisation: text(),
});

export type Settings = typeof settings.$inferSelect;

// Reference data: which courses gate which. Seeded from prerequisitesSeed
// in db.ts, alongside the catalogue — not user-editable.
export const prerequisites = sqliteTable(
  "prerequisites",
  {
    id: int().primaryKey({ autoIncrement: true }),
    courseCode: text("course_code")
      .notNull()
      .references(() => courses.code),
    requiresCode: text("requires_code")
      .notNull()
      .references(() => courses.code),
  },
  (t) => [uniqueIndex("prerequisites_pair_unique").on(t.courseCode, t.requiresCode)],
);

export type Prerequisite = typeof prerequisites.$inferSelect;

// Reference data: pairs of courses ANU's own "Incompatible With" field says
// can never both count towards the degree — e.g. COMP8715 and COMP8830 are
// the program's two capstone alternatives, so completing one rules out the
// other. Stored once per pair (courseCode < withCode isn't enforced, but the
// seed only lists each pair once); the check in plan-integrity.ts looks both
// directions, since incompatibility is symmetric unlike a prerequisite.
// Seeded from incompatibilitySeed in db.ts, alongside the catalogue — not
// user-editable.
export const incompatibilities = sqliteTable(
  "incompatibilities",
  {
    id: int().primaryKey({ autoIncrement: true }),
    courseCode: text("course_code")
      .notNull()
      .references(() => courses.code),
    withCode: text("with_code")
      .notNull()
      .references(() => courses.code),
  },
  (t) => [uniqueIndex("incompatibilities_pair_unique").on(t.courseCode, t.withCode)],
);

export type Incompatibility = typeof incompatibilities.$inferSelect;
