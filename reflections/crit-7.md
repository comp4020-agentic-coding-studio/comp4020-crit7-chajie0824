# Crit 7 reflection

**What was the breakthrough that moved the work forward?**

The breakthrough wasn't a single fix — it was noticing that every real bug so
far had the same shape: a rule that "looked" implemented but didn't match the
handbook's exact wording once I actually re-read it. University Elective
modelled as two placeholder courses instead of "12 units from completion of
elective courses offered by ANU." Computing Elective matching only
`COMP`-prefixed codes instead of "the subject area COMP...or ENGN." Once I
named that pattern, the fix stopped being "patch the bug the user reported"
and became "go back to every group definition and check it against the
handbook line it claims to model." Being told directly — "你自己需要做全面的测试
啊" — to do that check myself, instead of waiting for the next report, was
the actual turning point: I ran a dedicated audit pass over the whole
requirement model and it found a third instance of the exact same pattern
before anyone hit it in the UI.

**What did this change about who I want to be as a developer?**

I want to be someone who treats "it passes the tests I already wrote" as the
starting line, not the finish line — the tests were fine, they just encoded
the same narrow assumption as the code they checked. A developer who's
actually earned trust goes looking for the next instance of a bug pattern
once they've found the first one, rather than treating each fix as isolated.
That's a habit, not a one-off task, and it's the one I want to carry into the
next deliverable.
