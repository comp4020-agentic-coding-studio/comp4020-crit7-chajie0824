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
// catalogue's COMP-coded courses minus whatever's already permanently
// claimed by a fixed ("all") or minimum-threshold ("min-units") group, so
// it's computed, not declared.
const ALL_COMP_CODES: readonly string[] = courseSeed
  .filter((c) => c.code.startsWith("COMP"))
  .map((c) => c.code);

// Every seeded course, COMP-coded or not — the pool generalElectiveGroup
// (below) draws from, since University Elective isn't restricted by
// subject area the way Computing Elective is.
const ALL_CATALOGUE_CODES: readonly string[] = courseSeed.map((c) => c.code);

// "choose-n" groups (foundational, capstone, a specialisation's own list-A
// style group) deliberately keep their codes in the Computing Elective
// pool: a pick beyond that group's `count` is exactly the kind of course
// that should fall through to Computing Elective instead (see
// surplusCourses below) rather than being permanently excluded here.
function fixedOrMinUnitsCodes(groups: readonly GroupDef[]): Set<string> {
  const codes = new Set<string>();
  for (const g of groups) if (g.rule !== "choose-n") g.courseCodes.forEach((c) => codes.add(c));
  return codes;
}

function computingElectiveGroup(spec: SpecialisationKey | null): GroupDef {
  const own = spec ? SPECIALISATION_GROUPS[spec] : [];
  const exclude = new Set([...fixedOrMinUnitsCodes(UNIVERSAL_GROUPS), ...fixedOrMinUnitsCodes(own)]);
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
// qualifies as "an elective course offered by ANU". So its pool is now
// computed like Computing Elective's: every catalogue code minus whatever's
// permanently owned by a fixed/min-units group, minus Computing Elective's
// own pool (a COMP course beyond its own budget still goes there first, not
// here, so the same course is never offered under both electives at once).
// The two placeholder rows stay in the pool — they still stand in for "a
// real elective from outside this whole catalogue", the ordinary case.
function generalElectiveGroup(spec: SpecialisationKey | null): GroupDef {
  const own = spec ? SPECIALISATION_GROUPS[spec] : [];
  const exclude = new Set([
    ...fixedOrMinUnitsCodes(UNIVERSAL_GROUPS),
    ...fixedOrMinUnitsCodes(own),
    ...computingElectiveGroup(spec).courseCodes,
  ]);
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

// The wasted-pick detector: "choose-n" groups (foundational, capstone,
// university elective, and each specialisation's own list-A style group)
// have a real, hard ANU cap (`count`) — a pick beyond that cap either falls
// through to Computing/University Elective (if it isn't otherwise claimed —
// see computeProgress) or advances nothing at all. "min-units" groups (list
// B/list 1/list 2 style) keep their existing soft-minimum, no-cap
// simplification (see SPECIALISATION_GROUPS's own header comment) —
// extending capping to them would reopen the already-descoped "list
// max-cap" problem, so they're left out here.
//
// `claimedBy` names the pick(s) that already used up the group's `count`
// slot(s) — the surplus course itself is never a claimant, so the banner
// can say *why* a course a student may not even remember picking (in
// another term) is the one blocking this one, rather than just naming the
// surplus course in isolation.
export interface SurplusEntry {
  course: Course;
  group: GroupDef;
  claimedBy: Course[];
}

export function surplusCourses(courses: Course[], plan: readonly PlanEntry[], spec: SpecialisationKey | null): SurplusEntry[] {
  const own = spec ? SPECIALISATION_GROUPS[spec] : [];
  const choiceGroups = [...UNIVERSAL_GROUPS, ...own].filter((g) => g.rule === "choose-n");
  const courseByCode = new Map(courses.map((c) => [c.code, c]));
  const surplus: SurplusEntry[] = [];

  for (const group of choiceGroups) {
    const ordered = picksForGroup(group, plan, courseByCode);
    const claimedBy = ordered
      .slice(0, group.count ?? 0)
      .map((pick) => courseByCode.get(pick.code))
      .filter((c): c is Course => !!c);
    ordered.slice(group.count ?? 0).forEach((pick) => {
      const course = courseByCode.get(pick.code);
      if (course && !course.code.startsWith("COMP")) surplus.push({ course, group, claimedBy });
    });
  }
  return surplus;
}

export interface GroupProgress extends GroupDef {
  required: Course[];
  assigned: Course[];
  satisfied: boolean;
}

// Every non-elective group's own choose-n/all/min-units pick(s), as actual
// plan entries — i.e. the courses a real allocation would say are "spoken
// for" by something other than Computing/University Elective. A choose-n
// group only claims up to its `count` picks (by the same claim-priority
// order as surplusCourses); "all" and "min-units" groups claim every match
// in full, since they have no notion of "beyond the cap" in this app's
// model (see SPECIALISATION_GROUPS's and surplusCourses's own comments).
//
// This is what stops the same physical enrolment counting twice: without
// it, a course that's already the (only) capstone pick, or the one course
// that filled a specialisation's choose-1 list, would *also* silently
// inflate Computing/University Elective's unit total just because its code
// happens to still sit in that elective's pool (deliberately left there so
// a genuine *overflow* pick from the same list has somewhere to fall
// through to — see computingElectiveGroup/generalElectiveGroup).
function claimedByOtherGroups(courses: Course[], plan: readonly PlanEntry[], hardGroups: readonly GroupDef[]): Set<PlanEntry> {
  const courseByCode = new Map(courses.map((c) => [c.code, c]));
  const claimed = new Set<PlanEntry>();
  for (const group of hardGroups) {
    if (group.rule === "choose-n") {
      picksForGroup(group, plan, courseByCode)
        .slice(0, group.count ?? 0)
        .forEach((pick) => pick.entries.forEach((e) => claimed.add(e)));
    } else {
      plan.forEach((e) => {
        if (group.courseCodes.includes(e.courseCode)) claimed.add(e);
      });
    }
  }
  return claimed;
}

export function computeProgress(courses: Course[], plan: PlanEntry[], spec: SpecialisationKey | null): GroupProgress[] {
  const assignedCodes = new Set(plan.map((p) => p.courseCode));
  const courseByCode = new Map(courses.map((c) => [c.code, c]));
  const groups = groupsForSpecialisation(spec);
  const electiveKeys = new Set(["computing-elective", "general-elective"]);
  const claimed = claimedByOtherGroups(courses, plan, groups.filter((g) => !electiveKeys.has(g.key)));

  return groups.map((group) => {
    const required = courses.filter((c) => group.courseCodes.includes(c.code));
    const assigned = electiveKeys.has(group.key)
      ? [...new Set(plan.filter((p) => !claimed.has(p) && group.courseCodes.includes(p.courseCode)).map((p) => p.courseCode))]
          .map((code) => courseByCode.get(code))
          .filter((c): c is Course => !!c)
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
