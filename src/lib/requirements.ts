import { courseSeed } from "./courses-seed";
import type { Course, PlanEntry } from "./schema";
import { SPECIALISATIONS, type SpecialisationKey } from "./specialisations";

// The actual graduation rule per requirement group. "all" means every course
// listed must appear somewhere in the plan; "choose-n" means at least
// `count` of them do (course-count is the natural rule where ANU expresses
// it that way — foundational/capstone choose 1, university elective needs
// 2 six-unit courses); "min-units" means the *units* of assigned courses
// from the list must reach `units` — this is how ANU actually expresses
// every specialisation's own lists (e.g. "a minimum of 12 units from the
// following"), so it's the rule most groups below use.
export type GroupRule = "all" | "choose-n" | "min-units";

export interface GroupDef {
  key: string;
  label: string;
  rule: GroupRule;
  count?: number; // choose-n
  units?: number; // min-units
  courseCodes: readonly string[];
}

// Requirements shared by every specialisation — program 7706XMCOMP's own
// core, foundational and capstone rules. Always in force, whether or not a
// specialisation has been chosen yet. University Elective used to live here
// too, as a fixed 2-course list — see generalElectiveGroup below for why
// it's now computed instead.
export const UNIVERSAL_GROUPS: readonly GroupDef[] = [
  { key: "core", label: "Core", rule: "all", courseCodes: ["COMP6250", "COMP6442", "COMP6710", "COMP8260"] },
  { key: "foundational", label: "Foundational", rule: "choose-n", count: 1, courseCodes: ["MATH6005", "COMP6260"] },
  { key: "capstone", label: "Capstone", rule: "choose-n", count: 1, courseCodes: ["COMP8715", "COMP8830"] },
];

// Each specialisation's own 24 units, sourced from
// programsandcourses.anu.edu.au/2025/specialisation/<key>-SPEC (2025
// offerings, checked this session). A "list 2"-style group is modelled with
// `rule: "min-units", units: 0` — always satisfied, never blocking, but
// still a real browsable optgroup — because ANU treats these as an optional
// *capped* top-up pool (e.g. "a maximum of 12 units from the following"),
// not a requirement of their own; this app tracks minimums, not max-caps or
// the separate "12 units must be 8000-level" sub-constraint some
// specialisations also carry — modelling a full constraint solver is out of
// scope for a course-planning prototype. PCOM's "list B" real rule is "any
// 8000-level COMP course except the project courses" — genuinely
// open-ended in the handbook, but unlike the university-elective group
// above, this app already seeds every real 8000-level COMP course used by
// the other 6 specialisations, so list B is simply all of them minus the
// capstone/project courses (COMP8715, COMP8830), rather than a token
// subset.
export const SPECIALISATION_GROUPS: Record<SpecialisationKey, readonly GroupDef[]> = {
  PCOM: [
    { key: "pcom-compulsory", label: "Professional Computing — compulsory", rule: "all", courseCodes: ["COMP6120", "ENGN8100"] },
    { key: "pcom-listA", label: "Professional Computing — elective list", rule: "choose-n", count: 1, courseCodes: ["COMP6240", "COMP6331", "COMP6390", "INFS8004", "INFS8205", "LAWS8445", "MGMT7020", "REGN8014"] },
    {
      key: "pcom-listB",
      label: "Professional Computing — any 8000-level COMP",
      rule: "min-units",
      units: 6,
      courseCodes: [
        "COMP8011",
        "COMP8020",
        "COMP8045",
        "COMP8300",
        "COMP8350",
        "COMP8410",
        "COMP8430",
        "COMP8460",
        "COMP8539",
        "COMP8600",
        "COMP8610",
        "COMP8620",
        "COMP8650",
        "COMP8691",
        "COMP8712",
        "COMP8880",
      ],
    },
  ],
  ARTIF: [
    { key: "artif-compulsory", label: "Artificial Intelligence — compulsory", rule: "all", courseCodes: ["COMP6262", "COMP6320", "COMP8620", "COMP8691"] },
  ],
  COMP: [
    { key: "comp-list1", label: "Computational Foundations — list 1", rule: "min-units", units: 12, courseCodes: ["COMP6361", "COMP6363", "COMP8011", "COMP8460", "MATH6114", "MATH8343"] },
    { key: "comp-list2", label: "Computational Foundations — list 2 (optional top-up)", rule: "min-units", units: 0, courseCodes: ["COMP6261", "COMP6262", "COMP6466", "COMP8712"] },
  ],
  CMSY: [
    { key: "cmsy-list1", label: "Computer Systems — list 1", rule: "min-units", units: 12, courseCodes: ["COMP8300", "COMP8045", "COMP8712"] },
    { key: "cmsy-list2", label: "Computer Systems — list 2 (optional top-up)", rule: "min-units", units: 0, courseCodes: ["COMP6310", "COMP6330", "COMP6331", "COMP6361", "COMP6464", "ENGN6213"] },
  ],
  DTSC: [
    { key: "dtsc-compulsory", label: "Data Science — compulsory", rule: "all", courseCodes: ["COMP6240", "COMP8410", "COMP8430"] },
    { key: "dtsc-elective", label: "Data Science — elective", rule: "min-units", units: 6, courseCodes: ["COMP6490", "COMP6670", "COMP8600", "COMP8650", "COMP8880", "STAT6039"] },
  ],
  HCCM: [
    { key: "hccm-compulsory", label: "Human-Centred and Creative Computing — compulsory", rule: "all", courseCodes: ["COMP6390"] },
    { key: "hccm-list1", label: "Human-Centred and Creative Computing — list 1", rule: "min-units", units: 12, courseCodes: ["COMP8020", "COMP8350", "COMP8539", "COMP8610"] },
    { key: "hccm-list2", label: "Human-Centred and Creative Computing — list 2 (optional top-up)", rule: "min-units", units: 0, courseCodes: ["COMP6528", "COMP6540", "COMP6720", "COMP6780"] },
  ],
  MCHL: [
    { key: "mchl-list", label: "Machine Learning — list", rule: "min-units", units: 24, courseCodes: ["COMP6261", "COMP6490", "COMP6528", "COMP6670", "COMP8600", "COMP8650", "COMP8880"] },
  ],
};

