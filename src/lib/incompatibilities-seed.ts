// ANU's real "Incompatible With" pairs, restricted to pairs where BOTH
// courses are in this prototype's catalogue (courses-seed.ts) — most real
// incompatibilities pair a postgrad course against its undergrad co-taught
// twin (e.g. COMP8620 vs COMP4620), which this program-7706XMCOMP-only
// catalogue never seeds, so checking against those would be dead code.
// Checked against programsandcourses.anu.edu.au/2025/course/<code> this
// session. Each pair is listed once — plan-integrity.ts's checkIncompatible
// looks both directions.
export const incompatibilitySeed: readonly { courseCode: string; withCode: string }[] = [
  // The program's two capstone alternatives — COMP8715's own course page
  // says "Incompatible with COMP8755 and COMP8830 and COMP8800."; only
  // COMP8830 is in this catalogue's capstone group.
  { courseCode: "COMP8715", withCode: "COMP8830" },
];
