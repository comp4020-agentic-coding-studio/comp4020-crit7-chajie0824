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

export interface ProposedSlot {
  position: number;
  courseCode: string | null;
}

// Builds the plan to validate a batch of same-term slot edits against:
// every row from OTHER terms passes through unchanged; this term's 4
// positions are replaced by the proposed batch (a null courseCode
// contributes no row). This is what lets checkDuplicate see an in-flight
// swap between two slots of the same term as already resolved, instead of
// comparing a proposed value against this term's stale persisted rows.
export function buildMergedPlan(
  plan: readonly PlanEntry[],
  term: number,
  proposed: readonly ProposedSlot[],
): PlanEntry[] {
  const others = plan.filter((p) => p.term !== term);
  const replaced = proposed
    .filter((s): s is { position: number; courseCode: string } => s.courseCode !== null)
    .map((s) => ({ id: -1, term, position: s.position, courseCode: s.courseCode, createdAt: "" }));
  return [...others, ...replaced];
}

export interface PairTarget {
  term: number;
  position: number;
}

export type PairResult =
  | { kind: "none" } // termSpan <= 1, or not a fresh placement
  | { kind: "target"; target: PairTarget }
  | { kind: "no-room" };

// Only fires for a FRESH placement of a termSpan>1 course (zero other
// entries anywhere for this courseCode) — checkDuplicate already treats a
// second, adjacent entry as a complete pair, so this must not re-trigger
// then. Prefers term+1 (forward); falls back to term-1 only if forward is
// out of range or occupied at this exact position; otherwise "no-room".
// The target always keeps the SAME position — never any other free one.
export function findPairSlot(
  course: Course,
  plan: readonly PlanEntry[],
  term: number,
  position: number,
): PairResult {
  if (course.termSpan <= 1) return { kind: "none" };

  const others = plan.filter(
    (p) => p.courseCode === course.code && !(p.term === term && p.position === position),
  );
  if (others.length > 0) return { kind: "none" };

  const inRange = (t: number) => t >= 1 && t <= 4;
  const occupied = (t: number) => plan.some((p) => p.term === t && p.position === position);

  if (inRange(term + 1) && !occupied(term + 1)) {
    return { kind: "target", target: { term: term + 1, position } };
  }
  if (inRange(term - 1) && !occupied(term - 1)) {
    return { kind: "target", target: { term: term - 1, position } };
  }
  return { kind: "no-room" };
}

export interface PairLockCheck {
  blocked: boolean;
  pairedTerm?: number;
}

// A slot whose CURRENTLY PERSISTED course spans multiple terms is one half
// of a pair — used by both select.astro (disable every option but self and
// empty) and api/plan.ts (reject a submitted change to a different course,
// which would otherwise silently orphan the other half). Clearing is
// deliberately not this function's concern — that stays always allowed and
// cascades via the existing clearSlot.
export function pairLock(
  plan: readonly PlanEntry[],
  courses: readonly Course[],
  term: number,
  position: number,
): PairLockCheck {
  const existing = plan.find((p) => p.term === term && p.position === position);
  if (!existing) return { blocked: false };
  const course = courses.find((c) => c.code === existing.courseCode);
  if (!course || course.termSpan <= 1) return { blocked: false };
  const pairedTerm = plan.find((p) => p.courseCode === existing.courseCode && p.term !== term)?.term;
  return { blocked: true, pairedTerm };
}
