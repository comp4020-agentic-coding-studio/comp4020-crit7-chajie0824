import type { APIRoute } from "astro";
import { setCurrentTerm, setSpecialisation } from "../../lib/db";
import { isSpecialisationKey } from "../../lib/specialisations";

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const returnTo = String(form.get("returnTo") ?? "/");

  // Both fields are optional per submission — index.astro posts them from
  // two separate forms, so only one is ever present in a given request.
  if (form.has("currentTerm")) {
    const currentTerm = Number(form.get("currentTerm"));
    if (currentTerm >= 1 && currentTerm <= 4) {
      setCurrentTerm(currentTerm);
    }
  }

  if (form.has("specialisation")) {
    const specialisation = String(form.get("specialisation") ?? "");
    setSpecialisation(isSpecialisationKey(specialisation) ? specialisation : null);
  }

  return redirect(returnTo, 303);
};
