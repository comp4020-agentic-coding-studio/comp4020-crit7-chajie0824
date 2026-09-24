import type { Course, PlanEntry } from "./schema";
import { termSemester } from "./terms";

// A course offered only in S1 can't actually be taken in an S2 term, and
// vice versa — "BOTH" means either, "NONE" means it isn't offered at all
// (a defensive case; no seeded course currently uses it).
export function semesterConflict(course: Course, term: number): boolean {
  if (course.semester === "NONE") return true;
  if (course.semester === "BOTH") return false;
  return course.semester !== termSemester(term);
}

export type DuplicateReason = "duplicate" | "non-consecutive";

export interface DuplicateCheck {
  blocked: boolean;
  otherEntry?: PlanEntry;
  reason?: DuplicateReason;
}

// A course already sitting in another slot isn't a real second enrolment —
// selecting it again would double-count its units towards graduation. The
// one exception is a term-spanning course (Course.termSpan > 1, currently
// only COMP8715): one real enrolment legitimately occupies `termSpan`
// slots, but only across that many *consecutive* terms — a third slot, or
// a second slot in a non-adjacent term, still isn't a real extra enrolment.
export function checkDuplicate(
  course: Course,
  plan: readonly PlanEntry[],
  term: number,
  position: number,
): DuplicateCheck {
  const others = plan.filter(
    (p) => p.courseCode === course.code && !(p.term === term && p.position === position),
  );
  if (others.length === 0) return { blocked: false };

  if (course.termSpan <= 1) {
    return { blocked: true, otherEntry: others[0], reason: "duplicate" };
  }

  if (others.length >= course.termSpan) {
    return { blocked: true, otherEntry: others[0], reason: "duplicate" };
  }

  const adjacent = others.find((o) => Math.abs(o.term - term) === 1);
  if (!adjacent) {
    return { blocked: true, otherEntry: others[0], reason: "non-consecutive" };
  }

  return { blocked: false };
}
