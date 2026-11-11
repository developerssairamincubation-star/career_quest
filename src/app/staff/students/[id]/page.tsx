import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import type { AssessmentRow } from "@/lib/assessments";
import { houseById } from "@/lib/houses";
import { createClient } from "@/lib/supabase/server";
import { ResultsView } from "@/components/results-view";
import { ResetPassword } from "../../reset-password";

export const metadata = { title: "Student" };

export default async function StudentPage({ params }: PageProps<"/staff/students/[id]">) {
  await requireRole("teacher", "counsellor", "admin");
  const { id } = await params;
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("profiles")
    .select("id, full_name, email, roll_no, house, role")
    .eq("id", id)
    .eq("role", "student")
    .maybeSingle();
  if (!student) notFound(); // also covers students outside the teacher's classes (RLS hides them)

  const { data: attempts } = await supabase
    .from("assessments")
    .select("*")
    .eq("student_id", id)
    .eq("status", "completed")
    .order("attempt_no", { ascending: false })
    .limit(1);
  const latest = (attempts?.[0] ?? null) as AssessmentRow | null;
  const house = houseById(student.house);

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="font-crest text-3xl font-bold">{student.full_name}</h1>
          <p className="mt-1 text-muted">
            {student.email}
            {student.roll_no && <>, roll no. {student.roll_no}</>}
            {house && <>, {house.name}</>}
          </p>
        </div>
        <ResetPassword userId={student.id} name={student.full_name} />
      </section>
      {latest ? (
        <ResultsView
          results={latest.results!}
          attemptNo={latest.attempt_no}
          completedAt={latest.completed_at!}
          studentName={student.full_name}
        />
      ) : (
        <p className="text-muted">This student hasn&apos;t finished Level 1 yet.</p>
      )}
    </div>
  );
}