// The program's 6th and last requirement-slot category (Study Options
// table, programsandcourses.anu.edu.au/2025/program/7706XMCOMP): 3 six-unit
// slots (18u) of "any 6000/7000/8000-level COMP course", on top of the
// program-wide groups above and whichever specialisation is active. Unlike
// every other group, its course pool isn't a fixed list — it's the whole
// catalogue's COMP-coded courses minus whatever's permanently claimed by a
// fixed ("all") group, so it's computed, not declared.
const ALL_COMP_CODES: readonly string[] = courseSeed
  .filter((c) => c.code.startsWith("COMP"))
  .map((c) => c.code);

// Every seeded course, COMP-coded or not — the pool generalElectiveGroup
// (below) draws from, since University Elective isn't restricted by
// subject area the way Computing Elective is.
const ALL_CATALOGUE_CODES: readonly string[] = courseSeed.map((c) => c.code);

// Only an "all" group's codes are permanently excluded here: "all" is the
// one rule with no notion of "beyond the requirement" (every listed course
// is compulsory, full stop). "choose-n" groups (foundational, capstone, a
// specialisation's own list-A style group) and "min-units" groups (a
// specialisation's own list-B/list-1/list-2 style group, and, previously,
// this app's own now-abandoned assumption that a minimum has no overflow)
// both have a real notion of "enough already" — a cap, or a threshold — so
// a pick beyond what the group actually needs deliberately stays in the
// pool here, exactly the kind of course that should fall through to
// Computing/University Elective instead (see claimedByOtherGroups, which
// decides, for an actual plan, how much of such a group's own pool its
// rule really consumes, and surplusCourses, which flags what's left over
// with nowhere left to go).
function fixedCodes(groups: readonly GroupDef[]): Set<string> {
  const codes = new Set<string>();
  for (const g of groups) if (g.rule === "all") g.courseCodes.forEach((c) => codes.add(c));
  return codes;
}

function computingElectiveGroup(spec: SpecialisationKey | null): GroupDef {
  const own = spec ? SPECIALISATION_GROUPS[spec] : [];
  const exclude = new Set([...fixedCodes(UNIVERSAL_GROUPS), ...fixedCodes(own)]);
  return {
    key: "computing-elective",
    label: "Computing elective (any COMP course)",
    rule: "min-units",
    units: 18,
    courseCodes: ALL_COMP_CODES.filter((c) => !exclude.has(c)),
  };
}

