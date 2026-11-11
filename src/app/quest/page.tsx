import Image from "next/image";
import Link from "next/link";
import { Check, Clock, Lock } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getMyPoints, listMyAssessments } from "@/lib/assessments";
import { houseById, LEVELS, POINTS_PER_LEVEL } from "@/lib/houses";
import { answerProgress } from "@/lib/scoring";
import { isUnlocked, type LevelNo } from "@/lib/levels";
import { listMySubmissions } from "@/lib/submissions";
import { HousePicker } from "./house-picker";
import { startOrResume } from "./actions";

export const metadata = { title: "My quest" };

export default async function QuestHome() {
  const profile = await requireRole("student");
  const house = houseById(profile.house);
  if (!house) return <HousePicker />;

  const [attempts, points, subs] = await Promise.all([
    listMyAssessments(profile.id),
    getMyPoints(profile.id),
    listMySubmissions(profile.id),
  ]);
  const open = attempts.find((a) => a.status === "in_progress");
  const latest = attempts.find((a) => a.status === "completed");
  const earned = new Set(points.map((p) => p.level));
  const total = points.reduce((s, p) => s + p.amount, 0);
  const progress = open ? answerProgress(open.answers) : null;

  return (
    <div className="grid gap-8 md:grid-cols-[280px_1fr] md:gap-12">
      {/* The student's house: its island, crest and points */}
      <aside
        className="house-panel self-start p-5 md:p-6"
        style={{ ["--house" as string]: house.color, ["--on-house" as string]: house.onColor }}
      >
        <Image src={house.crest} alt={`${house.name} crest`} width={180} height={180} priority className="mx-auto h-auto w-36" />
        <p className="mt-3 text-center font-crest text-2xl font-bold">{house.name}</p>
        <p className="mt-1 text-center text-sm text-muted">{house.trait}</p>
        <div className="mt-4 rounded-xl bg-sunken px-4 py-3">
          <p className="text-sm font-semibold text-muted">You&apos;ve earned</p>
          <p className="tabular font-crest text-4xl font-bold leading-none">
            {total} <span className="font-sans text-base font-semibold text-muted">points</span>
          </p>
        </div>
      </aside>

      <section>
        <h1 className="font-crest text-4xl font-bold">Hello, {profile.full_name.split(" ")[0]}</h1>
        <p className="mt-2 max-w-prose text-muted">
          Five levels, {POINTS_PER_LEVEL} points each. Levels 2 to 5 are checked by your teacher before the points count.
        </p>

        <ol className="relative mt-8 space-y-4 before:absolute before:top-6 before:bottom-6 before:left-[23px] before:w-0.5 before:bg-line">
          {LEVELS.map((lvl) => {
            const done = earned.has(lvl.level);
            const sub = subs.find((x) => x.level === lvl.level);
            const locked =
              lvl.level > 1 && !sub && !isUnlocked(lvl.level as LevelNo, Boolean(latest), subs);
            const current = !done && !locked;
            return (
              <li key={lvl.level} className="relative flex gap-4">
                <span
                  className={`relative z-10 grid size-12 shrink-0 place-items-center rounded-full border-2 font-crest text-lg font-bold ${
                    done
                      ? "border-gold bg-gold text-white"
                      : current
                        ? "border-royal bg-surface text-royal"
                        : "border-line bg-sunken text-muted"
                  }`}
                  aria-hidden
                >
                  {done ? <Check size={22} strokeWidth={3} /> : lvl.level}
                </span>
                <div className={`panel flex-1 p-4 ${locked ? "opacity-75" : ""}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-crest text-xl font-bold">
                      Level {lvl.level}: {lvl.name}
                    </h2>
                    <span className="text-sm font-semibold text-muted">
                      {done ? `+${POINTS_PER_LEVEL} earned` : `${POINTS_PER_LEVEL} points`}
                    </span>
                  </div>
                  <p className="mt-1 text-muted">{lvl.task}</p>

                  {lvl.level === 1 && (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {open ? (
                        <>
                          <form action={startOrResume}>
                            <button className="btn btn-primary">Continue assessment</button>
                          </form>
                          <span className="text-sm text-muted tabular">
                            {progress!.total} of {progress!.required} answered
                          </span>
                        </>
                      ) : (
                        <form action={startOrResume}>
                          <button className={latest ? "btn btn-quiet" : "btn btn-primary"}>
                            {latest ? "Retake assessment" : "Start assessment"}
                          </button>
                        </form>
                      )}
                      {latest && (
                        <Link href={`/quest/results/${latest.id}`} className="btn btn-primary">
                          View my results
                        </Link>
                      )}
                    </div>
                  )}
                  {lvl.level > 1 && locked && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                      <Lock size={16} aria-hidden />
                      {lvl.level === 2 ? "Opens when you finish the Level 1 assessment." : `Opens when you send Level ${lvl.level - 1} to your teacher.`}
                    </p>
                  )}
                  {lvl.level > 1 && !locked && (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/quest/level/${lvl.level}`}
                        className={!sub || sub.status === "draft" || sub.status === "rejected" ? "btn btn-primary" : "btn btn-quiet"}
                      >
                        {!sub ? "Start" : sub.status === "draft" ? "Continue" : sub.status === "rejected" ? "Improve and resend" : "View"}
                      </Link>
                      {sub?.status === "submitted" && (
                        <span className="flex items-center gap-1.5 text-sm text-muted">
                          <Clock size={16} aria-hidden /> Waiting for your teacher
                        </span>
                      )}
                      {sub?.status === "rejected" && (
                        <span className="text-sm font-semibold text-danger">Sent back with feedback</span>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {attempts.filter((a) => a.status === "completed").length > 1 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold">Earlier attempts</h2>
            <ul className="mt-2 divide-y divide-line">
              {attempts
                .filter((a) => a.status === "completed")
                .map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2">
                    <span>
                      Attempt {a.attempt_no},{" "}
                      {new Date(a.completed_at!).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </span>
                    <Link href={`/quest/results/${a.id}`} className="font-semibold text-royal underline">
                      Results
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        )}
      </section>
    </div>
  );
}
