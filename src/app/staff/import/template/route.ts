import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildTemplate, XLSX } from "../xlsx";

/** The student template, built from today's teacher list so new teachers appear in the Teacher dropdown. */
export async function GET() {
  const me = await requireRole("admin", "counsellor");
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("role", "teacher")
    .eq("school_id", me.school_id)
    .order("full_name");
  const teachers = (data ?? []).map((t) => t.full_name as string);

  const buffer = await buildTemplate(teachers);
  return new Response(buffer, {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": 'attachment; filename="student-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