// University Elective, computed the same way as Computing Elective above —
// and for the same reason. The real handbook wording (Study Options table,
// re-fetched this session) is "12 units from completion of elective courses
// offered by ANU", with the only stated eligibility rule being "electives
// must be at postgraduate level (6000 or higher)". Unlike Computing
// Elective's wording ("...from the subject area COMP...or ENGN"), nothing
// here excludes a COMP-coded course — it's the *whole* catalogue, not a
// "non-COMP" one. Modelled as a fixed 2-course list (UNIV-ELEC-1/2) before
// this session, which meant a real, already-seeded course that has no other
// outlet (e.g. a PCOM list-A pick beyond its choose-1 cap, like MGMT7020 or
// LAWS8445 — see surplusCourses) had nowhere to go even though it plainly
// qualifies as "an elective course offered by ANU".
//
// This pool DELIBERATELY overlaps Computing Elective's — a COMP-coded
// overflow pick is eligible here too, since nothing in the real wording
// excludes it, and it stays that way even once Computing Elective's own
// budget is already met by other picks. A first version of this function
// excluded Computing Elective's whole pool here, on the theory that a COMP
// pick should go there "first" — but that only ever set which course wins
// when there's a genuine choice; it wrongly forbade a COMP pick from ever
// counting here at all, even when Computing Elective had *more* COMP
// overflow than it needed (18u) and nothing non-COMP was left over for
// University Elective. Given that, computingElectiveGroup's pool is always
// a subset of this one (see the "catalogue invariants" test) — every
// Computing-Elective-eligible course is also University-Elective-eligible,
// never the reverse — and it's computeProgress's job (not this function's)
// to actually decide which bucket a shared-eligibility pick lands in: see
// allocateElectives.
function generalElectiveGroup(spec: SpecialisationKey | null): GroupDef {
  const own = spec ? SPECIALISATION_GROUPS[spec] : [];
  const exclude = new Set([...fixedCodes(UNIVERSAL_GROUPS), ...fixedCodes(own)]);
  return {
    key: "general-elective",
    label: "University elective (any faculty)",
    rule: "min-units",
    units: 12,
    courseCodes: ALL_CATALOGUE_CODES.filter((c) => !exclude.has(c)),
  };
}

// What the graduation-audit panels (index.astro, completed.astro,
// select.astro's aside) check against: the universal groups always, plus
// the chosen specialisation's own groups once one is picked, plus the
// Computing Elective bucket. `null` (or any key that isn't a real
// specialisation) means "undecided" — a real, supported state — so only
// the universal groups (and Computing Elective) apply until the student
// commits.
export function groupsForSpecialisation(spec: SpecialisationKey | null): readonly GroupDef[] {
  if (!spec) return [...UNIVERSAL_GROUPS, computingElectiveGroup(null), generalElectiveGroup(null)];
  return [...UNIVERSAL_GROUPS, ...SPECIALISATION_GROUPS[spec], computingElectiveGroup(spec), generalElectiveGroup(spec)];
}

// What the course picker (select.astro's <select>) offers: every group from
// every specialisation, not just the active one — choosing courses doesn't
// require having committed to a specialisation first (a course legitimately
// appearing under more than one specialisation just gets more than one
// optgroup, same as it would on the real handbook). Computing Elective here
// uses the undecided (universal-only) exclusion set, since no single spec
// is active in this "browse everything" context.
export function allGroups(): readonly GroupDef[] {
  return [
    ...UNIVERSAL_GROUPS,
    ...SPECIALISATIONS.flatMap((s) => SPECIALISATION_GROUPS[s.key]),
    computingElectiveGroup(null),
    generalElectiveGroup(null),
  ];
}

