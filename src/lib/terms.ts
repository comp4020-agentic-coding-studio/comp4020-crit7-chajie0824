// The program is 4 terms full-time; this fixes term 1 to this student's
// actual start (2025 S2) rather than modelling an abstract "Year 1 Sem 1"
// that doesn't match when they actually enrolled. `semester` is the real
// calendar S1/S2 for that term, used to check a course's offering pattern
// against the term it's assigned to.
export const TERMS = [
  { term: 1, label: "2025 S2", semester: "S2" },
  { term: 2, label: "2026 S1", semester: "S1" },
  { term: 3, label: "2026 S2", semester: "S2" },
  { term: 4, label: "2027 S1", semester: "S1" },
] as const;

export type TermStatus = "done" | "current" | "future";

export function termStatus(term: number, currentTerm: number): TermStatus {
  if (term < currentTerm) return "done";
  if (term === currentTerm) return "current";
  return "future";
}

export function termLabel(term: number): string {
  return TERMS.find((t) => t.term === term)?.label ?? `Term ${term}`;
}

export function termSemester(term: number): string {
  return TERMS.find((t) => t.term === term)?.semester ?? "";
}
