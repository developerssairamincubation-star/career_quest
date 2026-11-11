import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { houseById } from "@/lib/houses";
import { LEVEL_SPECS, type SubmissionRow } from "@/lib/levels";
import { scholarshipById } from "@/lib/eligibility";
import { streams } from "@/lib/content/data";
import { createClient } from "@/lib/supabase/server";
import { ReviewForm } from "./review-form";

export const metadata = { title: "Review" };

export default async function ReviewPage({ params }: PageProps<"/staff/review/[id]">) {
  await requireRole("teacher", "counsellor", "admin");
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("submissions")
    .select("*, student:profiles!submissions_student_id_fkey(id, full_name, roll_no, house)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const sub = data as SubmissionRow & { student: { id: string; full_name: string; roll_no: string | null; house: string | null } };
  const spec = LEVEL_SPECS[sub.level];
  const house = houseById(sub.student.house);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/staff/review" className="inline-flex items-center gap-1.5 font-semibold text-muted hover:text-ink">
        <ArrowLeft size={18} aria-hidden /> Reviews
      </Link>
      <h1 className="mt-3 font-crest text-3xl font-bold">
        Level {sub.level}: {spec.name}
      </h1>
      <p className="mt-1 text-muted">
        <Link href={`/staff/students/${sub.student.id}`} className="font-semibold text-ink underline">
          {sub.student.full_name}
        </Link>
        {sub.student.roll_no && <>, roll no. {sub.student.roll_no}</>}
        {house && <>, {house.name}</>}
        {sub.submitted_at && <>. Sent {new Date(sub.submitted_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</>}
      </p>

      <dl className="mt-6 space-y-5">
        {spec.fields.map((f) => {
          const v = sub.body[f.id];
          let content: React.ReactNode;
          if (f.kind === "streams") {
            content = (Array.isArray(v) ? v : []).map((s) => streams.find((x) => x.id === s)?.label ?? s).join(", ");
          } else if (f.kind === "scholarships") {
            content = (
              <ul className="list-disc pl-5">
                {(Array.isArray(v) ? v : []).map((s) => {
                  const r = scholarshipById(s);
                  return (
                    <li key={s}>
                      {r ? (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="underline">
                          {r.title}
                        </a>
                      ) : (
                        s
                      )}
                    </li>
                  );
                })}
              </ul>
            );
          } else {
            content = <p className="whitespace-pre-wrap">{typeof v === "string" && v.trim() ? v : "(left blank)"}</p>;
          }
          return (
            <div key={f.id} className="panel p-4">
              <dt className="text-sm font-semibold text-muted">{f.label}</dt>
              <dd className="mt-1">{content}</dd>
            </div>
          );
        })}
      </dl>

      {sub.status === "submitted" ? (
        <ReviewForm id={sub.id} />
      ) : (
        <p className="mt-6 break-words rounded-[14px] bg-sunken p-4">
          This write-up is <strong>{sub.status === "approved" ? "approved" : sub.status === "rejected" ? "sent back" : "still a draft"}</strong>.
          {sub.feedback && <> Feedback: {sub.feedback}</>}
        </p>
      )}
    </div>
  );
}
