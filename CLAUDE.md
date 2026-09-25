# Your harness

This file is yours, and it arrives empty on purpose. The rules you hold the
agent to are part of what gets marked, so they should be rules you decided on.

Nothing about the starter is recorded here. What the repo ships is explained
where it lives --- `fly.toml`, the `Dockerfile`, the CI workflow and
`spec/README.md` each say what they fix --- and the
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec. Read them before you plan or build;
what the agent needs to carry from any of it is your call.

## Rules decided this session

- **Never invent course, rule, or requirement data.** Every course code, unit
  count, prerequisite, incompatibility, and specialisation list in
  `src/lib/courses-seed.ts` / `requirements.ts` must trace back to a live fetch
  of `programsandcourses.anu.edu.au`, not memory or a plausible guess. The same
  goes for anything written into project documentation: verify the real
  crit-7 spec (via the `comp4020:handbook` skill or a direct fetch) before
  writing a claim about what's required.
- **Catalogue/rule data vs. user data are different things.** `courses`,
  `prerequisites`, and `incompatibilities` are fixed reference data, seeded
  once and read-only at runtime. Only `planEntries` and `settings` are real
  user state in `.data/app.db`. Don't conflate the two when reasoning about
  what a migration or a reset touches.
- **Astro frontmatter is plain TypeScript, not TSX.** No JSX literals
  (`<>...</>`, bare `<strong>`) above the second `---` — they only work in the
  template body. `astro check` catches this, but so should you before running
  it.
- **No client-side JS.** Every interaction is a real HTML form or link, server
  round-trip, redirect. Don't reach for `<script>` to fix a UX rough edge —
  fix it in the markup, CSS, or server logic instead.
- **`pnpm check` (typecheck + build + tests) must be green before every
  commit**, not just before submitting. A red `pnpm check` means the commit
  doesn't happen yet.
- **Comprehensive testing is the agent's job, not the user's.** Don't wait for
  the user to hand you a bug report — after a non-trivial change, actively
  hunt for the next one yourself (edge cases in the requirement-group model,
  the elective-allocation logic, redirect/input handling) before calling the
  work done.
- **Commit in logically-scoped chunks as work lands; never push to `origin`
  without an explicit ask**, even after the user has approved a push once
  before.
