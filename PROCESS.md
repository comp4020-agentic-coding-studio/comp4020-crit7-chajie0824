# Process overview

Written by me, for a reader: how I got from the brief to the harness and
agentic workflow behind this submission. The course site's
[assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#what-you-submit)
is the requirement; this is my account against it.

## What I built

The course-selection and graduation-roadmap tool `README.md` describes: a
picker that won't let you plan an invalid term, and an audit that tells you
honestly whether your plan graduates you under the real 7706XMCOMP rules.

## How I got here

Most of this crit's work was closing the gap between "the model looks right"
and "the model matches the handbook." Two real bugs surfaced from actually
reading the handbook's exact wording rather than trusting an earlier
approximation: University Elective was hard-coded to two placeholder courses
instead of the whole postgraduate catalogue
([`7a9f929`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-chajie0824/commit/7a9f929)),
and an overflow pick beyond a specialisation list's own minimum silently
vanished instead of falling through to Computing/University Elective
([`daacca7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-chajie0824/commit/daacca7)).

I directed a full self-audit rather than waiting for the next bug report —
prompt: "你自己需要做全面的测试啊" (you need to do the comprehensive testing
yourself) — which surfaced a third: Computing Elective only recognised
`COMP`-prefixed codes, not the handbook's actual "COMP or ENGN" wording, fixed
in
[`5839660`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-chajie0824/commit/5839660)
alongside an unvalidated `returnTo` redirect. The same session moved course
selection to `/` and the audit to `/roadmap/`
([`a4512bd`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-chajie0824/commit/a4512bd)),
since this is a selection tool first — the roadmap is a secondary view, not
the front door.

## Before you ship

`pnpm check:evidence` verifies that this comment is gone, that your citations
resolve to real commits, that a crit week's reflection entry is in
`reflections/`, and that your `CLAUDE.md` is there. It checks that your
account is traceable, not that it is good: that is the marker's call.
