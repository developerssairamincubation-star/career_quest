import { z } from "zod";
import {
  orientationQuestions,
  personalityQuestions,
  riasecQuestions,
  streams,
  streamRiasecProfiles,
} from "@/lib/content/data";

/*
 * Level 1 scoring. Runs on the server only; the browser never sends scores.
 *
 * Match score (0–100, never capped):
 *   Interest        50  the student's own 0–100 rating for the stream
 *   RIASEC fit      25  average of the stream's three RIASEC themes
 *   Working style   15  stream's style count ÷ the student's top style count
 *   Personality     10  stream's archetype count ÷ the student's top archetype count
 * Ties are broken by RIASEC fit, then interest, then stream name (A–Z).
 * Style and archetype ties are reported as ties, not resolved by list order.
 */

export const WEIGHTS = { interest: 50, riasec: 25, orientation: 15, personality: 10 } as const;

export type OrientCat = "admin" | "info" | "creative" | "people";
export type Arch = "strategist" | "connector" | "builder" | "creator";
export type RiasecType =
  | "realistic"
  | "investigative"
  | "artistic"
  | "social"
  | "enterprising"
  | "conventional";

export const RIASEC_TYPES: RiasecType[] = [
  "realistic",
  "investigative",
  "artistic",
  "social",
  "enterprising",
  "conventional",
];

const nullableIndex = (max: number) => z.number().int().min(0).max(max).nullable();

/** Draft answers: anything may still be null (not answered yet). */
export const draftAnswersSchema = z.object({
  orientation: z.array(nullableIndex(3)).length(orientationQuestions.length),
  interest: z.record(z.string(), z.number().int().min(0).max(100).nullable()),
  riasec: z.array(nullableIndex(4)).length(riasecQuestions.length),
  personality: z.array(nullableIndex(3)).length(personalityQuestions.length),
});
export type DraftAnswers = z.infer<typeof draftAnswersSchema>;

export function emptyAnswers(): DraftAnswers {
  return {
    orientation: orientationQuestions.map(() => null),
    interest: Object.fromEntries(streams.map((s) => [s.id, null])),
    riasec: riasecQuestions.map(() => null),
    personality: personalityQuestions.map(() => null),
  };
}

export type Progress = {
  orientation: number;
  interest: number;
  riasec: number;
  personality: number;
  total: number;
  required: number;
};

export function answerProgress(a: DraftAnswers): Progress {
  const count = (xs: (number | null)[]) => xs.filter((x) => x !== null).length;
  const p = {
    orientation: count(a.orientation),
    interest: count(streams.map((s) => a.interest[s.id] ?? null)),
    riasec: count(a.riasec),
    personality: count(a.personality),
  };
  const required =
    orientationQuestions.length + streams.length + riasecQuestions.length + personalityQuestions.length;
  return { ...p, total: p.orientation + p.interest + p.riasec + p.personality, required };
}

export type StreamMatch = {
  id: string;
  label: string;
  score: number;
  parts: { interest: number; riasec: number; orientation: number; personality: number };
  riasecFit: number;
  interest: number;
};

export type AssessmentResults = {
  version: 1;
  orientation: { cat: OrientCat; count: number; percent: number }[];
  orientationLeaders: OrientCat[];
  personality: { arch: Arch; count: number; percent: number }[];
  personalityLeaders: Arch[];
  riasec: Record<RiasecType, number>;
  riasecCode: string;
  matches: StreamMatch[];
};

export class IncompleteAnswersError extends Error {}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function computeResults(answers: DraftAnswers): AssessmentResults {
  const progress = answerProgress(answers);
  if (progress.total !== progress.required) {
    throw new IncompleteAnswersError(
      `${progress.required - progress.total} questions are still unanswered.`,
    );
  }

  // Working style
  const orientCounts: Record<OrientCat, number> = { admin: 0, info: 0, creative: 0, people: 0 };
  answers.orientation.forEach((choice, q) => {
    const cat = orientationQuestions[q].options[choice!].cat as OrientCat;
    orientCounts[cat]++;
  });
  const orientMax = Math.max(...Object.values(orientCounts));
  const orientation = (Object.keys(orientCounts) as OrientCat[])
    .map((cat) => ({
      cat,
      count: orientCounts[cat],
      percent: Math.round((orientCounts[cat] / orientationQuestions.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // Personality
  const archCounts: Record<Arch, number> = { strategist: 0, connector: 0, builder: 0, creator: 0 };
  answers.personality.forEach((choice, q) => {
    const arch = personalityQuestions[q].options[choice!].arch as Arch;
    archCounts[arch]++;
  });
  const archMax = Math.max(...Object.values(archCounts));
  const personality = (Object.keys(archCounts) as Arch[])
    .map((arch) => ({
      arch,
      count: archCounts[arch],
      percent: Math.round((archCounts[arch] / personalityQuestions.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // RIASEC, each type 0–100
  const totals = Object.fromEntries(RIASEC_TYPES.map((t) => [t, 0])) as Record<RiasecType, number>;
  const counts = { ...totals };
  riasecQuestions.forEach((q, i) => {
    const t = q.type as RiasecType;
    totals[t] += answers.riasec[i]!;
    counts[t]++;
  });
  const riasec = Object.fromEntries(
    RIASEC_TYPES.map((t) => [t, Math.round((totals[t] / Math.max(1, counts[t] * 4)) * 100)]),
  ) as Record<RiasecType, number>;
  const riasecCode = [...RIASEC_TYPES]
    .sort((a, b) => riasec[b] - riasec[a] || RIASEC_TYPES.indexOf(a) - RIASEC_TYPES.indexOf(b))
    .slice(0, 3)
    .map((t) => t[0].toUpperCase())
    .join("");

  const matches: StreamMatch[] = streams
    .map((s) => {
      const interest = answers.interest[s.id]!;
      const profile = (streamRiasecProfiles as Record<string, string[]>)[s.id] ?? [];
      const riasecFit = profile.length
        ? profile.reduce((sum, t) => sum + riasec[t as RiasecType], 0) / profile.length
        : 0;
      const parts = {
        interest: round1((interest / 100) * WEIGHTS.interest),
        riasec: round1((riasecFit / 100) * WEIGHTS.riasec),
        orientation: round1(
          orientMax ? (orientCounts[s.orient as OrientCat] / orientMax) * WEIGHTS.orientation : 0,
        ),
        personality: round1(
          archMax ? (archCounts[s.arch as Arch] / archMax) * WEIGHTS.personality : 0,
        ),
      };
      const score = round1(parts.interest + parts.riasec + parts.orientation + parts.personality);
      return { id: s.id, label: s.label, score, parts, riasecFit: round1(riasecFit), interest };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.riasecFit - a.riasecFit ||
        b.interest - a.interest ||
        a.label.localeCompare(b.label),
    );

  return {
    version: 1,
    orientation,
    orientationLeaders: orientation.filter((o) => o.count === orientMax).map((o) => o.cat),
    personality,
    personalityLeaders: personality.filter((p) => p.count === archMax).map((p) => p.arch),
    riasec,
    riasecCode,
    matches,
  };
}
