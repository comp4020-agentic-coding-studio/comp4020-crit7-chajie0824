import type { APIRoute } from "astro";
import { setCurrentTerm } from "../../lib/db";

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const currentTerm = Number(form.get("currentTerm"));
  const returnTo = String(form.get("returnTo") ?? "/");

  if (currentTerm >= 1 && currentTerm <= 4) {
    setCurrentTerm(currentTerm);
  }

  return redirect(returnTo, 303);
};
