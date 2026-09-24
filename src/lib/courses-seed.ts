import type { Course } from "./schema";

// The slice of the Master of Computing catalogue (program 7706XMCOMP) this
// prototype models: the 4 core courses, the foundational and capstone
// choices, the Professional Computing specialisation, and the program's
// separate "University Elective" requirement. Sourced from
// programsandcourses.anu.edu.au, 2025 offerings.
//
// Deliberately NOT every COMP course ANUHub covers. Three of this
// program's own lists are open-ended in the real handbook — spec "elective
// list A" offers 8 choices, spec "list B" is literally "any 8000-level
// COMP course", and "University Elective" is literally any ANU course
// (any faculty, subject to convenor approval) — and modelling any of them
// in full would mean re-scraping the whole catalogue, which is the
// ANUHub-shaped problem this prototype is trying to get away from, not
// rebuild. Each is represented here by a realistic subset instead; see
// README for why that's the right call for this slice.
//
// `rating` is illustrative demo data (see schema.ts) — not sourced from ANU.
export const courseSeed: readonly Course[] = [
  { code: "COMP6250", title: "Professional Practice: Holistic Thinking and Communication", units: 6, semester: "S1", requirementGroup: "core", rating: 4.2, termSpan: 1 },
  { code: "COMP6442", title: "Software Construction", units: 6, semester: "BOTH", requirementGroup: "core", rating: 4.5, termSpan: 1 },
  { code: "COMP6710", title: "Structured Programming", units: 6, semester: "BOTH", requirementGroup: "core", rating: 4.6, termSpan: 1 },
  { code: "COMP8260", title: "Professional Practice: Responsible Innovation & Leadership", units: 6, semester: "S2", requirementGroup: "core", rating: 4.0, termSpan: 1 },

  { code: "MATH6005", title: "Discrete Mathematical Models", units: 6, semester: "S1", requirementGroup: "foundational", rating: 3.8, termSpan: 1 },
  { code: "COMP6260", title: "Foundations of Computing", units: 6, semester: "S2", requirementGroup: "foundational", rating: 4.1, termSpan: 1 },

  // COMP8715 is a year-long project: 6 units per semester, 12 total, taken
  // across two consecutive terms — termSpan: 2 models that precisely,
  // rather than treating it as one 6-unit, one-term course.
  { code: "COMP8715", title: "Advanced Computing Team Project", units: 6, semester: "BOTH", requirementGroup: "capstone", rating: 4.4, termSpan: 2 },
  { code: "COMP8830", title: "Computing Internship", units: 12, semester: "BOTH", requirementGroup: "capstone", rating: 4.3, termSpan: 1 },

  // Professional Computing (PCOM-SPEC), both compulsory courses:
  { code: "COMP6120", title: "Software Engineering", units: 6, semester: "S2", requirementGroup: "spec-compulsory", rating: 4.0, termSpan: 1 },
  { code: "ENGN8100", title: "Introduction to Systems Engineering", units: 6, semester: "S1", requirementGroup: "spec-compulsory", rating: 3.9, termSpan: 1 },
  // Elective list A (choose 1 of 8 in the real handbook) — 3 of the 8:
  { code: "COMP6240", title: "Relational Databases", units: 6, semester: "BOTH", requirementGroup: "spec-listA", rating: 4.2, termSpan: 1 },
  { code: "COMP6331", title: "Computer Networks", units: 6, semester: "S1", requirementGroup: "spec-listA", rating: 4.0, termSpan: 1 },
  { code: "COMP6390", title: "Human-Computer Interaction", units: 6, semester: "S2", requirementGroup: "spec-listA", rating: 4.5, termSpan: 1 },
  // Elective list B (real rule: any 8000-level COMP course except the
  // project courses) — 2 representative options:
  { code: "COMP8600", title: "Statistical Machine Learning", units: 6, semester: "S1", requirementGroup: "spec-listB", rating: 4.6, termSpan: 1 },
  { code: "COMP8880", title: "Computational Methods for Network Science", units: 6, semester: "S1", requirementGroup: "spec-listB", rating: 4.1, termSpan: 1 },

  // University Elective ("校选课"): the 2025 program structure requires 12
  // units of elective courses from ANY ANU faculty (not just COMP/ENGN),
  // split into two 6-unit slots — see
  // https://programsandcourses.anu.edu.au/2025/program/7706xmcomp. These
  // two are real ANU courses picked as illustrative representatives of an
  // otherwise open catalogue (same non-exhaustive-subset treatment as spec
  // list A/B above); their exact offered-semester pattern didn't come back
  // from ANU's site when checked, so semester is left as "BOTH" rather
  // than asserting an unverified specific one.
  { code: "PHIL1005", title: "Logic and Critical Thinking", units: 6, semester: "BOTH", requirementGroup: "general-elective", rating: 4.3, termSpan: 1 },
  { code: "POLS1002", title: "Introduction to Politics", units: 6, semester: "BOTH", requirementGroup: "general-elective", rating: 4.1, termSpan: 1 },
];
