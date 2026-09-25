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
// core, foundational, capstone and university-elective rules. Always in
// force, whether or not a specialisation has been chosen yet.
export const UNIVERSAL_GROUPS: readonly GroupDef[] = [
  { key: "core", label: "Core", rule: "all", courseCodes: ["COMP6250", "COMP6442", "COMP6710", "COMP8260"] },
  { key: "foundational", label: "Foundational", rule: "choose-n", count: 1, courseCodes: ["MATH6005", "COMP6260"] },
  { key: "capstone", label: "Capstone", rule: "choose-n", count: 1, courseCodes: ["COMP8715", "COMP8830"] },
  { key: "general-elective", label: "University elective (any faculty)", rule: "choose-n", count: 2, courseCodes: ["PHIL1005", "POLS1002"] },
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

// What the graduation-audit panels (index.astro, completed.astro,
// select.astro's aside) check against: the universal groups always, plus
// the chosen specialisation's own groups once one is picked, plus the
// Computing Elective bucket. `null` (or any key that isn't a real
// specialisation) means "undecided" — a real, supported state — so only
// the universal groups (and Computing Elective) apply until the student
// commits.
export function groupsForSpecialisation(spec: SpecialisationKey | null): readonly GroupDef[] {
  if (!spec) return [...UNIVERSAL_GROUPS, computingElectiveGroup(null)];
  return [...UNIVERSAL_GROUPS, ...SPECIALISATION_GROUPS[spec], computingElectiveGroup(spec)];
}

// What the course picker (select.astro's <select>) offers: every group from
// every specialisation, not just the active one — choosing courses doesn't
// require having committed to a specialisation first (a course legitimately
// appearing under more than one specialisation just gets more than one
// optgroup, same as it would on the real handbook). Computing Elective here
// uses the undecided (universal-only) exclusion set, since no single spec
// is active in this "browse everything" context.
export function allGroups(): readonly GroupDef[] {
  return [...UNIVERSAL_GROUPS, ...SPECIALISATIONS.flatMap((s) => SPECIALISATION_GROUPS[s.key]), computingElectiveGroup(null)];
}

// The wasted-pick detector: "choose-n" groups (foundational, capstone,
// university elective, and each specialisation's own list-A style group)
// have a real, hard ANU cap (`count`) — a pick beyond that cap either falls
// through to Computing Elective (if COMP-coded) or advances nothing at all
// (if not). "min-units" groups (list B/list 1/list 2 style) keep their
// existing soft-minimum, no-cap simplification (see SPECIALISATION_GROUPS's
// own header comment) — extending capping to them would reopen the
// already-descoped "list max-cap" problem, so they're left out here.
export function surplusCourses(courses: Course[], plan: readonly PlanEntry[], spec: SpecialisationKey | null): Course[] {
  const own = spec ? SPECIALISATION_GROUPS[spec] : [];
  const choiceGroups = [...UNIVERSAL_GROUPS, ...own].filter((g) => g.rule === "choose-n");
  const courseByCode = new Map(courses.map((c) => [c.code, c]));
  const surplus: Course[] = [];

  for (const group of choiceGroups) {
    const matches = plan
      .filter((p) => group.courseCodes.includes(p.courseCode))
      .slice()
      .sort((a, b) => a.term - b.term || a.position - b.position);
    matches.slice(group.count ?? 0).forEach((entry) => {
      const course = courseByCode.get(entry.courseCode);
      if (course && !course.code.startsWith("COMP")) surplus.push(course);
    });
  }
  return surplus;
}

export interface GroupProgress extends GroupDef {
  required: Course[];
  assigned: Course[];
  satisfied: boolean;
}

export function computeProgress(courses: Course[], plan: PlanEntry[], spec: SpecialisationKey | null): GroupProgress[] {
  const assignedCodes = new Set(plan.map((p) => p.courseCode));

  return groupsForSpecialisation(spec).map((group) => {
    const required = courses.filter((c) => group.courseCodes.includes(c.code));
    const assigned = required.filter((c) => assignedCodes.has(c.code));
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
