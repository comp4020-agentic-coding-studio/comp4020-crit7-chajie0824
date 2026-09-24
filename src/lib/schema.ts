import { sql } from "drizzle-orm";
import { int, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.

// Reference data: the slice of the Master of Computing catalogue this
// prototype models (program 7706XMCOMP, core + Human Centred and Creative
// Computing specialisation). Seeded at boot from courseSeed in db.ts, not
// user-editable — it's the catalogue, not the plan.
export const courses = sqliteTable("courses", {
  code: text().primaryKey(), // e.g. "COMP6710"
  title: text().notNull(),
  units: int().notNull(),
  // "S1" | "S2" | "BOTH" | "NONE" — NONE means the catalogue currently lists
  // no offering at all (a real state some courses are actually in).
  semester: text().notNull(),
  // "core" | "foundational" | "capstone" | "specialisation"
  category: text().notNull(),
  // Which specialisation stream this course counts towards; null outside one.
  specialisation: text(),
});

export type Course = typeof courses.$inferSelect;

// User data: the plan being built. One row per filled slot in the Year ×
// Semester × position grid; an empty slot simply has no row. This is the
// state that must survive a reload.
export const planEntries = sqliteTable(
  "plan_entries",
  {
    id: int().primaryKey({ autoIncrement: true }),
    year: int().notNull(), // 1 | 2
    semester: text().notNull(), // "S1" | "S2"
    position: int().notNull(), // 1..4 (a standard 24-unit semester of 6-unit courses)
    courseCode: text("course_code")
      .notNull()
      .references(() => courses.code),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [uniqueIndex("plan_entries_slot_unique").on(t.year, t.semester, t.position)],
);

export type PlanEntry = typeof planEntries.$inferSelect;
