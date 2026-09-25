// Real ANU prerequisite chains (programsandcourses.anu.edu.au) for the
// slice of the catalogue this prototype models — not exhaustive of every
// real prerequisite (e.g. the math co-requisite on COMP6442), just the
// ones expressible against courses actually in courses-seed.ts.
export const prerequisiteSeed: readonly { courseCode: string; requiresCode: string }[] = [
  { courseCode: "COMP6442", requiresCode: "COMP6710" },
  { courseCode: "COMP8715", requiresCode: "COMP6442" },
  { courseCode: "COMP8715", requiresCode: "COMP8260" },
  { courseCode: "COMP8830", requiresCode: "COMP6442" },
  { courseCode: "COMP8830", requiresCode: "COMP8260" },
  { courseCode: "COMP8020", requiresCode: "COMP6390" },
];
