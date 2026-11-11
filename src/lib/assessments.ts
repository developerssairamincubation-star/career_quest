import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AssessmentResults, DraftAnswers } from "@/lib/scoring";

export const STEPS = ["orientation", "interest", "riasec", "personality", "review"] as const;
export type Step = (typeof STEPS)[number];

export type AssessmentRow = {
  id: string;
  student_id: string;
  attempt_no: number;
  status: "in_progress" | "completed";
  step: Step;
  answers: DraftAnswers;
  results: AssessmentResults | null;
  started_at: string;
  updated_at: string;
  completed_at: string | null;
};

export async function listMyAssessments(studentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assessments")
    .select("*")
    .eq("student_id", studentId)
    .order("attempt_no", { ascending: false });
  return (data ?? []) as AssessmentRow[];
}

export async function getMyPoints(studentId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("points_ledger").select("level, amount").eq("student_id", studentId);
  return (data ?? []) as { level: number; amount: number }[];
}
