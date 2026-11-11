"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { draftBodySchema, LEVEL_SPECS, missingFields, type LevelNo } from "@/lib/levels";
import { createClient } from "@/lib/supabase/server";

const levelSchema = z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

export type LevelSaveResult = { ok: true } | { ok: false; error: string };

/** Says what actually went wrong; "not open yet" is only right when row-level security refused a new row. */
function describe(error: { code?: string; message: string }, isInsert: boolean) {
  console.error("[levels] write failed:", error.code, error.message);
  // PGRST205 / 42P01: the submissions table is missing, i.e. supabase/migrations/0002_levels.sql was never run.
  if (error.code === "PGRST205" || error.code === "42P01") {
    return "Levels 2 to 5 aren't set up on the server yet. Ask your admin to run the 0002_levels.sql migration.";
  }
  if (error.code === "42501" && isInsert) return "This level isn't open yet. Finish the one before it first.";
  return "Couldn't save. Check your connection and try again.";
}

async function write(level: LevelNo, body: unknown, status: "draft" | "submitted"): Promise<LevelSaveResult> {
  const profile = await requireRole("student");
  const spec = LEVEL_SPECS[level];
  const parsed = draftBodySchema(spec).safeParse(body);
  if (!parsed.success) return { ok: false, error: "Some answers weren't in the expected format." };

  if (status === "submitted") {
    const missing = missingFields(spec, parsed.data);
    if (missing.length) return { ok: false, error: `Not ready yet. ${missing.join(". ")}.` };
  }

  // Runs as the student: RLS allows only their own row, only for unlocked levels, never once approved.
  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase
    .from("submissions")
    .select("id, status")
    .eq("student_id", profile.id)
    .eq("level", level)
    .maybeSingle();
  if (readError) return { ok: false, error: describe(readError, false) };

  if (existing?.status === "approved") return { ok: false, error: "This level is already approved." };
  // Locked while the teacher reviews it, so the write-up can't change under them.
  if (existing?.status === "submitted") return { ok: false, error: "This is waiting for your teacher's review." };
  const fields = {
    body: parsed.data,
    status,
    ...(status === "submitted" ? { submitted_at: new Date().toISOString() } : {}),
  };

  const { error } = existing
    ? await supabase.from("submissions").update(fields).eq("id", existing.id)
    : await supabase.from("submissions").insert({ student_id: profile.id, level, ...fields });
  if (error) return { ok: false, error: describe(error, !existing) };
  if (status === "submitted") revalidatePath("/quest");
  return { ok: true };
}

export async function saveLevelDraft(level: number, body: unknown) {
  return write(levelSchema.parse(level), body, "draft");
}

export async function submitLevel(level: number, body: unknown) {
  return write(levelSchema.parse(level), body, "submitted");
}
