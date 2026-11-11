import { z } from "zod";

/*
 * Levels 2–5: guided write-ups. A level opens once the previous one is submitted
 * (Level 2 once the Level 1 assessment is completed); the same rule is enforced in
 * Postgres by level_unlocked(). Points are added only when a teacher approves.
 */

export type LevelNo = 2 | 3 | 4 | 5;
export const WRITEUP_LEVELS: LevelNo[] = [2, 3, 4, 5];

export type Field =
  | { id: string; kind: "text"; label: string; hint?: string; min: number; rows?: number; placeholder?: string }
  | { id: string; kind: "line"; label: string; hint?: string; min: number; placeholder?: string }
  | { id: string; kind: "choice"; label: string; options: string[] }
  | { id: string; kind: "streams"; label: string; hint?: string; minPick: number; maxPick: number }
  | { id: string; kind: "scholarships"; label: string; hint?: string; minPick: number };

export type LevelSpec = { level: LevelNo; name: string; title: string; intro: string; fields: Field[] };

export const LEVEL_SPECS: Record<LevelNo, LevelSpec> = {
  2: {
    level: 2,
    name: "Researcher",
    title: "Jobs in 2030",
    intro:
      "Pick the courses you're most curious about from your matches, then research what jobs they could lead to five years from now.",
    fields: [
      { id: "streams", kind: "streams", label: "Courses you'll research", hint: "Choose 1 to 3 from your top matches.", minPick: 1, maxPick: 3 },
      {
        id: "jobs",
        kind: "text",
        label: "Which jobs could these courses lead to by 2030?",
        placeholder: "By 2030, AI and Data Science may lead to data analyst, ML engineer and product analyst roles because…",
        min: 120,
      },
      { id: "skills", kind: "text", label: "What skills will those jobs need, and which do you already have?", min: 80, rows: 4 },
      {
        id: "sources",
        kind: "text",
        label: "Where did you check this?",
        hint: "Name the websites, reports or people. The 2030 job lists below cite WEF, O*NET and NCS.",
        min: 30,
        rows: 3,
      },
    ],
  },
  3: {
    level: 3,
    name: "Connector",
    title: "Talk to a professional",
    intro: "Meet or call one person who works in a career you're considering, and write up what you learned.",
    fields: [
      { id: "who", kind: "line", label: "Who did you speak to?", hint: "Their name or initials, job title and where they work.", min: 1 },
      { id: "how", kind: "choice", label: "How did you talk?", options: ["In person", "Phone call", "Video call", "Email or messages"] },
      {
        id: "learned",
        kind: "text",
        label: "What did they tell you about the work?",
        placeholder: "What a normal day looks like, the skills they use most, how they got there, what's hard about it…",
        min: 150,
        rows: 6,
      },
      { id: "takeaway", kind: "text", label: "Has this changed what you think about this career? Why?", min: 60, rows: 4 },
    ],
  },
  4: {
    level: 4,
    name: "Scholarship Scout",
    title: "Scholarship shortlist",
    intro:
      "Use the checker to see which scholarships and loans to look into, then shortlist the ones worth applying for.",
    fields: [
      {
        id: "scholarships",
        kind: "scholarships",
        label: "Your shortlist",
        hint: "Tick at least 2 from the suggestions.",
        minPick: 2,
      },
      {
        id: "plan",
        kind: "text",
        label: "What will you need to apply?",
        placeholder: "Documents (income certificate, mark sheets…), deadlines, and which portal each one uses.",
        min: 100,
        rows: 5,
      },
    ],
  },
  5: {
    level: 5,
    name: "Pathfinder",
    title: "College and entrance map",
    intro: "Map out where you could study and how you'd get in, for the course you're most serious about.",
    fields: [
      { id: "course", kind: "line", label: "Which course are you aiming for?", placeholder: "B.Tech in AI and Data Science", min: 1 },
      { id: "colleges", kind: "text", label: "Which colleges or universities offer it? List at least three.", min: 60, rows: 4 },
      { id: "exams", kind: "text", label: "Which entrance exams or counselling routes lead there, and when are they?", min: 60, rows: 4 },
      {
        id: "plan",
        kind: "text",
        label: "What will you do in Grades 11 and 12 to get there, and why does this path fit you?",
        min: 120,
        rows: 5,
      },
    ],
  },
};

export type SubmissionStatus = "draft" | "submitted" | "approved" | "rejected";

export type SubmissionRow = {
  id: string;
  student_id: string;
  level: LevelNo;
  status: SubmissionStatus;
  body: Record<string, string | string[]>;
  submitted_at: string | null;
  reviewed_at: string | null;
  feedback: string | null;
  updated_at: string;
};

/** Draft bodies: any field may be missing or short. */
export function draftBodySchema(spec: LevelSpec) {
  return z.object(
    Object.fromEntries(
      spec.fields.map((f) => [
        f.id,
        f.kind === "streams" || f.kind === "scholarships"
          ? z.array(z.string().max(80)).max(30).optional()
          : z.string().max(5000).optional(),
      ]),
    ),
  );
}

/** What's still missing before the student can submit. Empty means ready. */
export function missingFields(spec: LevelSpec, body: Record<string, unknown>): string[] {
  const missing: string[] = [];
  for (const f of spec.fields) {
    const v = body[f.id];
    if (f.kind === "streams" || f.kind === "scholarships") {
      const n = Array.isArray(v) ? v.length : 0;
      if (n < f.minPick) missing.push(`${f.label}: choose at least ${f.minPick}`);
      if (f.kind === "streams" && n > f.maxPick) missing.push(`${f.label}: choose at most ${f.maxPick}`);
    } else if (f.kind === "choice") {
      if (typeof v !== "string" || !f.options.includes(v)) missing.push(`${f.label}: pick one`);
    } else {
      const len = typeof v === "string" ? v.trim().length : 0;
      if (f.kind === "line") {
        if (len === 0) missing.push(`${f.label}: fill this in`);
      } else if (len < f.min) missing.push(`${f.label}: at least ${f.min} characters (${len} so far)`);
    }
  }
  return missing;
}

/** Same rule as level_unlocked() in the database. */
export function isUnlocked(level: LevelNo, l1Done: boolean, subs: Pick<SubmissionRow, "level" | "status">[]) {
  if (level === 2) return l1Done;
  const prev = subs.find((s) => s.level === level - 1);
  return prev?.status === "submitted" || prev?.status === "approved";
}
