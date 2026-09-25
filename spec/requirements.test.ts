import { describe, expect, it } from "vitest";
import { computeProgress, groupsForSpecialisation, surplusCourses } from "../src/lib/requirements";
import { SPECIALISATIONS, type SpecialisationKey } from "../src/lib/specialisations";
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

  it("includes a Computing Elective group whose pool excludes only fixed ('all') codes, keeping choose-n/min-units overflow eligible", () => {
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
    // On PCOM's list B ("min-units": 6) — deliberately still eligible, since
    // list B only needs 6u/1 course; a second matching pick beyond that
    // threshold should be able to fall through to Computing Elective
    // instead of just vanishing (the exact bug a real user's plan surfaced —
    // see the "min-units group's overflow" computeProgress test below).
    expect(pcom.courseCodes).toContain("COMP8600");
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
    // A COMP-coded list-A course is ALSO eligible here (nothing in the real
    // handbook wording excludes COMP from University Elective — only
    // Computing Elective's own wording is subject-restricted). Which bucket
    // an eligible-for-both course actually counts towards is computeProgress's
    // allocation call, not a pool-membership question — see the "flows COMP
    // overflow into University Elective" test below.
    expect(pcom.courseCodes).toContain("COMP6240");
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

  it("flows COMP overflow into University Elective once Computing Elective's own 18u is already met", () => {
    // This is the exact scenario a real user's own plan surfaced: 5 unclaimed
    // COMP picks (COMP6240/COMP6390 as pcom-listA overflow, plus 3 generic
    // COMP courses on no specific list) — 30u total. Computing Elective only
    // needs 18u (3 picks); the other 2 (12u) have nowhere else useful to go
    // under the real handbook wording except University Elective, which has
    // no subject-area restriction. A prior version of this pool design
    // excluded every COMP code from University Elective outright, so those 2
    // surplus picks vanished instead of counting towards it.
    const courses = [
      course("COMP6710"), // core
      course("COMP8715", 6), // capstone, termSpan 2
      course("MATH6005"), // foundational
      course("COMP6120"), // pcom-compulsory
      course("ENGN8100"), // pcom-compulsory
      course("MGMT7020"), // pcom-listA — claims the one slot
      course("COMP6240"), // pcom-listA, COMP overflow
      course("COMP6390"), // pcom-listA, COMP overflow
      course("COMP6540"), // generic COMP overflow, no specific list
      course("COMP6528"), // generic COMP overflow, no specific list
      course("COMP6361"), // generic COMP overflow, no specific list
    ];
    const plan = [
      entry("COMP6710", 1, 1),
      entry("COMP6120", 1, 2),
      entry("ENGN8100", 1, 3),
      entry("COMP6240", 1, 4),
      entry("MATH6005", 2, 1),
      entry("COMP6390", 2, 2),
      entry("COMP8715", 3, 1),
      entry("MGMT7020", 3, 2),
      entry("COMP8715", 4, 1),
      entry("COMP6540", 4, 2),
      entry("COMP6528", 4, 3),
      entry("COMP6361", 4, 4),
    ];

    const progress = computeProgress(courses, plan, "PCOM");
    const computingElective = progress.find((g) => g.key === "computing-elective")!;
    const generalElective = progress.find((g) => g.key === "general-elective")!;

    expect(computingElective.assigned.length).toBe(3); // exactly enough to reach 18u
    expect(computingElective.satisfied).toBe(true);
    // The other 2 unclaimed COMP picks, not double-counted with the above.
    expect(generalElective.assigned.length).toBe(2);
    expect(new Set([...computingElective.assigned, ...generalElective.assigned]).size).toBe(5); // no course in both
    expect(generalElective.satisfied).toBe(true); // 12/12u
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

  it("lets a min-units group's overflow pick fall through to Computing Elective once its own threshold is met", () => {
    // The exact bug a real user's plan surfaced: DTSC's own elective list
    // only needs 6u (1 course), but a student may reasonably plan two of its
    // six options. Before this fix, dtsc-elective's pool was permanently
    // excluded from Computing Elective altogether (regardless of whether it
    // actually needed both picks) and claimed both matching plan entries
    // unconditionally — so the second, COMP-coded pick just vanished instead
    // of counting as Computing Elective, and the plan could never fully
    // satisfy graduation even though every course in it was individually a
    // legitimate choice.
    const courses = [
      course("COMP6240"), // dtsc-compulsory
      course("COMP8410"), // dtsc-compulsory
      course("COMP8430"), // dtsc-compulsory
      course("COMP8600"), // dtsc-elective — claims the 6u threshold on its own
      course("COMP8880"), // dtsc-elective overflow — should flow to Computing Elective
    ];
    const plan = [
      entry("COMP6240", 1, 1),
      entry("COMP8410", 1, 2),
      entry("COMP8430", 1, 3),
      entry("COMP8600", 2, 1),
      entry("COMP8880", 2, 2),
    ];

    const progress = computeProgress(courses, plan, "DTSC");
    const dtscElective = progress.find((g) => g.key === "dtsc-elective")!;
    const computingElective = progress.find((g) => g.key === "computing-elective")!;

    expect(dtscElective.satisfied).toBe(true); // 6/6u, met by COMP8600 alone
    expect(computingElective.assigned.map((c) => c.code)).toContain("COMP8880");
  });
});

describe("surplusCourses", () => {
  it("rescues a choose-n list's non-COMP overflow into University Elective when its own budget still has room", () => {
    // PCOM's list A is choose-1. A second, non-COMP pick beyond that one
    // real slot used to be reported as wasted outright — but nothing in the
    // real handbook wording stops it counting as University Elective, and
    // computeProgress's own allocation already does count it that way (see
    // the "flows COMP overflow into University Elective" computeProgress
    // test above). surplusCourses must agree with that, not contradict it.
    const courses = [course("MGMT7020"), course("INFS8205"), course("COMP6240"), course("COMP6390")];
    const plan = [
      entry("MGMT7020", 1, 1), // earliest non-COMP — claims list A's one slot
      entry("INFS8205", 2, 1), // later non-COMP overflow — rescued by University Elective
      entry("COMP6240", 3, 1), // COMP overflow — falls through to Computing Elective
      entry("COMP6390", 4, 1), // COMP overflow — falls through to Computing Elective
    ];

    expect(surplusCourses(courses, plan, "PCOM")).toEqual([]);
  });

  it("flags an overflow pick as genuinely surplus once both Computing and University Elective's own budgets are full", () => {
    // 4 of PCOM list A's 5 non-COMP options planned: MGMT7020 claims the one
    // real slot; of the 3 non-COMP overflow picks left, none are eligible
    // for Computing Elective (not COMP-coded), and University Elective's
    // own 12u/2-course budget can only absorb 2 of them — the 3rd genuinely
    // has nowhere left to go.
    const courses = [course("MGMT7020"), course("INFS8004"), course("INFS8205"), course("LAWS8445")];
    const plan = [
      entry("MGMT7020", 1, 1), // claims list A's one slot
      entry("INFS8004", 1, 2), // rescued — University Elective's 1st pick
      entry("INFS8205", 1, 3), // rescued — University Elective's 2nd pick, budget now full
      entry("LAWS8445", 1, 4), // genuinely surplus — nowhere left to go
    ];

    const surplus = surplusCourses(courses, plan, "PCOM");
    expect(surplus.map((s) => s.course.code)).toEqual(["LAWS8445"]);
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

// computeProgress's claim-priority rules — a pick with no fallback outlet
// claims a contested choose-n slot before one that has a fallback, and
// Computing Elective (the subject-restricted, COMP-only bucket) claims a
// shared-eligibility COMP pick before University Elective (the unrestricted
// one) does — are only guaranteed correct, not just a plausible heuristic,
// because this app's catalogue data satisfies structural invariants: no
// course sits on two different choose-n lists at once, no two hard
// ("all"/"choose-n"/"min-units") groups active in the same specialisation
// context share a code, and Computing Elective's pool is always a *subset*
// of University Elective's (never the reverse, and never merely
// overlapping) — the exchange-argument proof for "satisfy the
// more-constrained side first, let the leftover flow to the flexible one"
// depends on that strict subset relationship. This suite doesn't just assert
// that once; it scans every specialisation context (plus undecided) so a
// future catalogue edit that breaks an invariant fails here, not as a
// silently-wrong graduation verdict discovered by a user.
describe("catalogue invariants the claim-priority rule depends on", () => {
  const specs: (SpecialisationKey | null)[] = [null, ...SPECIALISATIONS.map((s) => s.key)];

  it("never assigns the same course code to two different hard (non-elective) groups in one context", () => {
    for (const spec of specs) {
      const hardGroups = groupsForSpecialisation(spec).filter(
        (g) => g.key !== "computing-elective" && g.key !== "general-elective",
      );
      const owner = new Map<string, string>();
      for (const group of hardGroups) {
        for (const code of group.courseCodes) {
          const existing = owner.get(code);
          expect(existing, `spec=${spec ?? "null"}: ${code} is in both "${existing}" and "${group.key}"`).toBeUndefined();
          owner.set(code, group.key);
        }
      }
    }
  });

  it("always keeps Computing Elective's pool a strict subset of University Elective's", () => {
    for (const spec of specs) {
      const groups = groupsForSpecialisation(spec);
      const computing = groups.find((g) => g.key === "computing-elective")!;
      const general = groups.find((g) => g.key === "general-elective")!;
      const missing = computing.courseCodes.filter((c) => !general.courseCodes.includes(c));
      expect(missing, `spec=${spec ?? "null"}: Computing-Elective-eligible but not University-Elective-eligible`).toEqual([]);
    }
  });
});
