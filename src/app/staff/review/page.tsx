import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { houseById } from "@/lib/houses";
import { LEVEL_SPECS, type LevelNo } from "@/lib/levels";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Reviews" };

const DONE: Record<string, string> = {
  approve: "Approved. The points have gone to the student's house.",
  reject: "Sent back. The student will see your feedback.",
};

export default async function ReviewQueue({ searchParams }: PageProps<"/staff/review">) {
  await requireRole("teacher", "counsellor", "admin");
  const { done, level } = await searchParams;
  const supabase = await createClient();

  // RLS limits this to the caller's classes (teachers) or school (counsellors, admins).
  let q = supabase
    .from("submissions")
    .select("id, level, submitted_at, student:profiles!submissions_student_id_fkey(full_name, roll_no, house, class:classes!profiles_class_id_fkey(grade, section))")
    .eq("status", "submitted")
    .order("submitted_at", { ascending: true })
    .limit(200);
  const lvl = Number(level);
  if (lvl >= 2 && lvl <= 5) q = q.eq("level", lvl);
  const { data, error } = await q;
  type Row = {
    id: string;
    level: LevelNo;
    submitted_at: string;
    student: { full_name: string; roll_no: string | null; house: string | null; class: { grade: number; section: string } | null } | null;
  };
  const rows = (data ?? []) as unknown as Row[];

  return (
    <div>
      <h1 className="font-crest text-3xl font-bold">Reviews</h1>
      <p className="mt-2 max-w-prose text-muted">
        Oldest first. Approving adds 100 points to the student&apos;s house. Sending back lets them improve it and resend.
      </p>
      {typeof done === "string" && DONE[done] && (
        <p role="status" className="mt-4 rounded-[10px] bg-success-soft px-3 py-2 text-success">{DONE[done]}</p>
      )}

      <nav className="mt-5 flex flex-wrap gap-1" aria-label="Filter by level">
        {[undefined, 2, 3, 4, 5].map((l) => {
          const active = l === undefined ? !(lvl >= 2 && lvl <= 5) : lvl === l;
          return (
            <Link
              key={l ?? "all"}
              href={l ? `/staff/review?level=${l}` : "/staff/review"}
              aria-current={active ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${active ? "bg-royal-soft text-royal-dark" : "text-muted hover:bg-sunken"}`}
            >
              {l ? `Level ${l}` : "All levels"}
            </Link>
          );
        })}
      </nav>

      {error ? (
        <p role="alert" className="mt-6 text-danger">Couldn&apos;t load the queue. Check that the Levels 2–5 database update has been run.</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-muted">Nothing waiting for review. New write-ups appear here as soon as students send them.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-[14px] bg-surface shadow-[var(--shadow-raised)]">
          <table className="w-full min-w-[600px] text-left">
            <thead className="border-b border-line text-sm text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Class</th>
                <th className="px-4 py-3 font-semibold">Level</th>
                <th className="px-4 py-3 font-semibold">Sent</th>
                <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => {
                const h = houseById(r.student?.house);
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{r.student?.full_name}</span>
                      {h && (
                        <span className="ml-2 inline-flex items-center gap-1.5 text-sm text-muted">
                          <span className="size-2.5 rounded-full" style={{ background: h.color }} aria-hidden />
                          {h.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {r.student?.class ? `Grade ${r.student.class.grade}, ${r.student.class.section}` : "None"}
                    </td>
                    <td className="px-4 py-3">
                      {r.level}: {LEVEL_SPECS[r.level].name}
                    </td>
                    <td className="tabular px-4 py-3 text-muted">
                      {new Date(r.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/staff/review/${r.id}`} className="font-semibold text-royal underline">Review</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
