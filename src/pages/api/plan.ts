import type { APIRoute } from "astro";
import { assignCourse, clearSlot, listPlan, listPrerequisites } from "../../lib/db";
import { completedBefore, missingPrereqs } from "../../lib/prerequisites";
import { duplicateEntry } from "../../lib/plan-integrity";

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const term = Number(form.get("term"));
  const position = Number(form.get("position"));
  const courseCode = String(form.get("courseCode") ?? "").trim();
  const returnTo = String(form.get("returnTo") ?? "/");

  const validSlot = term >= 1 && term <= 4 && position >= 1 && position <= 4;

  if (validSlot) {
    if (courseCode) {
      // The <select> already disables locked/duplicate options, but a
      // direct POST must not be able to bypass either rule.
      const plan = listPlan();

      const dup = duplicateEntry(courseCode, plan, term, position);
      if (dup) {
        const separator = returnTo.includes("?") ? "&" : "?";
        return redirect(`${returnTo}${separator}duplicate=${encodeURIComponent(courseCode)}`, 303);
      }

      const completed = completedBefore(plan, term);
      const missing = missingPrereqs(courseCode, listPrerequisites(), completed);
      if (missing.length > 0) {
        const separator = returnTo.includes("?") ? "&" : "?";
        return redirect(`${returnTo}${separator}locked=${encodeURIComponent(courseCode)}`, 303);
      }

      assignCourse(term, position, courseCode);
    } else {
      clearSlot(term, position);
    }
  }

  return redirect(returnTo, 303);
};
