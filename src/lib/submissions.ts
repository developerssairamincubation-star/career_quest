import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SubmissionRow } from "@/lib/levels";

export async function listMySubmissions(studentId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("submissions").select("*").eq("student_id", studentId).order("level");
  return (data ?? []) as SubmissionRow[];
}
