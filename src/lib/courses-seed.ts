import type { Course } from "./schema";

// The Master of Computing catalogue (program 7706XMCOMP) this prototype
// models: the program-wide core/foundational/capstone/university-elective
// requirements, plus all 7 specialisations. Sourced from
// programsandcourses.anu.edu.au, 2025 offerings, checked this session.
//
// Which requirement group(s) each course counts towards is NOT stored on
// the row here — see src/lib/requirements.ts and src/lib/specialisations.ts
// for that mapping, since a course can count under more than one group
// (even more than one specialisation's group) depending on the student's
// choice.
//
// The program's "University Elective" (any ANU course, any faculty) is
// genuinely open-ended in the real handbook — any 6-unit course from
// outside the program counts, so naming 2 specific real courses would
// misrepresent it as a fixed choice. Modelled instead as 2 identical
// generic placeholder rows (UNIV-ELEC-1/2, not real ANU codes) — see the
// University Elective comment further down. PCOM's "any 8000-level COMP
// course" list is different: since every 8000-level COMP course this app
// already seeds for the other 6 specialisations is real, PCOM's list B is
// simply every one of them that isn't a project/capstone course — see
// requirements.ts's pcom-listB for the exact set and reasoning.
//
// `rating` is illustrative demo data (see schema.ts) — not sourced from
// ANU. `semester` defaults to "BOTH" for courses whose specific offering
// pattern didn't come back from ANU's specialisation pages when checked,
// rather than asserting an unverified S1/S2.
export const courseSeed: readonly Course[] = [
  // Program-wide core (24u, all 4 compulsory)
  { code: "COMP6250", title: "Professional Practice: Holistic Thinking and Communication", units: 6, semester: "S1", rating: 4.2, termSpan: 1 },
  { code: "COMP6442", title: "Software Construction", units: 6, semester: "BOTH", rating: 4.5, termSpan: 1 },
  { code: "COMP6710", title: "Structured Programming", units: 6, semester: "BOTH", rating: 4.6, termSpan: 1 },
  { code: "COMP8260", title: "Professional Practice: Responsible Innovation & Leadership", units: 6, semester: "S2", rating: 4.0, termSpan: 1 },

  // Foundational, choose 1 (6u)
  { code: "MATH6005", title: "Discrete Mathematical Models", units: 6, semester: "S1", rating: 3.8, termSpan: 1 },
  { code: "COMP6260", title: "Foundations of Computing", units: 6, semester: "S2", rating: 4.1, termSpan: 1 },

  // Capstone, choose 1 (12u). COMP8715 is a year-long project: 6 units per
  // semester, 12 total, taken across two consecutive terms — termSpan: 2
  // models that precisely, rather than treating it as one 6-unit,
  // one-term course.
  { code: "COMP8715", title: "Advanced Computing Team Project", units: 6, semester: "BOTH", rating: 4.4, termSpan: 2 },
  { code: "COMP8830", title: "Computing Internship", units: 12, semester: "BOTH", rating: 4.3, termSpan: 1 },

  // University Elective ("校选课"): 12 units, any faculty, any ANU course —
  // genuinely open-ended in the real handbook (any 6-unit course from
  // outside the program counts), so rather than pick 2 arbitrary named
  // courses to stand in for an unbounded catalogue, this is modelled as 2
  // identical generic placeholder slots. Picking either one just means "a
  // university elective goes here" — see requirements.ts's general-elective
  // group, capped at 2 by there being exactly 2 rows.
  { code: "UNIV-ELEC-1", title: "University elective (any faculty)", units: 6, semester: "BOTH", rating: 4.0, termSpan: 1 },
  { code: "UNIV-ELEC-2", title: "University elective (any faculty)", units: 6, semester: "BOTH", rating: 4.0, termSpan: 1 },

  // Professional Computing (PCOM-SPEC)
  { code: "COMP6120", title: "Software Engineering", units: 6, semester: "S2", rating: 4.0, termSpan: 1 },
  { code: "ENGN8100", title: "Introduction to Systems Engineering", units: 6, semester: "S1", rating: 3.9, termSpan: 1 },
  { code: "COMP6240", title: "Relational Databases", units: 6, semester: "BOTH", rating: 4.2, termSpan: 1 },
  { code: "COMP6331", title: "Computer Networks", units: 6, semester: "S1", rating: 4.0, termSpan: 1 },
  { code: "COMP6390", title: "Human-Computer Interaction", units: 6, semester: "S2", rating: 4.5, termSpan: 1 },
  { code: "INFS8004", title: "Enterprise Systems and Strategy", units: 6, semester: "BOTH", rating: 3.9, termSpan: 1 },
  { code: "INFS8205", title: "Digital Strategy, Executive and Operations", units: 6, semester: "BOTH", rating: 3.8, termSpan: 1 },
  { code: "LAWS8445", title: "Information Technology Law", units: 6, semester: "BOTH", rating: 4.0, termSpan: 1 },
  { code: "MGMT7020", title: "Technology and Project Management", units: 6, semester: "BOTH", rating: 4.1, termSpan: 1 },
  { code: "REGN8014", title: "Contemporary Issues in Technology Governance", units: 6, semester: "BOTH", rating: 3.7, termSpan: 1 },
  // PCOM's "any 8000-level COMP course" list B — genuinely open-ended in the
  // real handbook, represented by 2 illustrative options:
  { code: "COMP8600", title: "Statistical Machine Learning", units: 6, semester: "S1", rating: 4.6, termSpan: 1 },
  { code: "COMP8880", title: "Computational Methods for Network Science", units: 6, semester: "S1", rating: 4.1, termSpan: 1 },

  // Artificial Intelligence (ARTIF-SPEC) — all 4 compulsory, 24u, no
  // electives
  { code: "COMP6262", title: "Logic", units: 6, semester: "S1", rating: 4.0, termSpan: 1 },
  { code: "COMP6320", title: "Artificial Intelligence", units: 6, semester: "S1", rating: 4.5, termSpan: 1 },
  { code: "COMP8620", title: "Advanced Topics in Artificial Intelligence", units: 6, semester: "S2", rating: 4.3, termSpan: 1 },
  { code: "COMP8691", title: "Optimisation", units: 6, semester: "S2", rating: 4.2, termSpan: 1 },

  // Computational Foundations (COMP-SPEC)
  { code: "COMP6361", title: "Principles of Programming Languages", units: 6, semester: "S1", rating: 4.1, termSpan: 1 },
  { code: "COMP6363", title: "Theory of Computation", units: 6, semester: "S1", rating: 3.9, termSpan: 1 },
  { code: "COMP8011", title: "Advanced Topics in Formal Methods and Programming Languages", units: 6, semester: "BOTH", rating: 3.8, termSpan: 1 },
  { code: "COMP8460", title: "Advanced Algorithms", units: 6, semester: "S1", rating: 4.4, termSpan: 1 },
  { code: "MATH6114", title: "Number Theory and Cryptography", units: 6, semester: "BOTH", rating: 4.0, termSpan: 1 },
  { code: "MATH8343", title: "Foundations of Mathematics", units: 6, semester: "S1", rating: 3.9, termSpan: 1 },
  { code: "COMP6261", title: "Information Theory", units: 6, semester: "S2", rating: 4.0, termSpan: 1 },
  { code: "COMP6466", title: "Algorithms", units: 6, semester: "BOTH", rating: 4.3, termSpan: 1 },
  { code: "COMP8712", title: "Compiler Construction", units: 6, semester: "BOTH", rating: 4.2, termSpan: 1 },

  // Computer Systems (CMSY-SPEC)
  { code: "COMP8300", title: "Parallel Systems", units: 6, semester: "BOTH", rating: 4.1, termSpan: 1 },
  { code: "COMP8045", title: "Advanced Topics in Computer Systems & Architecture", units: 6, semester: "BOTH", rating: 3.9, termSpan: 1 },
  { code: "COMP6310", title: "Systems Networks and Concurrency", units: 6, semester: "BOTH", rating: 4.0, termSpan: 1 },
  { code: "COMP6330", title: "Operating Systems", units: 6, semester: "BOTH", rating: 4.4, termSpan: 1 },
  { code: "COMP6464", title: "High Performance Scientific Computing", units: 6, semester: "BOTH", rating: 4.0, termSpan: 1 },
  { code: "ENGN6213", title: "Digital Systems and Microprocessors", units: 6, semester: "BOTH", rating: 3.8, termSpan: 1 },

  // Data Science (DTSC-SPEC)
  { code: "COMP8410", title: "Data Mining", units: 6, semester: "BOTH", rating: 4.3, termSpan: 1 },
  { code: "COMP8430", title: "Data Wrangling", units: 6, semester: "BOTH", rating: 4.1, termSpan: 1 },
  { code: "COMP6490", title: "Document Analysis", units: 6, semester: "S2", rating: 3.9, termSpan: 1 },
  { code: "COMP6670", title: "Introduction to Machine Learning", units: 6, semester: "S2", rating: 4.4, termSpan: 1 },
  { code: "STAT6039", title: "Principles of Mathematical Statistics", units: 6, semester: "BOTH", rating: 3.8, termSpan: 1 },
  // Shared with Machine Learning's own list below — checked this session
  // against both DTSC-SPEC and MCHL-SPEC.
  { code: "COMP8650", title: "Advanced Topics in Machine Learning", units: 6, semester: "S2", rating: 4.3, termSpan: 1 },

  // Human-Centred and Creative Computing (HCCM-SPEC)
  { code: "COMP8350", title: "Sound and Music Computing", units: 6, semester: "S1", rating: 4.2, termSpan: 1 },
  { code: "COMP8539", title: "Advanced Topics in Computer Vision", units: 6, semester: "S2", rating: 4.0, termSpan: 1 },
  { code: "COMP8610", title: "Computer Graphics", units: 6, semester: "S1", rating: 4.3, termSpan: 1 },
  // Co-taught with COMP4020 (this crit course's own postgrad pairing) — a
  // valid substitute for COMP8350 or COMP8539 per SoCo's own substitutions
  // list, so it joins hccm-list1 as a peer rather than modelling a separate
  // 1:1 substitution chain.
  { code: "COMP8020", title: "Advanced Topics in Human-Centred and Creative Computing", units: 6, semester: "S2", rating: 5.0, termSpan: 1 },
  { code: "COMP6528", title: "Computer Vision", units: 6, semester: "S1", rating: 4.1, termSpan: 1 },
  { code: "COMP6540", title: "Game Development", units: 6, semester: "BOTH", rating: 4.5, termSpan: 1 },
  { code: "COMP6720", title: "Art and Interaction Computing", units: 6, semester: "S2", rating: 4.0, termSpan: 1 },
  { code: "COMP6780", title: "Web Programming and Design", units: 6, semester: "BOTH", rating: 4.2, termSpan: 1 },

  // Machine Learning (MCHL-SPEC) reuses COMP6261/COMP6490/COMP6528/
  // COMP6670/COMP8600/COMP8650/COMP8880 seeded above — no new courses of
  // its own.
];