// Shared claim-priority ordering, used both by surplusCourses (below) and by
// computeProgress's elective bookkeeping. A "pick" is one course code's
// worth of plan entries — grouped, not left as raw rows, because a
// termSpan > 1 course (COMP8715) occupies two physical term-slots for what
// is really one single selection; treating those two rows as two separate
// "picks" of the same choose-n group would wrongly count the pair as
// "1 claimed + 1 overflow" of itself.
//
// Within a group, a non-COMP pick claims a slot before any COMP-coded pick
// competing for the same group, regardless of which was planned earlier: a
// COMP-coded pick always has Computing Elective as a fallback outlet, so
// between two picks contending for one real slot, the one *without* a
// fallback should be the one that gets it — otherwise an earlier COMP pick
// can "steal" the slot from a later non-COMP one that has nowhere else to
// go, flagging the wrong course as wasted. Ties within the same COMP-ness
// still go to whichever was planned earlier (term, then position).
interface Pick {
  code: string;
  entries: PlanEntry[];
  term: number;
  position: number;
}

function picksForGroup(group: GroupDef, plan: readonly PlanEntry[], courseByCode: Map<string, Course>): Pick[] {
  const byCode = new Map<string, PlanEntry[]>();
  for (const entry of plan) {
    if (!group.courseCodes.includes(entry.courseCode)) continue;
    const list = byCode.get(entry.courseCode) ?? [];
    list.push(entry);
    byCode.set(entry.courseCode, list);
  }
  const byTermPosition = (a: PlanEntry, b: PlanEntry) => a.term - b.term || a.position - b.position;
  const picks: Pick[] = [...byCode.entries()].map(([code, entries]) => {
    const earliest = [...entries].sort(byTermPosition)[0];
    return { code, entries, term: earliest.term, position: earliest.position };
  });
  const isComp = (p: Pick) => courseByCode.get(p.code)?.code.startsWith("COMP") ?? false;
  const byPickOrder = (a: Pick, b: Pick) => a.term - b.term || a.position - b.position;
  return [...picks.filter((p) => !isComp(p)).sort(byPickOrder), ...picks.filter((p) => isComp(p)).sort(byPickOrder)];
}

// How many of a group's own claim-priority-ordered picks (see
// picksForGroup) its own rule actually needs, for a non-"all" group:
// "choose-n" needs its `count`; "min-units" needs just enough picks, taken
// in that same priority order, for their combined units to reach its
// `units` threshold — a pick beyond that point is exactly as "spare" as a
// choose-n pick beyond `count`, so it's left unclaimed for
// claimedByOtherGroups/surplusCourses (below) to route elsewhere. "all"
// groups have no such notion — every listed course is compulsory, so
// callers claim them outright instead of asking this function.
function claimedPickCount(group: GroupDef, ordered: readonly Pick[], courseByCode: Map<string, Course>): number {
  if (group.rule === "choose-n") return group.count ?? 0;
  const threshold = group.units ?? 0;
  let units = 0;
  let i = 0;
  for (; i < ordered.length && units < threshold; i++) {
    units += courseByCode.get(ordered[i].code)?.units ?? 0;
  }
  return i;
}

// The wasted-pick detector: any non-"all" group (foundational, capstone,
// university elective, and each specialisation's own list-A/list-B style
// groups) only needs as many picks as claimedPickCount (above) says — a
// pick beyond that either falls through to Computing/University Elective
// (if allocateElectives' own budgets still have room — see computeProgress)
// or, if both are already spoken for by other overflow, genuinely advances
// nothing. This mirrors claimedByOtherGroups' own claim-priority logic
// exactly, then checks the *actual* elective allocation (not a "is it
// COMP-coded" guess) to decide whether a leftover pick really has nowhere
// to go.
//
// `claimedBy` names the pick(s) that already used up the group's own
// slot(s)/threshold — the surplus course itself is never a claimant, so the
// banner can say *why* a course a student may not even remember picking
// (in another term) is the one blocking this one, rather than just naming
// the surplus course in isolation.
export interface SurplusEntry {
  course: Course;
  group: GroupDef;
  claimedBy: Course[];
}

