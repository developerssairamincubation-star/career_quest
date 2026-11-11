import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listMyAssessments } from "@/lib/assessments";
import { listMySubmissions } from "@/lib/submissions";
import { isUnlocked, LEVEL_SPECS, type LevelNo } from "@/lib/levels";
import { career2030Outlook, careerData, libraryCategories, streamLibraryMap } from "@/lib/content/data";
import { LevelForm } from "./level-form";

export async function generateMetadata({ params }: PageProps<"/quest/level/[n]">) {
  const n = Number((await params).n);
  const spec = LEVEL_SPECS[n as LevelNo];
  return { title: spec ? `Level ${n}: ${spec.name}` : "Level" };
}

export default async function LevelPage({ params }: PageProps<"/quest/level/[n]">) {
  const n = Number((await params).n);
  const spec = LEVEL_SPECS[n as LevelNo];
  if (!spec) notFound();
  const profile = await requireRole("student");
  const [attempts, subs] = await Promise.all([listMyAssessments(profile.id), listMySubmissions(profile.id)]);
  const latest = attempts.find((a) => a.status === "completed");
  const mine = subs.find((s) => s.level === n) ?? null;
  if (!mine && !isUnlocked(spec.level, Boolean(latest), subs)) redirect("/quest");

  const topStreams = (latest?.results?.matches ?? []).slice(0, 5).map((m) => ({ id: m.id, label: m.label }));
  const l2Streams = (subs.find((s) => s.level === 2)?.body.streams as string[] | undefined) ?? [];
  const focus = l2Streams.length ? l2Streams : topStreams.slice(0, 3).map((s) => s.id);

  return (
    <div>
      <Link href="/quest" className="inline-flex items-center gap-1.5 font-semibold text-muted hover:text-ink">
        <ArrowLeft size={18} aria-hidden /> My quest
      </Link>
      <h1 className="mt-3 font-crest text-3xl font-bold">
        Level {n}: {spec.name}
      </h1>
      <p className="mt-2 max-w-prose text-muted">{spec.intro}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <LevelForm
          level={spec.level}
          initialBody={mine?.body ?? {}}
          status={mine?.status ?? null}
          feedback={mine?.feedback ?? null}
          topStreams={topStreams}
        />
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start" aria-label="Reference">
          {n === 2 && <Outlook2030 streamIds={topStreams.map((s) => s.id)} />}
          {n === 3 && <InterviewTips />}
          {n === 5 && <CollegeMap streamIds={focus} />}
          {n === 4 && (
            <p className="rounded-[14px] bg-sunken p-4 text-sm text-muted">
              The checker&apos;s answers about category, income, disability and family stay on this device. Only the
              scholarships you tick and your plan are saved and shared with your teacher.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function outlookFor(streamId: string) {
  const cat = (streamLibraryMap as Record<string, string>)[streamId];
  return (career2030Outlook as Record<string, { summary: string; roles: string[]; skills: string[] }>)[cat] ?? career2030Outlook.default;
}

function Outlook2030({ streamIds }: { streamIds: string[] }) {
  return (
    <section className="panel p-4">
      <h2 className="font-bold">Jobs to watch in 2030</h2>
      <p className="mt-1 text-sm text-muted">From your top matches. Use these as a starting point, then check them yourself.</p>
      <ul className="mt-3 space-y-4">
        {streamIds.map((id) => {
          const o = outlookFor(id);
          const label = libraryCategories.find((c) => c.id === (streamLibraryMap as Record<string, string>)[id])?.label ?? id;
          return (
            <li key={id}>
              <h3 className="font-semibold">{label}</h3>
              <p className="mt-0.5 text-sm text-muted">{o.summary}</p>
              <p className="mt-1 text-sm">
                <span className="font-semibold">Roles:</span> {o.roles.slice(0, 4).join(", ")}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Skills:</span> {o.skills.slice(0, 4).join(", ")}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function InterviewTips() {
  const qs = [
    "What does a normal working day look like?",
    "What did you study, and how did you get your first job?",
    "Which skills do you use the most?",
    "What's the hardest part of the job?",
    "How is your field changing, and what will matter by 2030?",
    "What would you tell a student who wants to do this?",
  ];
  return (
    <section className="panel p-4">
      <h2 className="font-bold">Questions you could ask</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {qs.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-muted">
        Ask a family member, a neighbour, an alumnus or a teacher to introduce you. Ask permission before you note their
        name; initials are fine.
      </p>
    </section>
  );
}

function CollegeMap({ streamIds }: { streamIds: string[] }) {
  return (
    <section className="panel p-4">
      <h2 className="font-bold">Where to start looking</h2>
      <ul className="mt-3 space-y-4">
        {streamIds.map((id) => {
          const info = careerData[id as keyof typeof careerData];
          const cat = libraryCategories.find((c) => c.id === (streamLibraryMap as Record<string, string>)[id]);
          if (!info) return null;
          return (
            <li key={id}>
              <h3 className="font-semibold">{cat?.label ?? id}</h3>
              <p className="mt-1 text-sm font-semibold">Entrance and counselling</p>
              <ul className="list-disc pl-5 text-sm text-muted">
                {(cat?.exams ?? []).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p className="mt-1 text-sm font-semibold">Institutions to research</p>
              <ul className="list-disc pl-5 text-sm text-muted">
                {info.unis.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">Rules change every year. Confirm on the official exam and college websites.</p>
    </section>
  );
}
