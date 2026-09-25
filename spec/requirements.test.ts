import { describe, expect, it } from "vitest";
import { computeProgress, groupsForSpecialisation, surplusCourses } from "../src/lib/requirements";
import type { Course, PlanEntry } from "../src/lib/schema";

// Pure unit tests on the requirement-group model itself — no server/DB
// needed, since computeProgress and groupsForSpecialisation are plain
// functions over their arguments. Kept separate from pairing.test.ts's
// HTTP-driven, shared-database tests.

function course(code: string, units = 6): Course {
  return { code, title: code, units, semester: "BOTH", rating: 4, termSpan: 1 };
}

function entry(courseCode: string, term = 1, position = 1): PlanEntry {
  return { id: 0, term, position, courseCode, createdAt: "" };
}

describe("groupsForSpecialisation", () => {
  it("returns only the universal groups when undecided", () => {
    const groups = groupsForSpecialisation(null);
    expect(groups.some((g) => g.key === "core")).toBe(true);
    expect(groups.some((g) => g.key.startsWith("artif-"))).toBe(false);
    expect(groups.some((g) => g.key.startsWith("dtsc-"))).toBe(false);
  });

  it("adds the chosen specialisation's own groups on top of the universal ones", () => {
    const groups = groupsForSpecialisation("ARTIF");
    expect(groups.some((g) => g.key === "core")).toBe(true);
    expect(groups.some((g) => g.key === "artif-compulsory")).toBe(true);
    expect(groups.some((g) => g.key.startsWith("dtsc-"))).toBe(false);
  });

  it("includes a Computing Elective group whose pool excludes fixed/min-units codes but keeps COMP-only-electives", () => {
    const undecided = groupsForSpecialisation(null).find((g) => g.key === "computing-elective")!;
    expect(undecided).toBeTruthy();
    // Not on any specialisation's list, but real COMP-coded catalogue data —
    // must be pickable as Computing Elective.
    expect(undecided.courseCodes).toContain("COMP8020");
    // Owned by Core ("all") — must never double as Computing Elective.
    expect(undecided.courseCodes).not.toContain("COMP6710");

    const pcom = groupsForSpecialisation("PCOM").find((g) => g.key === "computing-elective")!;
    // Owned by PCOM's own compulsory ("all") group.
    expect(pcom.courseCodes).not.toContain("COMP6120");
    // Owned by PCOM's list B ("min-units") group.
    expect(pcom.courseCodes).not.toContain("COMP8600");
    // On PCOM's list A ("choose-n") — deliberately still eligible, since an
    // extra list-A pick beyond its count should be able to fall through to
    // Computing Elective (see surplusCourses tests below).
    expect(pcom.courseCodes).toContain("COMP6240");
  });
});

describe("computeProgress", () => {
  it("shows only universal groups as outstanding when undecided", () => {
    const courses = [course("COMP6250"), course("COMP6320")];
    const plan: PlanEntry[] = [];
    const progress = computeProgress(courses, plan, null);
    expect(progress.some((g) => g.key === "core")).toBe(true);
    expect(progress.some((g) => g.key === "artif-compulsory")).toBe(false);
  });

  it("counts a course shared by two specialisations' groups towards both", () => {
    // COMP6262 is Artificial Intelligence's compulsory course AND
    // Computational Foundations' optional list 2 — assigning it once
    // should register as progress in each specialisation's own audit.
    const courses = [course("COMP6262"), course("COMP6320"), course("COMP8620"), course("COMP8691")];
    const plan = [entry("COMP6262")];

    const artifProgress = computeProgress(courses, plan, "ARTIF");
    const artifCompulsory = artifProgress.find((g) => g.key === "artif-compulsory")!;
    expect(artifCompulsory.assigned.map((c) => c.code)).toContain("COMP6262");

    const compProgress = computeProgress(courses, plan, "COMP");
    const compList2 = compProgress.find((g) => g.key === "comp-list2")!;
    expect(compList2.assigned.map((c) => c.code)).toContain("COMP6262");
    expect(compList2.satisfied).toBe(true); // list 2 is a min-units: 0 top-up, always satisfied
  });

  it("satisfies a min-units group once assigned units reach the threshold", () => {
    const courses = [course("COMP8300", 6), course("COMP8045", 6)];
    const cmsyList1Unsatisfied = computeProgress(courses, [entry("COMP8300")], "CMSY").find(
      (g) => g.key === "cmsy-list1",
    )!;
    expect(cmsyList1Unsatisfied.satisfied).toBe(false); // only 6/12 units

    const cmsyList1Satisfied = computeProgress(
      courses,
      [entry("COMP8300", 1, 1), entry("COMP8045", 1, 2)],
      "CMSY",
    ).find((g) => g.key === "cmsy-list1")!;
    expect(cmsyList1Satisfied.satisfied).toBe(true); // 12/12 units
  });
});

describe("surplusCourses", () => {
  it("flags the non-COMP overflow from a choose-n list, but not the COMP overflow or the first (claimed) pick", () => {
    // PCOM's list A is choose-1. Planning 4 of its 8 options: the earliest
    // (by term/position) claims the one real slot; a later non-COMP pick
    // has nowhere to go (surplus), while a later COMP pick can still count
    // as Computing Elective instead (not surplus).
    const courses = [course("MGMT7020"), course("INFS8205"), course("COMP6240"), course("COMP6390")];
    const plan = [
      entry("MGMT7020", 1, 1), // earliest — claims list A's one slot
      entry("INFS8205", 2, 1), // non-COMP overflow — genuinely wasted
      entry("COMP6240", 3, 1), // COMP overflow — falls through to Computing Elective
      entry("COMP6390", 4, 1), // COMP overflow — falls through to Computing Elective
    ];

    const surplus = surplusCourses(courses, plan, "PCOM");
    expect(surplus.map((c) => c.code)).toEqual(["INFS8205"]);
  });

  it("returns nothing when a choose-n list is filled within its cap", () => {
    const courses = [course("MGMT7020")];
    const plan = [entry("MGMT7020")];
    expect(surplusCourses(courses, plan, "PCOM")).toEqual([]);
  });
});