export function surplusCourses(courses: Course[], plan: readonly PlanEntry[], spec: SpecialisationKey | null): SurplusEntry[] {
  const groups = groupsForSpecialisation(spec);
  const electiveKeys = new Set(["computing-elective", "general-elective"]);
  const hardGroups = groups.filter((g) => !electiveKeys.has(g.key));
  const courseByCode = new Map(courses.map((c) => [c.code, c]));
  const claimed = claimedByOtherGroups(courses, plan, hardGroups);
  const computingElective = groups.find((g) => g.key === "computing-elective")!;
  const generalElective = groups.find((g) => g.key === "general-elective")!;
  const { computing, general } = allocateElectives(courses, plan, claimed, computingElective, generalElective);
  const rescued = new Set([...computing, ...general].map((c) => c.code));

  const surplus: SurplusEntry[] = [];
  for (const group of hardGroups.filter((g) => g.rule !== "all")) {
    const ordered = picksForGroup(group, plan, courseByCode);
    const cutoff = claimedPickCount(group, ordered, courseByCode);
    const claimedBy = ordered
      .slice(0, cutoff)
      .map((pick) => courseByCode.get(pick.code))
      .filter((c): c is Course => !!c);
    ordered.slice(cutoff).forEach((pick) => {
      const course = courseByCode.get(pick.code);
      if (course && !rescued.has(course.code)) surplus.push({ course, group, claimedBy });
    });
  }
  return surplus;
}

export interface GroupProgress extends GroupDef {
  required: Course[];
  assigned: Course[];
  satisfied: boolean;
}

// Every non-elective group's own all/choose-n/min-units pick(s), as actual
// plan entries — i.e. the courses a real allocation would say are "spoken
// for" by something other than Computing/University Elective. A choose-n
// or min-units group only claims as many picks as claimedPickCount (above)
// says it actually needs (by the same claim-priority order as
// surplusCourses); only "all" groups claim every match unconditionally,
// since they're the one rule with no notion of "beyond the requirement"
// (see SPECIALISATION_GROUPS's and fixedCodes' own comments).
//
// This is what stops the same physical enrolment counting twice: without
// it, a course that's already the (only) capstone pick, or the one course
// that filled a specialisation's own min-units threshold, would *also*
// silently inflate Computing/University Elective's unit total just because
// its code happens to still sit in that elective's pool (deliberately left
// there so a genuine *overflow* pick from the same list has somewhere to
// fall through to — see computingElectiveGroup/generalElectiveGroup).
function claimedByOtherGroups(courses: Course[], plan: readonly PlanEntry[], hardGroups: readonly GroupDef[]): Set<PlanEntry> {
  const courseByCode = new Map(courses.map((c) => [c.code, c]));
  const claimed = new Set<PlanEntry>();
  for (const group of hardGroups) {
    if (group.rule === "all") {
      plan.forEach((e) => {
        if (group.courseCodes.includes(e.courseCode)) claimed.add(e);
      });
    } else {
      const ordered = picksForGroup(group, plan, courseByCode);
      const cutoff = claimedPickCount(group, ordered, courseByCode);
      ordered.slice(0, cutoff).forEach((pick) => pick.entries.forEach((e) => claimed.add(e)));
    }
  }
  return claimed;
}

// Computing Elective and University Elective now share part of their pool
// (every non-fixed COMP course is eligible for either — see
// generalElectiveGroup's comment) so, unlike every other group, they can't
// each independently scan the plan for "unclaimed courses in my pool": the
// same unclaimed COMP course would then show up as "assigned" under BOTH at
// once, double-counting one real enrolment across two buckets exactly the
// way claimedByOtherGroups was built to prevent.
//
// Computing Elective is the constrained side — it can *only* ever be filled
// by a COMP-coded pick, so it has first claim on the unclaimed COMP picks it
// needs, up to its own 18u. University Elective is subject-unrestricted but
// still capped at its own 12u: it takes whatever's left afterwards (any
// unclaimed non-COMP pick, which had no other possible home anyway, plus any
// unclaimed COMP pick beyond what Computing Elective needed) only until its
// own threshold is met too. A pick that arrives once *both* thresholds are
// already met by earlier picks lands in neither bucket — that's the
// genuinely-wasted case surplusCourses (above) reports. Processing unclaimed
// picks in a fixed (term, position) order just keeps the result
// deterministic — since every course counts the same 6u-ish amount towards
// either threshold, which specific picks fill a bucket doesn't change
// whether it ends up satisfied, only the (arbitrary) explanation of which
// courses are "the" Computing/University Elective ones.
function allocateElectives(
  courses: Course[],
  plan: readonly PlanEntry[],
  claimed: Set<PlanEntry>,
  computingElective: GroupDef,
  generalElective: GroupDef,
): { computing: Course[]; general: Course[] } {
  const courseByCode = new Map(courses.map((c) => [c.code, c]));
  const byTermPosition = (a: PlanEntry, b: PlanEntry) => a.term - b.term || a.position - b.position;

  const byCode = new Map<string, PlanEntry[]>();
  for (const entry of plan) {
    if (claimed.has(entry)) continue;
    const list = byCode.get(entry.courseCode) ?? [];
    list.push(entry);
    byCode.set(entry.courseCode, list);
  }
  const unclaimedPicks = [...byCode.keys()]
    .map((code) => {
      const earliest = [...byCode.get(code)!].sort(byTermPosition)[0];
      return { code, term: earliest.term, position: earliest.position };
    })
    .sort((a, b) => a.term - b.term || a.position - b.position);

  const computing: Course[] = [];
  const general: Course[] = [];
  let computingUnits = 0;
  let generalUnits = 0;
  const computingThreshold = computingElective.units ?? 0;
  const generalThreshold = generalElective.units ?? 0;

  for (const pick of unclaimedPicks) {
    const course = courseByCode.get(pick.code);
    if (!course) continue;
    const eligibleComputing = computingElective.courseCodes.includes(pick.code);
    const eligibleGeneral = generalElective.courseCodes.includes(pick.code);
    if (eligibleComputing && computingUnits < computingThreshold) {
      computing.push(course);
      computingUnits += course.units;
    } else if (eligibleGeneral && generalUnits < generalThreshold) {
      general.push(course);
      generalUnits += course.units;
    }
  }
  return { computing, general };
}

