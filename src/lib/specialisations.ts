// The 7 Master of Computing (7706XMCOMP) specialisations, each 24 units —
// "a course can't be used for more than one specialisation at once" per the
// program page, but a course CAN legitimately appear on more than one
// specialisation's list (its real-world eligibility doesn't change; only
// which one it's actually counted against does, and that's the student's
// choice, not this catalogue's). Sourced from
// programsandcourses.anu.edu.au/2025/specialisation/<key>-SPEC.
export const SPECIALISATIONS = [
  { key: "ARTIF", label: "Artificial Intelligence" },
  { key: "COMP", label: "Computational Foundations" },
  { key: "CMSY", label: "Computer Systems" },
  { key: "DTSC", label: "Data Science" },
  { key: "HCCM", label: "Human-Centred and Creative Computing" },
  { key: "MCHL", label: "Machine Learning" },
  { key: "PCOM", label: "Professional Computing" },
] as const;

export type SpecialisationKey = (typeof SPECIALISATIONS)[number]["key"];

export function specialisationLabel(key: string | null): string {
  if (!key) return "Undecided";
  return SPECIALISATIONS.find((s) => s.key === key)?.label ?? key;
}

export function isSpecialisationKey(value: string): value is SpecialisationKey {
  return SPECIALISATIONS.some((s) => s.key === value);
}
