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
// Two lists are still genuinely open-ended in the real handbook even after
// modelling all 7 specialisations — PCOM's "any 8000-level COMP course"
// list, and the program's "University Elective" (any ANU course, any
// faculty) — and are represented by a realistic subset rather than the
// whole catalogue, same rationale as before: modelling either in full means
// re-scraping ANUHub, which this prototype is trying to get away from.
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

  // University Elective ("校选课"): 12 units from any ANU faculty, split
  // into two 6-unit slots — a realistic subset of an otherwise open
  // catalogue (see file header).
  { code: "PHIL1005", title: "Logic and Critical Thinking", units: 6, semester: "BOTH", rating: 4.3, termSpan: 1 },
  { code: "POLS1002", title: "Introduction to Politics", units: 6, semester: "BOTH", rating: 4.1, termSpan: 1 },

  // Professional Computing (PCOM-SPEC)
  { code: "COMP6120", title: "Software Engineering", units: 6, semester: "S2", rating: 4.0, termSpan: 1 },
  { code: "ENGN8100", title: "Introduction to Systems Engineering", units: 6, semester: "S1", rating: 3.9, termSpan: 1 },
  { code: "COMP6240", title: "Relational Databases", units: 6, semester: "BOTH", rating: 4.2, termSpan: 1 },
  { code: "COMP6331", title: "Computer Networks", units: 6, semester: "S1", rating: 4.0, termSpan: 1 },
  { code: "COMP6390", title: "Human-Computer Interaction", units: 6, semester: "S2", rating: 4.5, termSpan: 1 },
  { code: "INFS8004", title: "Enterprise Systems", units: 6, semester: "BOTH", rating: 3.9, termSpan: 1 },
  { code: "INFS8205", title: "Business Process Management", units: 6, semester: "BOTH", rating: 3.8, termSpan: 1 },
  { code: "LAWS8445", title: "Law of the Internet and E-Commerce", units: 6, semester: "BOTH", rating: 4.0, termSpan: 1 },
  { code: "MGMT7020", title: "Managing Organisations and People", units: 6, semester: "BOTH", rating: 4.1, termSpan: 1 },
  { code: "REGN8014", title: "Regulatory Foundations", units: 6, semester: "BOTH", rating: 3.7, termSpan: 1 },
  // PCOM's "any 8000-level COMP course" list B — genuinely open-ended in the
  // real handbook, represented by 2 illustrative options:
  { code: "COMP8600", title: "Statistical Machine Learning", units: 6, semester: "S1", rating: 4.6, termSpan: 1 },
  { code: "COMP8880", title: "Computational Methods for Network Science", units: 6, semester: "S1", rating: 4.1, termSpan: 1 },

  // Artificial Intelligence (ARTIF-SPEC) — all 4 compulsory, 24u, no
  // electives
  { code: "COMP6262", title: "Logic", units: 6, semester: "BOTH", rating: 4.0, termSpan: 1 },
  { code: "COMP6320", title: "Artificial Intelligence", units: 6, semester: "BOTH", rating: 4.5, termSpan: 1 },
  { code: "COMP8620", title: "Advanced Topics in Artificial Intelligence", units: 6, semester: "BOTH", rating: 4.3, termSpan: 1 },
  { code: "COMP8691", title: "Optimisation", units: 6, semester: "BOTH", rating: 4.2, termSpan: 1 },

  // Computational Foundations (COMP-SPEC)
  { code: "COMP6361", title: "Principles of Programming Languages", units: 6, semester: "BOTH", rating: 4.1, termSpan: 1 },
  { code: "COMP6363", title: "Theory of Computation", units: 6, semester: "BOTH", rating: 3.9, termSpan: 1 },
  { code: "COMP8011", title: "Advanced Topics in Formal Methods and Programming Languages", units: 6, semester: "BOTH", rating: 3.8, termSpan: 1 },
  { code: "COMP8460", title: "Advanced Algorithms", units: 6, semester: "BOTH", rating: 4.4, termSpan: 1 },
  { code: "MATH6114", title: "Number Theory and Cryptography", units: 6, semester: "BOTH", rating: 4.0, termSpan: 1 },
  { code: "MATH8343", title: "Foundations of Mathematics", units: 6, semester: "BOTH", rating: 3.9, termSpan: 1 },
  { code: "COMP6261", title: "Information Theory", units: 6, semester: "BOTH", rating: 4.0, termSpan: 1 },
  { code: "COMP6466", title: "Algorithms", units: 6, semester: "BOTH", rating: 4.3, termSpan: 1 },
  { code: "COMP8712", title: "Compiler Construction", units: 6, semester: "BOTH", rating: 4.2, termSpan: 1 },

  // Computer Systems (CMSY-SPEC)
  { code: "COMP8300", title: "Parallel Systems", units: 6, semester: "BOTH", rating: 4.1, termSpan: 1 },
  { code: "COMP8045", title: "Advanced Topics in Computer Systems", units: 6, semester: "BOTH", rating: 3.9, termSpan: 1 },
  { code: "COMP6310", title: "Systems Networks and Concurrency", units: 6, semester: "BOTH", rating: 4.0, termSpan: 1 },
  { code: "COMP6330", title: "Operating Systems", units: 6, semester: "BOTH", rating: 4.4, termSpan: 1 },
  { code: "COMP6464", title: "High Performance Scientific Computing", units: 6, semester: "BOTH", rating: 4.0, termSpan: 1 },
  { code: "ENGN6213", title: "Digital Systems and Microprocessors", units: 6, semester: "BOTH", rating: 3.8, termSpan: 1 },

  // Data Science (DTSC-SPEC)
  { code: "COMP8410", title: "Data Mining", units: 6, semester: "BOTH", rating: 4.3, termSpan: 1 },
  { code: "COMP8430", title: "Data Wrangling", units: 6, semester: "BOTH", rating: 4.1, termSpan: 1 },
  { code: "COMP6490", title: "Document Analysis", units: 6, semester: "BOTH", rating: 3.9, termSpan: 1 },
  { code: "COMP6670", title: "Introduction to Machine Learning", units: 6, semester: "BOTH", rating: 4.4, termSpan: 1 },
  { code: "STAT6039", title: "Principles of Mathematical Statistics", units: 6, semester: "BOTH", rating: 3.8, termSpan: 1 },

  // Human-Centred and Creative Computing (HCCM-SPEC)
  { code: "COMP8350", title: "Sound and Music Computing", units: 6, semester: "BOTH", rating: 4.2, termSpan: 1 },
  { code: "COMP8539", title: "Advanced Topics in Computer Vision", units: 6, semester: "BOTH", rating: 4.0, termSpan: 1 },
  { code: "COMP8610", title: "Computer Graphics", units: 6, semester: "BOTH", rating: 4.3, termSpan: 1 },
  { code: "COMP6528", title: "Computer Vision", units: 6, semester: "BOTH", rating: 4.1, termSpan: 1 },
  { code: "COMP6540", title: "Game Development", units: 6, semester: "BOTH", rating: 4.5, termSpan: 1 },
  { code: "COMP6720", title: "Art and Interaction Computing", units: 6, semester: "BOTH", rating: 4.0, termSpan: 1 },
  { code: "COMP6780", title: "Web Programming and Design", units: 6, semester: "BOTH", rating: 4.2, termSpan: 1 },

  // Machine Learning (MCHL-SPEC) reuses COMP6261/COMP6490/COMP6528/
  // COMP6670/COMP8600/COMP8880 seeded above — no new courses of its own.
];
