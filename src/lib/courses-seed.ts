import type { Course } from "./schema";

// The slice of the Master of Computing catalogue (program 7706XMCOMP) this
// prototype models: the 4 core courses, the foundational and capstone
// choices, and the Professional Computing specialisation. Sourced from
// programsandcourses.anu.edu.au, 2025 offerings.
//
// Deliberately NOT every COMP course ANUHub covers. Two of this
// specialisation's own lists are open-ended in the real handbook —
// "elective list A" offers 8 choices, "list B" is literally "any 8000-level
// COMP course" — and modelling either one in full would mean re-scraping the
// whole catalogue, which is the ANUHub-shaped problem this prototype is
// trying to get away from, not rebuild. Each is represented here by a
// realistic subset instead; see README for why that's the right call for
// this slice.
export const courseSeed: readonly Course[] = [
  { code: "COMP6250", title: "Professional Practice: Holistic Thinking and Communication", units: 6, semester: "S1", requirementGroup: "core" },
  { code: "COMP6442", title: "Software Construction", units: 6, semester: "BOTH", requirementGroup: "core" },
  { code: "COMP6710", title: "Structured Programming", units: 6, semester: "BOTH", requirementGroup: "core" },
  { code: "COMP8260", title: "Professional Practice: Responsible Innovation & Leadership", units: 6, semester: "S2", requirementGroup: "core" },

  { code: "MATH6005", title: "Discrete Mathematical Models", units: 6, semester: "S1", requirementGroup: "foundational" },
  { code: "COMP6260", title: "Foundations of Computing", units: 6, semester: "S2", requirementGroup: "foundational" },

  { code: "COMP8715", title: "Advanced Computing Team Project", units: 6, semester: "BOTH", requirementGroup: "capstone" },
  { code: "COMP8830", title: "Computing Internship", units: 12, semester: "BOTH", requirementGroup: "capstone" },

  // Professional Computing (PCOM-SPEC), both compulsory courses:
  { code: "COMP6120", title: "Software Engineering", units: 6, semester: "S2", requirementGroup: "spec-compulsory" },
  { code: "ENGN8100", title: "Introduction to Systems Engineering", units: 6, semester: "S1", requirementGroup: "spec-compulsory" },
  // Elective list A (choose 1 of 8 in the real handbook) — 3 of the 8:
  { code: "COMP6240", title: "Relational Databases", units: 6, semester: "BOTH", requirementGroup: "spec-listA" },
  { code: "COMP6331", title: "Computer Networks", units: 6, semester: "S1", requirementGroup: "spec-listA" },
  { code: "COMP6390", title: "Human-Computer Interaction", units: 6, semester: "S2", requirementGroup: "spec-listA" },
  // Elective list B (real rule: any 8000-level COMP course except the
  // project courses) — 2 representative options:
  { code: "COMP8600", title: "Statistical Machine Learning", units: 6, semester: "S1", requirementGroup: "spec-listB" },
  { code: "COMP8880", title: "Computational Methods for Network Science", units: 6, semester: "S1", requirementGroup: "spec-listB" },
];
