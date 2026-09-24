import type { Course, PlanEntry, Prerequisite } from "./schema";

// Every course code assigned to a term strictly before the given term —
// "completed by the time you'd start `term`". Deliberately relative to the
// term being planned, not the global current term, so planning a future
// term correctly requires its prerequisites to land earlier in the plan.
export function completedBefore(plan: PlanEntry[], term: number): Set<string> {
  return new Set(plan.filter((p) => p.term < term).map((p) => p.courseCode));
}

export function missingPrereqs(
  courseCode: string,
  prereqs: readonly Prerequisite[],
  completed: ReadonlySet<string>,
): string[] {
  return prereqs
    .filter((p) => p.courseCode === courseCode)
    .map((p) => p.requiresCode)
    .filter((code) => !completed.has(code));
}

export interface LockedCourse {
  course: Course;
  missing: string[];
}

// For the roadmap: courses not yet placed anywhere in the plan, whose
// prerequisites aren't satisfied yet.
export function lockedCourses(
  courses: readonly Course[],
  plan: readonly PlanEntry[],
  prereqs: readonly Prerequisite[],
  completed: ReadonlySet<string>,
): LockedCourse[] {
  const planned = new Set(plan.map((p) => p.courseCode));
  return courses
    .filter((c) => !planned.has(c.code))
    .map((course) => ({ course, missing: missingPrereqs(course.code, prereqs, completed) }))
    .filter((entry) => entry.missing.length > 0);
}
