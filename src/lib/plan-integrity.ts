import type { PlanEntry } from "./schema";

// A course already sitting in another slot isn't a real second enrolment —
// selecting it again would double-count its units towards graduation.
export function duplicateEntry(
  courseCode: string,
  plan: readonly PlanEntry[],
  term: number,
  position: number,
): PlanEntry | undefined {
  return plan.find(
    (p) => p.courseCode === courseCode && !(p.term === term && p.position === position),
  );
}
