import type { APIRoute } from "astro";
import { assignCourse, clearSlot } from "../../lib/db";

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const term = Number(form.get("term"));
  const position = Number(form.get("position"));
  const courseCode = String(form.get("courseCode") ?? "").trim();
  const returnTo = String(form.get("returnTo") ?? "/");

  const validSlot = term >= 1 && term <= 4 && position >= 1 && position <= 4;

  if (validSlot) {
    if (courseCode) {
      assignCourse(term, position, courseCode);
    } else {
      clearSlot(term, position);
    }
  }

  return redirect(returnTo, 303);
};
