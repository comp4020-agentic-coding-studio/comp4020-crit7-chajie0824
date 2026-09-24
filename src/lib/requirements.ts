import type { Course, PlanEntry } from "./schema";

// The actual graduation rule per requirement group: "all" means every course
// tagged with that group must appear somewhere in the plan; "choose-1" means
// at least one of them does. This is the thing a real 培养方案/毕业审核
// checks the plan against — everything else in this file just evaluates it.
export const REQUIREMENT_GROUPS = [
  { key: "core", label: "Core", rule: "all" },
  { key: "foundational", label: "Foundational", rule: "choose-1" },
  { key: "capstone", label: "Capstone", rule: "choose-1" },
  { key: "spec-compulsory", label: "Professional Computing — compulsory", rule: "all" },
  { key: "spec-listA", label: "Professional Computing — list A", rule: "choose-1" },
  { key: "spec-listB", label: "Professional Computing — list B", rule: "choose-1" },
] as const satisfies readonly { key: string; label: string; rule: "all" | "choose-1" }[];

export interface GroupProgress {
  key: string;
  label: string;
  rule: "all" | "choose-1";
  required: Course[];
  assigned: Course[];
  satisfied: boolean;
}

export function computeProgress(courses: Course[], plan: PlanEntry[]): GroupProgress[] {
  const assignedCodes = new Set(plan.map((p) => p.courseCode));

  return REQUIREMENT_GROUPS.map((group) => {
    const required = courses.filter((c) => c.requirementGroup === group.key);
    const assigned = required.filter((c) => assignedCodes.has(c.code));
    const satisfied = group.rule === "all" ? assigned.length === required.length && required.length > 0 : assigned.length > 0;
    return { ...group, required, assigned, satisfied };
  });
}
