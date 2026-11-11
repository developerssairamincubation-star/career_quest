"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { LEVEL_SPECS, type LevelNo } from "@/lib/levels";
import { POINTS_PER_LEVEL } from "@/lib/houses";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export type ReviewState = { error?: string };

const schema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  feedback: z.string().trim().max(2000).optional().default(""),
});

export async function reviewSubmission(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const me = await requireRole("teacher", "counsellor", "admin");
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Choose approve or send back." };
  const { id, decision, feedback } = parsed.data;
  if (decision === "reject" && feedback.length < 10) {
    return { error: "Tell the student what to improve (at least 10 characters) so they can fix it." };
  }

  // Read through RLS first: a teacher can only see submissions from their own classes.
  const supabase = await createClient();
  const { data: sub } = await supabase
    .from("submissions")
    .select("id, student_id, level, status")
    .eq("id", id)
    .maybeSingle();
  if (!sub) return { error: "Submission not found, or it isn't in one of your classes." };
  if (sub.status !== "submitted") return { error: "This submission has already been reviewed or was changed." };

  const admin = createAdminClient();
  const { data: updated, error } = await admin
    .from("submissions")
    .update({
      status: decision === "approve" ? "approved" : "rejected",
      reviewed_by: me.id,
      reviewed_at: new Date().toISOString(),
      feedback: feedback || null,
    })
    .eq("id", id)
    .eq("status", "submitted")
    .select("id")
    .maybeSingle();
  if (error || !updated) return { error: "Couldn't save the review. Try again." };

  if (decision === "approve") {
    const { data: student } = await admin.from("profiles").select("house").eq("id", sub.student_id).single();
    if (student?.house) {
      const spec = LEVEL_SPECS[sub.level as LevelNo];
      await admin.from("points_ledger").upsert(
        {
          student_id: sub.student_id,
          house: student.house,
          level: sub.level,
          amount: POINTS_PER_LEVEL,
          reason: `Level ${sub.level} ${spec.name}: approved`,
          source_id: sub.id,
          awarded_by: me.id,
        },
        { onConflict: "student_id,level", ignoreDuplicates: true },
      );
    }
  }

  revalidatePath("/staff");
  revalidatePath("/staff/review");
  redirect("/staff/review?done=" + decision);
}
