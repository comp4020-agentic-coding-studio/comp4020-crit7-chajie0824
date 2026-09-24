import type { APIRoute } from "astro";
import { assignCourse, assignCoursePair, clearSlot, listCourses, listPlan, listPrerequisites } from "../../lib/db";
import { completedBefore, missingPrereqs } from "../../lib/prerequisites";
import { buildMergedPlan, checkDuplicate, findPairSlot, pairLock, semesterConflict, type PairTarget } from "../../lib/plan-integrity";

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const term = Number(form.get("term"));
  const returnTo = String(form.get("returnTo") ?? "/");

  if (!(term >= 1 && term <= 4)) {
    return redirect(returnTo, 303);
  }

  const fail = (param: string, courseCode: string, position: number) => {
    const separator = returnTo.includes("?") ? "&" : "?";
    return redirect(
      `${returnTo}${separator}${param}=${encodeURIComponent(courseCode)}&slot=${position}`,
      303,
    );
  };

  // All 4 slots of this term are submitted together, so they must be
  // validated and applied as one batch — see plan-integrity.ts's
  // buildMergedPlan for why a swap between two of this term's slots needs
  // to be checked against each other's *proposed* value, not the
  // currently-persisted one.
  const proposed = [1, 2, 3, 4].map((position) => ({
    position,
    courseCode: String(form.get(`courseCode-${position}`) ?? "").trim() || null,
  }));

  const courses = listCourses();
  const plan = listPlan();
  const prereqs = listPrerequisites();
  // completedBefore only reads terms strictly before `term`, so editing
  // `term` itself can never change its result — the pre-edit plan is fine.
  const completed = completedBefore(plan, term);
  const mergedPlan = buildMergedPlan(plan, term, proposed);
  const pairTargets = new Map<number, PairTarget>();

  for (const { position, courseCode } of proposed) {
    if (!courseCode) continue;
    const course = courses.find((c) => c.code === courseCode);
    if (!course) continue;

    // A slot already holding one half of a term-spanning course can't be
    // switched to a different course — that would orphan its other half.
    // Compared against the persisted plan, not mergedPlan, since we need
    // what's really in this slot right now, not the proposed value.
    const currentEntry = plan.find((p) => p.term === term && p.position === position);
    const lock = pairLock(plan, courses, term, position);
    if (lock.blocked && courseCode !== currentEntry?.courseCode) {
      return fail("paired", courseCode, position);
    }

    if (semesterConflict(course, term)) {
      return fail("notoffered", courseCode, position);
    }

    const dup = checkDuplicate(course, mergedPlan, term, position);
    if (dup.blocked) {
      return fail(dup.reason === "non-consecutive" ? "nonconsecutive" : "duplicate", courseCode, position);
    }

    if (missingPrereqs(courseCode, prereqs, completed).length > 0) {
      return fail("locked", courseCode, position);
    }

    // A fresh placement of a term-spanning course must have somewhere to
    // put its other half. mergedPlan is safe here even though the target
    // lives in an adjacent term: buildMergedPlan only replaces rows for
    // `term`, so its view of any other term matches the persisted plan.
    const pair = findPairSlot(course, mergedPlan, term, position);
    if (pair.kind === "no-room") {
      return fail("noroom", courseCode, position);
    }
    if (pair.kind === "target") {
      pairTargets.set(position, pair.target);
    }
  }

  // Every non-empty slot passed — nothing above this line has written to
  // the DB, so a rejected batch never applies part of itself.
  for (const { position, courseCode } of proposed) {
    if (courseCode) {
      const pair = pairTargets.get(position);
      if (pair) {
        assignCoursePair(term, position, pair.term, pair.position, courseCode);
      } else {
        assignCourse(term, position, courseCode);
      }
    } else {
      clearSlot(term, position);
    }
  }

  return redirect(returnTo, 303);
};
