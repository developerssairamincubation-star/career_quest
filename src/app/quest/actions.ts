"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { STEPS, type AssessmentRow } from "@/lib/assessments";
import { HOUSES, POINTS_PER_LEVEL } from "@/lib/houses";
import {
  computeResults,
  draftAnswersSchema,
  emptyAnswers,
  IncompleteAnswersError,
  type DraftAnswers,
} from "@/lib/scoring";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const houseSchema = z.enum(HOUSES.map((h) => h.id) as [string, ...string[]]);

/** Students choose a house once, only if the school didn't assign one. */
export async function chooseHouse(formData: FormData) {
  const profile = await requireRole("student");
  const house = houseSchema.parse(formData.get("house"));
  if (profile.house) redirect("/quest");
  const admin = createAdminClient();
  await admin.from("profiles").update({ house }).eq("id", profile.id).is("house", null);
  revalidatePath("/quest");
  redirect("/quest");
}

/** Resume the open attempt, or start a new one. */
export async function startOrResume() {
  const profile = await requireRole("student");
  if (!profile.house) redirect("/quest");
  const supabase = await createClient();

  const { data: open } = await supabase
    .from("assessments")
    .select("id")
    .eq("student_id", profile.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (!open) {
    const { data: last } = await supabase
      .from("assessments")
      .select("attempt_no")
      .eq("student_id", profile.id)
      .order("attempt_no", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase.from("assessments").insert({
      student_id: profile.id,
      attempt_no: (last?.attempt_no ?? 0) + 1,
      answers: emptyAnswers(),
    });
    if (error) throw new Error("Couldn't start the assessment. Try again.");
  }
  redirect("/quest/assessment");
}

export type SaveResult = { ok: true; savedAt: string } | { ok: false; error: string };

const saveSchema = z.object({
  id: z.string().uuid(),
  step: z.enum(STEPS),
  answers: draftAnswersSchema,
});

/** Autosave. Runs as the student, so row-level security limits it to their own unfinished attempt. */
export async function saveDraft(input: { id: string; step: string; answers: DraftAnswers }): Promise<SaveResult> {
  await requireRole("student");
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Some answers weren't in the expected format." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessments")
    .update({ step: parsed.data.step, answers: parsed.data.answers })
    .eq("id", parsed.data.id)
    .eq("status", "in_progress")
    .select("updated_at")
    .maybeSingle();
  if (error || !data) return { ok: false, error: "Not saved. Check your connection; we'll retry." };
  return { ok: true, savedAt: data.updated_at };
}

export type SubmitResult = { ok: false; error: string };

/**
 * Final submit. Saves the answers as the student, then scores them on the server and
 * writes results and Level 1 points with the service role. The browser never sends scores.
 */
export async function submitAssessment(input: { id: string; answers: DraftAnswers }): Promise<SubmitResult> {
  const profile = await requireRole("student");
  const saved = await saveDraft({ ...input, step: "review" });
  if (!saved.ok) return saved;

  // Re-read what is actually stored, through RLS, and score that.
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", input.id)
    .eq("student_id", profile.id)
    .eq("status", "in_progress")
    .single();
  if (!row) return { ok: false, error: "This attempt was already submitted." };

  let results;
  try {
    results = computeResults(draftAnswersSchema.parse((row as AssessmentRow).answers));
  } catch (e) {
    if (e instanceof IncompleteAnswersError) return { ok: false, error: e.message };
    throw e;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("assessments")
    .update({ status: "completed", results, completed_at: new Date().toISOString() })
    .eq("id", row.id)
    .eq("status", "in_progress");
  if (error) return { ok: false, error: "Couldn't submit. Try again in a moment." };

  // Level 1 points: once per student, however many times they retake. The unique
  // (student_id, level) constraint makes a double award impossible.
  if (profile.house) {
    await admin.from("points_ledger").upsert(
      {
        student_id: profile.id,
        house: profile.house,
        level: 1,
        amount: POINTS_PER_LEVEL,
        reason: "Level 1 Explorer: assessment completed",
        source_id: row.id,
      },
      { onConflict: "student_id,level", ignoreDuplicates: true },
    );
  }

  revalidatePath("/quest");
  redirect(`/quest/results/${row.id}?fresh=1`);
}
