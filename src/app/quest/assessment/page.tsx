import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { listMyAssessments } from "@/lib/assessments";
import { houseById } from "@/lib/houses";
import { AssessmentRunner } from "./runner";

export const metadata = { title: "Level 1 assessment" };

export default async function AssessmentPage() {
  const profile = await requireRole("student");
  const open = (await listMyAssessments(profile.id)).find((a) => a.status === "in_progress");
  if (!open) redirect("/quest");
  const house = houseById(profile.house)!;
  return (
    <AssessmentRunner
      id={open.id}
      attemptNo={open.attempt_no}
      initialStep={open.step}
      initialAnswers={open.answers}
      houseColor={house.color}
    />
  );
}
