import { sql } from "drizzle-orm";
import { int, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.

// Reference data: the slice of the Master of Computing catalogue this
// prototype models (program 7706XMCOMP, core + Professional Computing
// specialisation). Seeded at boot from courseSeed in db.ts, not
// user-editable — it's the catalogue, not the plan.
export const courses = sqliteTable("courses", {
  code: text().primaryKey(), // e.g. "COMP6710"
  title: text().notNull(),
  units: int().notNull(),
  // "S1" | "S2" | "BOTH" | "NONE" — NONE means the catalogue currently lists
  // no offering at all (a real state some courses are actually in).
  semester: text().notNull(),
  // Which degree requirement this course counts towards — see
  // src/lib/requirements.ts for the rule (all-required vs choose-1) that
  // applies to each group. "core" | "foundational" | "capstone" |
  // "spec-compulsory" | "spec-listA" | "spec-listB".
  requirementGroup: text("requirement_group").notNull(),
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

// Single-row settings table: which term "now" is. Drives the done / current
// / future split shown on the roadmap and completed views.
export const settings = sqliteTable("settings", {
  id: int().primaryKey().default(1),
  currentTerm: int("current_term").notNull(),
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
