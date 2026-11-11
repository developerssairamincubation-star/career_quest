"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Printer } from "lucide-react";
import {
  archetypes,
  career2030Outlook,
  careerData,
  orientationMeta,
  riasecMeta,
  streamLibraryMap,
} from "@/lib/content/data";
import { RIASEC_TYPES, WEIGHTS, type AssessmentResults } from "@/lib/scoring";
import { STREAM_ICONS } from "./stream-icons";

gsap.registerPlugin(useGSAP);

const PARTS = [
  { key: "interest", label: "Your interest rating", color: "var(--color-part-interest)", max: WEIGHTS.interest },
  { key: "riasec", label: "Activity fit (RIASEC)", color: "var(--color-part-riasec)", max: WEIGHTS.riasec },
  { key: "orientation", label: "Working style", color: "var(--color-part-style)", max: WEIGHTS.orientation },
  { key: "personality", label: "Personality type", color: "var(--color-part-personality)", max: WEIGHTS.personality },
] as const;

type Arch = keyof typeof archetypes;
type Orient = keyof typeof orientationMeta;

const joinNames = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

export function ResultsView(props: {
  results: AssessmentResults;
  attemptNo: number;
  completedAt: string;
  celebrate?: boolean;
  studentName?: string;
}) {
  const { results } = props;
  const root = useRef<HTMLDivElement>(null);
  const top = results.matches.slice(0, 5);
  const leaders = results.personalityLeaders.map((a) => archetypes[a as Arch]);
  const styleLeaders = results.orientationLeaders.map((o) => orientationMeta[o as Orient].label);

  // The one authored moment: bars fill to their real values and the Level 1 seal stamps in.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        tl.from("[data-bar]", { scaleX: 0, transformOrigin: "left center", duration: 0.7, stagger: 0.02 });
        if (props.celebrate) {
          tl.from("[data-seal]", { scale: 1.8, opacity: 0, rotate: -18, duration: 0.6, ease: "back.out(2)" }, 0.15);
        }
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className="mx-auto max-w-4xl print:max-w-none">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-crest text-3xl font-bold">
            {props.studentName ? `${props.studentName}'s results` : "Your Level 1 results"}
          </h1>
          <p className="mt-1 text-muted">
            Attempt {props.attemptNo}, finished{" "}
            {new Date(props.completedAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          {props.celebrate && (
            <span
              data-seal
              className="grid size-24 shrink-0 place-items-center rounded-full border-4 border-gold bg-gold-soft text-center font-crest text-xs font-bold leading-tight text-ink"
            >
              <span>
                Explorer
                <span className="block text-lg">+100</span>
              </span>
            </span>
          )}
          <button type="button" className="btn btn-quiet" onClick={() => window.print()}>
            <Printer size={18} aria-hidden /> Print or save PDF
          </button>
        </div>
      </header>

      {/* Personality */}
      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="panel p-5">
          <h2 className="text-lg font-bold">Personality type</h2>
          <p className="mt-1 font-crest text-2xl font-bold text-royal">{joinNames(leaders.map((l) => l.name))}</p>
          {leaders.length > 1 && (
            <p className="mt-1 text-sm text-muted">Your answers were evenly split, so both types count equally.</p>
          )}
          {leaders.map((l) => (
            <div key={l.name} className="mt-3">
              <p>{l.desc}</p>
              <p className="mt-2 text-sm text-muted">{l.tags.join(", ")}</p>
            </div>
          ))}
        </div>

        <div className="panel p-5">
          <h2 className="text-lg font-bold">Working style</h2>
          <p className="mt-1 text-muted">
            Strongest: <strong className="text-ink">{joinNames(styleLeaders)}</strong>
          </p>
          <ul className="mt-4 space-y-3">
            {results.orientation.map((o) => (
              <li key={o.cat}>
                <div className="flex justify-between text-sm font-semibold">
                  <span>{orientationMeta[o.cat as Orient].label}</span>
                  <span className="tabular">{o.percent}%</span>
                </div>
                <div className="mt-1 h-2.5 rounded-full bg-sunken">
                  <div data-bar className="h-full rounded-full bg-part-style" style={{ width: `${o.percent}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* RIASEC */}
      <section className="panel mt-6 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">Activity interests (RIASEC)</h2>
          <p className="text-muted">
            Your code: <strong className="tabular font-crest text-xl text-ink">{results.riasecCode}</strong>
          </p>
        </div>
        <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {RIASEC_TYPES.map((t) => (
            <li key={t}>
              <div className="flex justify-between text-sm font-semibold">
                <span>{riasecMeta[t].label}</span>
                <span className="tabular">{results.riasec[t]}</span>
              </div>
              <div className="mt-1 h-2.5 rounded-full bg-sunken">
                <div data-bar className="h-full rounded-full bg-part-riasec" style={{ width: `${results.riasec[t]}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted">{riasecMeta[t].desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Matches */}
      <section className="mt-10">
        <h2 className="font-crest text-2xl font-bold">Your top 5 career streams</h2>
        <p className="mt-1 max-w-prose text-muted">
          Each score is out of 100 and is made of four parts. Every student is scored with the same rules.
        </p>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label="Score parts">
          {PARTS.map((p) => (
            <li key={p.key} className="flex items-center gap-2">
              <span className="size-3 rounded-sm" style={{ background: p.color }} aria-hidden />
              {p.label} (up to {p.max})
            </li>
          ))}
        </ul>

        <ol className="mt-6 space-y-4">
          {top.map((m, i) => {
            const info = careerData[m.id as keyof typeof careerData];
            const outlook =
              career2030Outlook[streamLibraryMap[m.id as keyof typeof streamLibraryMap] as keyof typeof career2030Outlook] ??
              career2030Outlook.default;
            const Icon = STREAM_ICONS[m.id];
            return (
              <li key={m.id} className="panel p-5 break-inside-avoid">
                <div className="flex items-center gap-3">
                  <span className="tabular w-6 text-lg font-bold text-muted">{i + 1}</span>
                  {Icon && <Icon size={22} className="text-royal" aria-hidden />}
                  <h3 className="flex-1 text-xl font-bold">{m.label}</h3>
                  <span className="tabular text-2xl font-bold">{m.score}</span>
                </div>
                <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-sunken" aria-hidden>
                  {PARTS.map((p) => (
                    <div key={p.key} data-bar style={{ width: `${m.parts[p.key]}%`, background: p.color }} />
                  ))}
                </div>
                <p className="sr-only">
                  {PARTS.map((p) => `${p.label} ${m.parts[p.key]} of ${p.max}`).join(", ")}
                </p>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                  {PARTS.map((p) => (
                    <div key={p.key}>
                      <dt className="text-muted">{p.label}</dt>
                      <dd className="tabular font-semibold">
                        {m.parts[p.key]} / {p.max}
                      </dd>
                    </div>
                  ))}
                </dl>

                {info && (
                  <details className="mt-4 group">
                    <summary className="cursor-pointer font-semibold text-royal">Courses, colleges, exams and scholarships</summary>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <InfoList title="Courses" items={info.courses} />
                      <InfoList title="Where to study" items={info.unis} />
                      <div className="sm:col-span-2">
                        <h4 className="font-semibold">Eligibility and entrance</h4>
                        <p className="mt-1 text-muted">{info.eligibility}</p>
                      </div>
                      <InfoList title="Scholarships to look at" items={info.scholarships} />
                      {outlook && <InfoList title="Jobs to watch in 2030" items={outlook.roles.slice(0, 5)} />}
                    </div>
                  </details>
                )}
              </li>
            );
          })}
        </ol>

        <details className="mt-6 rounded-[14px] bg-sunken p-4 print:hidden">
          <summary className="cursor-pointer font-semibold">How the score is worked out</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            <li>Interest (up to {WEIGHTS.interest}): your slider rating for the stream, halved.</li>
            <li>
              Activity fit (up to {WEIGHTS.riasec}): the average of the three RIASEC themes linked to the stream.
            </li>
            <li>
              Working style (up to {WEIGHTS.orientation}): full marks if the stream&apos;s style is your strongest, and
              a share otherwise. Tied styles get equal credit.
            </li>
            <li>
              Personality (up to {WEIGHTS.personality}): worked out the same way for personality type.
            </li>
            <li>If two streams have the same score, the one with better activity fit ranks higher, then your interest rating.</li>
          </ul>
          <p className="mt-2 text-sm text-muted">
            This is a guide to start conversations with your teachers and family, not a formal test.
          </p>
        </details>
      </section>

      {!props.studentName && (
        <div className="mt-8 print:hidden">
          <Link href="/quest" className="btn btn-primary">
            Back to my quest
          </Link>
        </div>
      )}
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div>
      <h4 className="font-semibold">{title}</h4>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
