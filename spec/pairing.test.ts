import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, inject, it } from "vitest";

// Term-spanning courses (Course.termSpan > 1 — currently only COMP8715, a
// year-long project) auto-pair across two consecutive terms: placing one
// half writes the other automatically, and both halves lock against being
// switched to a different course (still clearable, which cascades both
// halves away). These tests drive the running server the same way
// invariants.test.ts does, but exercise POST /api/plan directly since
// that's where this whole feature lives.
//
// The scenarios below build on each other and share one server/database
// (see spec/global-setup.ts), so they run in a fixed order and each one's
// setup step explicitly notes what state it depends on and leaves behind.
const baseUrl = inject("baseUrl");

interface SlotValues {
  1?: string;
  2?: string;
  3?: string;
  4?: string;
}

async function postPlan(term: number, values: SlotValues): Promise<{ status: number; location: string | null }> {
  const body = new URLSearchParams({ term: String(term), returnTo: `/?term=${term}` });
  for (const position of [1, 2, 3, 4] as const) {
    body.set(`courseCode-${position}`, values[position] ?? "");
  }
  const res = await fetch(new URL("/api/plan", baseUrl), {
    method: "POST",
    redirect: "manual",
    headers: { Origin: baseUrl, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  return { status: res.status, location: res.headers.get("location") };
}

async function getSelect(term: number): Promise<Document> {
  const res = await fetch(new URL(`/?term=${term}`, baseUrl));
  const dom = new JSDOM(await res.text());
  return dom.window.document;
}

function slotSelect(doc: Document, position: number): HTMLSelectElement {
  const el = doc.querySelector(`#select-${position}`);
  if (!el) throw new Error(`no #select-${position} on the page`);
  return el as HTMLSelectElement;
}

function selectedValue(select: HTMLSelectElement): string {
  return (select.querySelector("option[selected]") as HTMLOptionElement | null)?.value ?? "";
}

function nonEmptyOptionsAllDisabled(select: HTMLSelectElement): boolean {
  const options = [...select.querySelectorAll("option")].filter((o) => o.getAttribute("value") !== "");
  const selfCode = selectedValue(select);
  return options.every((o) => o.getAttribute("value") === selfCode || o.hasAttribute("disabled"));
}

function option(select: HTMLSelectElement, code: string): HTMLOptionElement {
  const el = select.querySelector(`option[value="${code}"]`);
  if (!el) throw new Error(`no option for ${code}`);
  return el as HTMLOptionElement;
}

describe("term-span auto-pairing", () => {
  // Foundation for every COMP8715 placement below: COMP6710 + COMP8260 in
  // term 1, COMP6442 in term 2, so completedBefore(term >= 3) always
  // satisfies COMP8715's prerequisites (COMP6442, COMP8260).
  beforeAll(async () => {
    const r1 = await postPlan(1, { 1: "COMP6710", 2: "COMP8260" });
    expect(r1.status).toBe(303);
    const r2 = await postPlan(2, { 1: "COMP6442" });
    expect(r2.status).toBe(303);
  });

  it("auto-fills forward into the adjacent term at the same position", async () => {
    const res = await postPlan(3, { 1: "COMP8715" });
    expect(res.status).toBe(303);
    expect(res.location).not.toContain("noroom");
    expect(res.location).not.toContain("paired");

    const term3 = await getSelect(3);
    const term4 = await getSelect(4);
    expect(selectedValue(slotSelect(term3, 1))).toBe("COMP8715");
    expect(selectedValue(slotSelect(term4, 1))).toBe("COMP8715");
    expect(nonEmptyOptionsAllDisabled(slotSelect(term3, 1))).toBe(true);
    expect(nonEmptyOptionsAllDisabled(slotSelect(term4, 1))).toBe(true);

    // Clean up: clearing either half cascades to the other (existing
    // clearSlot behaviour, unchanged by this feature).
    const clear = await postPlan(3, {});
    expect(clear.status).toBe(303);
    const term3After = await getSelect(3);
    const term4After = await getSelect(4);
    expect(selectedValue(slotSelect(term3After, 1))).toBe("");
    expect(selectedValue(slotSelect(term4After, 1))).toBe("");
  });

  it("falls back to the previous term when the next one is out of range", async () => {
    // Term 4 has no term 5 to fill forward, so a fresh placement here must
    // fall back to term 3 (position 1 is free after the previous test's
    // cleanup).
    const res = await postPlan(4, { 1: "COMP8715" });
    expect(res.status).toBe(303);
    expect(res.location).not.toContain("noroom");

    const term3 = await getSelect(3);
    const term4 = await getSelect(4);
    expect(selectedValue(slotSelect(term3, 1))).toBe("COMP8715");
    expect(selectedValue(slotSelect(term4, 1))).toBe("COMP8715");

    const clear = await postPlan(4, {});
    expect(clear.status).toBe(303);
    const term3After = await getSelect(3);
    const term4After = await getSelect(4);
    expect(selectedValue(slotSelect(term3After, 1))).toBe("");
    expect(selectedValue(slotSelect(term4After, 1))).toBe("");
  });

  it("rejects the whole batch atomically when neither adjacent slot is free", async () => {
    // Occupy position 2 on both sides of term 3 with two different
    // ordinary (termSpan: 1) courses, so a fresh COMP8715 placement at
    // term 3 position 2 has nowhere to put its second half.
    const r1 = await postPlan(2, { 1: "COMP6442", 2: "UNIV-ELEC-1" });
    expect(r1.status).toBe(303);
    const r2 = await postPlan(4, { 2: "UNIV-ELEC-2" });
    expect(r2.status).toBe(303);

    const before = await getSelect(3);
    expect(selectedValue(slotSelect(before, 2))).toBe("");

    const res = await postPlan(3, { 2: "COMP8715" });
    expect(res.status).toBe(303);
    expect(res.location).toContain("noroom=COMP8715");
    expect(res.location).toContain("slot=2");

    // Nothing in term 3 was written — not even the other 3 slots of this
    // same batch.
    const after = await getSelect(3);
    expect(selectedValue(slotSelect(after, 1))).toBe("");
    expect(selectedValue(slotSelect(after, 2))).toBe("");
    expect(selectedValue(slotSelect(after, 3))).toBe("");
    expect(selectedValue(slotSelect(after, 4))).toBe("");
  });

  it("locks a paired slot against switching to a different course, but still allows clearing", async () => {
    const placed = await postPlan(3, { 3: "COMP8715" });
    expect(placed.status).toBe(303);
    const afterPlace = await getSelect(3);
    expect(selectedValue(slotSelect(afterPlace, 3))).toBe("COMP8715");
    const term4Paired = await getSelect(4);
    expect(selectedValue(slotSelect(term4Paired, 3))).toBe("COMP8715");

    const switched = await postPlan(3, { 3: "COMP6240" });
    expect(switched.status).toBe(303);
    expect(switched.location).toContain("paired=COMP6240");
    expect(switched.location).toContain("slot=3");

    const afterSwitch = await getSelect(3);
    expect(selectedValue(slotSelect(afterSwitch, 3))).toBe("COMP8715");

    const cleared = await postPlan(3, {});
    expect(cleared.status).toBe(303);
    const afterClear3 = await getSelect(3);
    const afterClear4 = await getSelect(4);
    expect(selectedValue(slotSelect(afterClear3, 3))).toBe("");
    expect(selectedValue(slotSelect(afterClear4, 3))).toBe("");
  });

  it("still supports a plain in-batch swap and atomic rejection for ordinary courses", async () => {
    // term 1 currently holds COMP6710 (slot 1) + COMP8260 (slot 2) from
    // this file's beforeAll — swap them in one submission.
    const swap = await postPlan(1, { 1: "COMP8260", 2: "COMP6710" });
    expect(swap.status).toBe(303);
    const afterSwap = await getSelect(1);
    expect(selectedValue(slotSelect(afterSwap, 1))).toBe("COMP8260");
    expect(selectedValue(slotSelect(afterSwap, 2))).toBe("COMP6710");

    // Adding a second slot with a course already in this term (termSpan 1)
    // must reject the whole batch, leaving the swap above untouched.
    const dup = await postPlan(1, { 1: "COMP8260", 2: "COMP6710", 4: "COMP8260" });
    expect(dup.status).toBe(303);
    expect(dup.location).toContain("duplicate=COMP8260");

    const afterDup = await getSelect(1);
    expect(selectedValue(slotSelect(afterDup, 1))).toBe("COMP8260");
    expect(selectedValue(slotSelect(afterDup, 2))).toBe("COMP6710");
    expect(selectedValue(slotSelect(afterDup, 4))).toBe("");
  });
});

// COMP8715 and COMP8830 are the program's two capstone alternatives — ANU's
// own course page says they're incompatible, so completing one must lock
// out the other everywhere in the plan, not just the same term (see
// plan-integrity.ts's checkIncompatible). Appended to this file rather than
// a separate one so it shares the suite's guaranteed sequential ordering
// instead of racing pairing's own term-3/term-4 usage in a parallel worker.
// By this point COMP6442 and COMP8260 (both courses' shared prerequisite)
// are already completed in terms 1-2, term 3 is empty, and only term 4
// slot 2 is occupied (UNIV-ELEC-2) — see the describe block above.
describe("incompatible courses", () => {
  it("rejects placing the incompatible course once the other is anywhere in the plan", async () => {
    const placed = await postPlan(3, { 1: "COMP8715" });
    expect(placed.status).toBe(303);
    expect(placed.location).not.toContain("noroom");

    const rejected = await postPlan(3, { 3: "COMP8830" });
    expect(rejected.status).toBe(303);
    expect(rejected.location).toContain("incompatible=COMP8830");
    expect(rejected.location).toContain("slot=3");

    const term3 = await getSelect(3);
    expect(selectedValue(slotSelect(term3, 3))).toBe("");
  });

  it("shows the other course locked with a reason in the picker", async () => {
    const term3 = await getSelect(3);
    const comp8830 = option(slotSelect(term3, 3), "COMP8830");
    expect(comp8830.hasAttribute("disabled")).toBe(true);
    expect(comp8830.textContent).toContain("🚫");
    expect(comp8830.textContent).toContain("incompatible with COMP8715");
  });

  it("unlocks again once the incompatible course is cleared", async () => {
    // COMP8715 spans two terms and auto-paired forward into term 4 slot 1 —
    // clearing either half cascades to the other.
    const cleared = await postPlan(3, { 1: "" });
    expect(cleared.status).toBe(303);
    const term3 = await getSelect(3);
    const term4 = await getSelect(4);
    expect(selectedValue(slotSelect(term3, 1))).toBe("");
    expect(selectedValue(slotSelect(term4, 1))).toBe("");

    const comp8830 = option(slotSelect(term3, 3), "COMP8830");
    expect(comp8830.hasAttribute("disabled")).toBe(false);

    const placed = await postPlan(3, { 3: "COMP8830" });
    expect(placed.status).toBe(303);
    const after = await getSelect(3);
    expect(selectedValue(slotSelect(after, 3))).toBe("COMP8830");
  });
});
