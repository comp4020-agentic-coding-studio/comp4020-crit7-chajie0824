import type { APIRoute } from "astro";
import { assignCourse, clearSlot } from "../../lib/db";

// One slot per submit: a plain HTML form POSTs (year, semester, position,
// courseCode) here, and the 303 redirect re-renders the page from SQLite —
// no client-side JavaScript needed, same pattern as the rest of the app.
// An empty courseCode clears the slot instead of assigning it.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const year = Number(form.get("year"));
  const semester = String(form.get("semester") ?? "");
  const position = Number(form.get("position"));
  const courseCode = String(form.get("courseCode") ?? "").trim();

  const validSlot =
    (year === 1 || year === 2) && (semester === "S1" || semester === "S2") && position >= 1 && position <= 4;

  if (validSlot) {
    if (courseCode) {
      assignCourse(year, semester, position, courseCode);
    } else {
      clearSlot(year, semester, position);
    }
  }

  return redirect("/", 303);
};
