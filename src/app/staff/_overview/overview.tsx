import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Role } from "@/lib/auth";
import { houseById } from "@/lib/houses";
import type { AssessmentResults } from "@/lib/scoring";
import { CountUp, ScrollIntoView } from "./count-up";

export type Standing = { house: string; points: number; students: number };
export type ClassRow = { class_id: string; grade: number; section: string; students: number; started: number; completed: number };
export type RollStudent = {
  id: string;
  full_name: string;
  roll_no: string | null;
  house: string | null;
  attempt: { status: string; results: AssessmentResults | null } | null;
};

const studentCount = (n: number) => `${n.toLocaleString("en-IN")} ${n === 1 ? "student" : "students"}`;
const houseStyle = (id: string | null | undefined) => {
  const h = houseById(id);
  return { ["--house" as string]: h?.color ?? "var(--color-royal)", ["--on-house" as string]: h?.onColor ?? "#fff" } as CSSProperties;
};

/** The staff overview: house standings (ranked), a card per class, the roll call and the ledger. */
export function Overview({
  role,
  standings,
  rows,
  selected,
  roll,
}: {
  role: Role;
  standings: Standing[];
  rows: ClassRow[];
  selected: ClassRow | null;
  roll: ReactNode;
}) {
  const ranked = standings
    .map((s) => ({ ...s, points: Number(s.points), students: Number(s.students) }))
    .sort((a, b) => b.points - a.points);
  const leader = ranked[0]?.points ?? 0;
  // Competition ranking, so tied houses share a place.
  const place = (points: number) => 1 + ranked.filter((o) => o.points > points).length;

  return (
    <div className="space-y-14">
      <section aria-labelledby="standings-title">
        <h1 id="standings-title" className="font-crest text-4xl font-bold sm:text-5xl">
          Where the houses stand
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Houses are ranked by the points their students earn from finished levels, across the whole school.
        </p>

        <ol className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ranked.map((s) => {
            const h = houseById(s.house)!;
            const p = place(s.points);
            const tied = ranked.some((o) => o !== s && o.points === s.points);
            const behind = leader - s.points;
            const share = leader > 0 ? Math.max(4, Math.round((s.points / leader) * 100)) : 0;
            return (
              <li key={s.house} className="house-panel p-5" style={houseStyle(s.house)}>
                <Image src={h.crest} alt={`${h.name} crest`} width={160} height={160} className="mx-auto h-auto w-32" />
                <div className="mt-3 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-crest text-2xl font-bold leading-tight">{h.name}</h2>
                    <p className="text-sm text-muted">{h.trait}</p>
                  </div>
                  <span className="rank-badge" aria-label={`${tied ? "Joint " : ""}rank ${p}`}>
                    #{p}
                  </span>
                </div>
                <p className="mt-4 font-crest text-4xl font-bold leading-none">
                  <CountUp value={s.points} delay={0.2 + 0.15 * p} />
                  <span className="ml-1.5 font-sans text-base font-semibold text-muted">points</span>
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-sunken" aria-hidden>
                  <div className="h-full rounded-full bg-[var(--house)]" style={{ width: `${share}%` }} />
                </div>
                <p className="mt-2 flex justify-between text-sm text-muted tabular">
                  <span>{studentCount(s.students)}</span>
                  <span>{leader === 0 ? "No points yet" : behind === 0 ? "Leading" : `${behind.toLocaleString("en-IN")} behind`}</span>
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="classes-title">
        <h2 id="classes-title" className="font-crest text-3xl font-bold">
          {role === "teacher" ? "Your classes" : "Classes"}
        </h2>
        <p className="mt-2 max-w-2xl text-muted">Each dot is a student. Gold has finished Level 1, amber has started it.</p>

        {rows.length === 0 ? (
          <p className="panel mt-6 p-6 text-muted">
            {role === "teacher"
              ? "You haven't been given any classes yet. Ask your counsellor or school admin to add you to a class."
              : "No classes yet. Classes are created when you add students from a CSV file."}{" "}
            {role !== "teacher" && (
              <Link href="/staff/import" className="font-semibold text-royal underline">
                Add students
              </Link>
            )}
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((c) => {
              const pct = c.students > 0 ? Math.round((c.completed / c.students) * 100) : 0;
              const open = c.class_id === selected?.class_id;
              return (
                <li key={c.class_id} className={`panel p-4 ${open ? "ring-2 ring-royal" : ""}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-crest text-xl font-bold">
                      Grade {c.grade} · {c.section}
                    </h3>
                    <span className="tabular text-sm text-muted">{studentCount(c.students)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1" aria-hidden>
                    {Array.from({ length: c.students }, (_, k) => (
                      <span
                        key={k}
                        className={`size-3 rounded-full ${k < c.completed ? "bg-gold" : k < c.started ? "bg-[#f0b24a]/70" : "bg-line"}`}
                      />
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-muted tabular">
                    <span className="font-semibold text-ink">{c.completed}</span> finished · {c.started - c.completed} started ·{" "}
                    {c.students - c.started} to begin
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken" aria-hidden>
                    <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                  </div>
                  <Link
                    href={open ? "/staff" : `/staff?class=${c.class_id}`}
                    scroll={false}
                    aria-current={open ? "true" : undefined}
                    className="mt-3 inline-block font-semibold text-royal underline"
                  >
                    {open ? "Close roll call" : "View students"}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {roll}

      {rows.length > 0 && (
        <section aria-labelledby="ledger-title">
          <h2 id="ledger-title" className="font-crest text-3xl font-bold">
            The ledger
          </h2>
          <div className="panel mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="border-b border-line text-sm text-muted">
                  <th className="px-4 py-3 font-semibold">Class</th>
                  <th className="px-4 py-3 text-right font-semibold">Students</th>
                  <th className="px-4 py-3 text-right font-semibold">Started Level 1</th>
                  <th className="px-4 py-3 text-right font-semibold">Finished Level 1</th>
                </tr>
              </thead>
              <tbody className="tabular divide-y divide-line">
                {rows.map((c) => {
                  const pct = c.students > 0 ? Math.round((c.completed / c.students) * 100) : 0;
                  return (
                    <tr key={c.class_id} aria-current={c.class_id === selected?.class_id ? "true" : undefined}>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold">
                        Grade {c.grade}, section {c.section}
                      </td>
                      <td className="px-4 py-3 text-right">{c.students}</td>
                      <td className="px-4 py-3 text-right">{c.started}</td>
                      <td className="px-4 py-3 text-right">
                        {c.completed}
                        {c.students > 0 && <span className="text-muted"> ({pct}%)</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export function RollCallView({ classRow, students }: { classRow: ClassRow; students: RollStudent[] }) {
  const inProgress = classRow.started - classRow.completed;

  return (
    <section id="roll" aria-labelledby="roll-title" className="scroll-mt-24">
      <ScrollIntoView id={classRow.class_id} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="roll-title" className="font-crest text-3xl font-bold">
            Grade {classRow.grade} · Section {classRow.section}
          </h2>
          <p className="mt-2 text-muted tabular">
            {classRow.completed} finished, {inProgress} started and {classRow.students - classRow.started} yet to begin, out of{" "}
            {studentCount(classRow.students)}.
          </p>
        </div>
        <Link href="/staff" scroll={false} className="btn btn-quiet bg-white/70">
          Close roll call
        </Link>
      </div>

      {students.length === 0 ? (
        <p className="panel mt-4 p-6 text-muted">No students in this class yet.</p>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => {
            const a = s.attempt;
            const h = houseById(s.house);
            const top = a?.results?.matches[0];
            const state = !a ? "dark" : a.status === "completed" ? "done" : "ember";
            return (
              <li key={s.id} className="house-panel" style={houseStyle(s.house)}>
                <Link href={`/staff/students/${s.id}`} className="block p-4 hover:bg-white/60">
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-semibold">{s.full_name}</span>
                    <span className="tabular shrink-0 text-sm text-muted">{s.roll_no ? `No. ${s.roll_no}` : "No roll no."}</span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-sm text-muted">
                    {h && <Image src={h.crest} alt="" width={20} height={20} className="size-5" />}
                    {h ? h.name : "House not chosen"}
                  </span>
                  <span className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-semibold ${
                        state === "done" ? "bg-success-soft text-success" : state === "ember" ? "bg-gold-soft text-gold" : "bg-sunken text-muted"
                      }`}
                    >
                      {state === "done" ? "Finished Level 1" : state === "ember" ? "Level 1 in progress" : "Not started"}
                    </span>
                    {top && (
                      <span className="text-muted">
                        {top.label} <span className="tabular">({top.score})</span>
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
