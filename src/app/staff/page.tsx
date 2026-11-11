import { requireRole } from "@/lib/auth";
import type { AssessmentResults } from "@/lib/scoring";
import { createClient } from "@/lib/supabase/server";
import { Overview, RollCallView, type ClassRow, type Standing } from "./_overview/overview";

export const metadata = { title: "Overview" };

export default async function StaffHome({ searchParams }: PageProps<"/staff">) {
  const me = await requireRole("teacher", "counsellor", "admin");
  const { class: classParam } = await searchParams;
  const supabase = await createClient();

  const [{ data: standings }, { data: classes }] = await Promise.all([
    supabase.rpc("house_standings"),
    supabase.rpc("class_summary"),
  ]);
  const rows = (classes ?? []) as ClassRow[];
  const selected = rows.find((c) => c.class_id === classParam) ?? null;

  return (
    <Overview
      role={me.role}
      standings={(standings ?? []) as Standing[]}
      rows={rows}
      selected={selected}
      roll={selected && <RollCall classRow={selected} />}
    />
  );
}

async function RollCall({ classRow }: { classRow: ClassRow }) {
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, roll_no, house")
    .eq("class_id", classRow.class_id)
    .eq("role", "student")
    .order("roll_no", { nullsFirst: false })
    .order("full_name");
  const ids = (students ?? []).map((s) => s.id);
  const { data: attempts } = ids.length
    ? await supabase
        .from("assessments")
        .select("id, student_id, status, results, attempt_no")
        .in("student_id", ids)
        .order("attempt_no", { ascending: false })
    : { data: [] };
  const latest = new Map<string, { id: string; status: string; results: AssessmentResults | null }>();
  for (const a of attempts ?? []) {
    const prev = latest.get(a.student_id);
    // Prefer the most recent completed attempt; fall back to an in-progress one.
    if (!prev || (prev.status !== "completed" && a.status === "completed")) latest.set(a.student_id, a);
  }
  return (
    <RollCallView
      classRow={classRow}
      students={(students ?? []).map((s) => ({ ...s, attempt: latest.get(s.id) ?? null }))}
    />
  );
}
