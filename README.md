# Course selection & graduation roadmap

The ANU system that reliably ruins a Master of Computing student's week isn't
a single broken page — it's the fact that there is no single page. Working
out whether a term's course picks actually count towards graduation means
cross-referencing the Study Options table, your specialisation's own list,
prerequisite chains, incompatible-course notes, and how many units you've
actually banked, all by hand, across several different handbook pages. This
app is that cross-reference, built for program 7706XMCOMP (crit-7's chosen
specialisation: Human-Centred and Creative Computing, though the model covers
all seven).

`/` is the course-selection page: pick a term, see what's offered, what's
locked (missing a prerequisite, a duplicate, incompatible with something
already planned, off-semester), and how picking a course moves your
outstanding requirements. `/roadmap/` is the graduation audit: every
requirement group — Core, Foundational, Capstone, your specialisation's own
24 units, Computing Elective, University Elective — with real progress bars
and a top-line "would this plan graduate you" verdict. `/completed/` is the
read-only transcript view. Picks persist in a real SQLite database
(`.data/app.db`) across reloads and restarts.

## What good looks like here

Good means a student can trust the picker not to lie to them: a course that's
disabled in the dropdown is disabled for a real, statable reason (shown as a
tooltip, not just greyed out), and a plan that shows "satisfied" against a
requirement group is one that would actually satisfy it under the real
handbook rule — not a simplified stand-in. Getting there meant reading the
handbook's own wording closely rather than approximating it: "12 units from
completion of elective courses" is not "2 named placeholder courses"; "the
subject area COMP...or ENGN" is not "any course code starting with COMP."
Both were bugs this repo shipped and then fixed once checked against the
source.

What's enforced vs. judgement call: `spec/` pins down that every page has one
h1, a real nav landmark, accessible alt text, and no double-counted
enrolment across two requirement buckets — those are checks, not opinions.
`CLAUDE.md` records the judgement calls behind them: never inventing
handbook data, keeping catalogue data separate from user data, and treating
proactive testing as the agent's own responsibility rather than something the
user has to trigger by finding a bug. What's deliberately out of scope: a
full constraint solver for list max-caps and 8000-level sub-rules some
specialisations carry — this models minimums, not every cap.