export function computeProgress(courses: Course[], plan: PlanEntry[], spec: SpecialisationKey | null): GroupProgress[] {
  const assignedCodes = new Set(plan.map((p) => p.courseCode));
  const groups = groupsForSpecialisation(spec);
  const electiveKeys = new Set(["computing-elective", "general-elective"]);
  const claimed = claimedByOtherGroups(courses, plan, groups.filter((g) => !electiveKeys.has(g.key)));
  const computingElective = groups.find((g) => g.key === "computing-elective")!;
  const generalElective = groups.find((g) => g.key === "general-elective")!;
  const electiveAssigned = allocateElectives(courses, plan, claimed, computingElective, generalElective);

  return groups.map((group) => {
    // Display list only — never what allocateElectives (above) actually
    // scores against, which still reads the real, overlapping
    // computingElective/generalElective.courseCodes directly. Without this,
    // University Elective's "required" text would list every one of
    // Computing Elective's own COMP courses too, since their pools
    // deliberately overlap (see generalElectiveGroup's comment) — correct
    // for scoring an overflow pick, but reads as an arbitrarily huge,
    // COMP-cluttered "choose from" list on the pages that print `required`
    // as a human-readable course list (index.astro's audit, select.astro's
    // "Still to pick" aside).
    const required =
      group.key === "general-elective"
        ? courses.filter((c) => group.courseCodes.includes(c.code) && !computingElective.courseCodes.includes(c.code))
        : courses.filter((c) => group.courseCodes.includes(c.code));
    const assigned =
      group.key === "computing-elective"
        ? electiveAssigned.computing
        : group.key === "general-elective"
          ? electiveAssigned.general
          : required.filter((c) => assignedCodes.has(c.code));
    const satisfied =
      group.rule === "all"
        ? assigned.length === required.length && required.length > 0
        : group.rule === "choose-n"
          ? assigned.length >= (group.count ?? 0)
          : assigned.reduce((sum, c) => sum + c.units, 0) >= (group.units ?? 0);
    return { ...group, required, assigned, satisfied };
  });
}

// 0-100, for a CSS width/conic-gradient bar — see styles.css's .bar-fill.
// A "min-units: 0" group (an optional top-up list, see SPECIALISATION_GROUPS)
// is always shown as full: it's never outstanding, so there's nothing to
// visualise progress towards.
export function groupPercent(group: GroupProgress): number {
  if (group.rule === "all") {
    return group.required.length === 0 ? 0 : Math.round((group.assigned.length / group.required.length) * 100);
  }
  if (group.rule === "choose-n") {
    return Math.min(100, Math.round((group.assigned.length / (group.count ?? 1)) * 100));
  }
  if (!group.units) return 100;
  const earned = group.assigned.reduce((sum, c) => sum + c.units, 0);
  return Math.min(100, Math.round((earned / group.units) * 100));
}
