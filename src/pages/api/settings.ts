import type { APIRoute } from "astro";
import { setCurrentTerm, setSpecialisation } from "../../lib/db";
import { isSpecialisationKey } from "../../lib/specialisations";

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  // Only a same-site relative path is honoured — a returnTo pointing off-site
  // (e.g. "//evil.example") would otherwise make this POST an open redirect.
  const submittedReturnTo = String(form.get("returnTo") ?? "/");
  const returnTo = submittedReturnTo.startsWith("/") && !submittedReturnTo.startsWith("//") ? submittedReturnTo : "/";

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
