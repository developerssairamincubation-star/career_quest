import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import type { AssessmentRow } from "@/lib/assessments";
import { createClient } from "@/lib/supabase/server";
import { ResultsView } from "@/components/results-view";

export const metadata = { title: "My results" };

export default async function ResultsPage({ params, searchParams }: PageProps<"/quest/results/[id]">) {
  const [{ id }, { fresh }] = await Promise.all([params, searchParams]);
  await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase.from("assessments").select("*").eq("id", id).eq("status", "completed").maybeSingle();
  if (!data) notFound();
  const row = data as AssessmentRow;
  return (
    <ResultsView
      results={row.results!}
      attemptNo={row.attempt_no}
      completedAt={row.completed_at!}
      celebrate={fresh === "1"}
    />
  );
}
