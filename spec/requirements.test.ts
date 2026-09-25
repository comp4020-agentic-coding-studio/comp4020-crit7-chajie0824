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

  it("includes a University Elective group whose pool covers the whole catalogue, not just the two placeholder rows", () => {
    const pcom = groupsForSpecialisation("PCOM").find((g) => g.key === "general-elective")!;
    expect(pcom).toBeTruthy();
    expect(pcom.rule).toBe("min-units");
    expect(pcom.units).toBe(12);
    // Still eligible: the two generic placeholder rows.
    expect(pcom.courseCodes).toContain("UNIV-ELEC-1");
    expect(pcom.courseCodes).toContain("UNIV-ELEC-2");
    // Now also eligible: PCOM list A's non-COMP courses, which have no
    // other outlet once list A's one real slot is already claimed.
    expect(pcom.courseCodes).toContain("MGMT7020");
    expect(pcom.courseCodes).toContain("LAWS8445");
    // A COMP-coded list-A course stays exclusive to Computing Elective —
    // never double-listed under University Elective too.
    expect(pcom.courseCodes).not.toContain("COMP6240");
    // Owned by Core ("all") — never a University Elective either.
    expect(pcom.courseCodes).not.toContain("COMP6710");
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

  it("never lets a course already claimed by another requirement double-count towards Computing/University Elective", () => {
    // PCOM, list A choose-1. Only one non-COMP pick (MGMT7020) and two
    // COMP overflow picks (COMP6240, COMP6390) are planned — 6+6=12u,
    // short of Computing Elective's 18u. Before the fix, COMP8715 (the
    // capstone pick, unrelated to list A) also leaked into Computing
    // Elective's pool since choose-n codes are deliberately left
    // unexcluded there, wrongly inflating it to 18/18 and MGMT7020
    // wrongly also counting towards University Elective on top of list A.
    const courses = [
      course("COMP6710"), // core
      course("COMP8715", 6), // capstone, termSpan 2 — occupies two plan rows
      course("MATH6005"), // foundational
      course("COMP6120"), // pcom-compulsory
      course("ENGN8100"), // pcom-compulsory
      course("MGMT7020"), // pcom-listA, non-COMP — claims the one slot
      course("COMP6240"), // pcom-listA, COMP overflow
      course("COMP6390"), // pcom-listA, COMP overflow
      course("COMP8020"), // pcom-listB
    ];
    const plan = [
      entry("COMP6710", 1, 1),
      entry("COMP6120", 1, 2),
      entry("ENGN8100", 1, 3),
      entry("COMP6240", 1, 4),
      entry("MATH6005", 2, 1),
      entry("COMP6390", 2, 2),
      entry("COMP8715", 3, 1), // one selection, two rows (termSpan: 2)
      entry("MGMT7020", 3, 2),
      entry("COMP8020", 3, 3),
      entry("COMP8715", 4, 1),
    ];

    const progress = computeProgress(courses, plan, "PCOM");
    const capstone = progress.find((g) => g.key === "capstone")!;
    const listA = progress.find((g) => g.key === "pcom-listA")!;
    const computingElective = progress.find((g) => g.key === "computing-elective")!;
    const generalElective = progress.find((g) => g.key === "general-elective")!;

    expect(capstone.assigned.map((c) => c.code)).toEqual(["COMP8715"]);
    // pcom-listA itself is untouched by this fix — it still shows every
    // eligible pick (its own satisfied check only needs count >= 1).
    expect(listA.assigned.map((c) => c.code).sort()).toEqual(["COMP6240", "COMP6390", "MGMT7020"]);
    // COMP8715 already spoken for by capstone — must not also appear here.
    expect(computingElective.assigned.map((c) => c.code).sort()).toEqual(["COMP6240", "COMP6390"]);
    expect(computingElective.satisfied).toBe(false); // 12/18u, genuinely short
    // MGMT7020 already spoken for by list A — must not also appear here.
    expect(generalElective.assigned).toEqual([]);
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
  it("flags the non-COMP overflow from a choose-n list, but not the COMP overflow or the claimed pick", () => {
    // PCOM's list A is choose-1. Planning 4 of its 8 options: a non-COMP
    // pick claims the one real slot (it has no fallback), a later non-COMP
    // pick has nowhere to go (surplus), while any COMP pick can still count
    // as Computing Elective instead (not surplus).
    const courses = [course("MGMT7020"), course("INFS8205"), course("COMP6240"), course("COMP6390")];
    const plan = [
      entry("MGMT7020", 1, 1), // earliest non-COMP — claims list A's one slot
      entry("INFS8205", 2, 1), // later non-COMP overflow — genuinely wasted
      entry("COMP6240", 3, 1), // COMP overflow — falls through to Computing Elective
      entry("COMP6390", 4, 1), // COMP overflow — falls through to Computing Elective
    ];

    const surplus = surplusCourses(courses, plan, "PCOM");
    expect(surplus.map((s) => s.course.code)).toEqual(["INFS8205"]);
    expect(surplus[0].group.key).toBe("pcom-listA");
    expect(surplus[0].claimedBy.map((c) => c.code)).toEqual(["MGMT7020"]);
  });

  it("lets a non-COMP pick claim the slot ahead of an earlier COMP pick, since the COMP one has a fallback", () => {
    // Same list A, but this time the COMP-coded course was planned first
    // (an earlier term) and the non-COMP one second. Term/position order
    // alone would let COMP6240 "steal" the slot and wrongly flag MGMT7020
    // (which has nowhere else to go) as the wasted pick — COMP-ness should
    // win the tie-break instead.
    const courses = [course("COMP6240"), course("MGMT7020")];
    const plan = [entry("COMP6240", 1, 3), entry("MGMT7020", 3, 4)];

    const surplus = surplusCourses(courses, plan, "PCOM");
    expect(surplus).toEqual([]);
  });

  it("returns nothing when a choose-n list is filled within its cap", () => {
    const courses = [course("MGMT7020")];
    const plan = [entry("MGMT7020")];
    expect(surplusCourses(courses, plan, "PCOM")).toEqual([]);
  });
});
