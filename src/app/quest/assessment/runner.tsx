"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import {
  orientationQuestions,
  personalityQuestions,
  riasecQuestions,
  streams,
} from "@/lib/content/data";
import { answerProgress, type DraftAnswers } from "@/lib/scoring";
import { saveDraft, submitAssessment } from "../actions";
import { STREAM_ICONS } from "@/components/stream-icons";

const STEPS = ["orientation", "interest", "riasec", "personality", "review"] as const;
type Step = (typeof STEPS)[number];

const STEP_LABELS: Record<Step, string> = {
  orientation: "How you work",
  interest: "What interests you",
  riasec: "Activities you enjoy",
  personality: "Your personality",
  review: "Check and submit",
};

const SCALE = ["Not me", "A little", "Somewhat", "Mostly", "Very me"];

type SaveState = "idle" | "saving" | "saved" | "error";

export function AssessmentRunner(props: {
  id: string;
  attemptNo: number;
  initialStep: Step;
  initialAnswers: DraftAnswers;
  houseColor: string;
}) {
  const [answers, setAnswers] = useState<DraftAnswers>(props.initialAnswers);
  const [step, setStep] = useState<Step>(props.initialStep);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();

  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirrors the latest answers/step so a delayed save always sends current data.
  const latest = useRef({ answers: props.initialAnswers, step: props.initialStep });

  const flush = useCallback(async function save(): Promise<void> {
    if (timer.current) clearTimeout(timer.current);
    if (!dirty.current) return;
    dirty.current = false;
    setSaveState("saving");
    const res = await saveDraft({ id: props.id, ...latest.current });
    if (res.ok) {
      setSaveState("saved");
    } else {
      dirty.current = true;
      setSaveState("error");
      timer.current = setTimeout(save, 5000);
    }
  }, [props.id]);

  const schedule = useCallback(() => {
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 800);
  }, [flush]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const update = (fn: (a: DraftAnswers) => DraftAnswers) => {
    const next = fn(latest.current.answers);
    latest.current = { ...latest.current, answers: next };
    setAnswers(next);
    schedule();
  };

  const goTo = (next: Step) => {
    latest.current = { ...latest.current, step: next };
    setStep(next);
    dirty.current = true;
    void flush();
    window.scrollTo({ top: 0 });
  };

  const stepIndex = STEPS.indexOf(step);
  const progress = answerProgress(answers);
  const pct = Math.round((progress.total / progress.required) * 100);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-semibold">
            {step === "review" ? "Level 1: ready to submit" : `Level 1: section ${stepIndex + 1} of 4`}
          </p>
          <SaveIndicator state={saveState} />
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-sunken"
          role="progressbar"
          aria-valuenow={progress.total}
          aria-valuemin={0}
          aria-valuemax={progress.required}
          aria-label="Questions answered"
        >
          <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: props.houseColor }} />
        </div>
        <nav aria-label="Assessment sections" className="mt-3 flex flex-wrap gap-1">
          {STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => goTo(s)}
              aria-current={s === step ? "step" : undefined}
              className={`rounded-lg px-2.5 py-1.5 text-sm font-semibold ${
                s === step ? "bg-royal-soft text-royal-dark" : "text-muted hover:bg-sunken"
              }`}
            >
              {i + 1}. {STEP_LABELS[s]}
            </button>
          ))}
        </nav>
      </div>

      {step === "orientation" && (
        <ChoiceStep
          key="orientation"
          title={STEP_LABELS.orientation}
          intro="Pick the answer that sounds most like you. There are no right or wrong answers."
          questions={orientationQuestions}
          values={answers.orientation}
          onChange={(q, v) => update((a) => ({ ...a, orientation: a.orientation.map((x, i) => (i === q ? v : x)) }))}
          onDone={() => goTo("interest")}
        />
      )}

      {step === "interest" && (
        <section>
          <h1 className="font-crest text-3xl font-bold">{STEP_LABELS.interest}</h1>
          <p className="mt-2 text-muted">
            Move each slider to show how interested you are. A slider counts only after you&apos;ve moved it.
          </p>
          <ul className="mt-6 space-y-3">
            {streams.map((s) => {
              const v = answers.interest[s.id];
              const Icon = STREAM_ICONS[s.id];
              const set = (val: number) => update((a) => ({ ...a, interest: { ...a.interest, [s.id]: val } }));
              return (
                <li key={s.id} className="panel p-4">
                  <div className="flex items-center gap-3">
                    {Icon && <Icon size={20} className="text-royal" aria-hidden />}
                    <label htmlFor={`slider-${s.id}`} className="flex-1 font-semibold">
                      {s.label}
                    </label>
                    <span className={`tabular text-sm font-bold ${v === null ? "text-muted" : "text-royal"}`}>
                      {v === null ? "Not rated" : v}
                    </span>
                  </div>
                  <input
                    id={`slider-${s.id}`}
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={v ?? 50}
                    data-untouched={v === null}
                    aria-valuetext={v === null ? "Not rated" : `${v} out of 100`}
                    onPointerDown={(e) => v === null && set(Number(e.currentTarget.value))}
                    onKeyDown={(e) => v === null && set(Number(e.currentTarget.value))}
                    onChange={(e) => set(Number(e.currentTarget.value))}
                  />
                  <div className="flex justify-between text-xs text-muted" aria-hidden>
                    <span>Not for me</span>
                    <span>Very interested</span>
                  </div>
                </li>
              );
            })}
          </ul>
          <StepNav onBack={() => goTo("orientation")} onNext={() => goTo("riasec")} />
        </section>
      )}

      {step === "riasec" && (
        <section>
          <h1 className="font-crest text-3xl font-bold">{STEP_LABELS.riasec}</h1>
          <p className="mt-2 text-muted">How much would you enjoy each activity?</p>
          <ol className="mt-6 space-y-3">
            {riasecQuestions.map((q, i) => (
              <li key={i} className="panel p-4">
                <fieldset>
                  <legend className="font-semibold">{q.text}</legend>
                  <div className="mt-3 grid grid-cols-5 gap-1.5">
                    {SCALE.map((label, val) => (
                      <label key={val} className="block">
                        <input
                          type="radio"
                          name={`riasec-${i}`}
                          value={val}
                          checked={answers.riasec[i] === val}
                          onChange={() => update((a) => ({ ...a, riasec: a.riasec.map((x, j) => (j === i ? val : x)) }))}
                          className="sr-only"
                        />
                        <span className="scale-option px-1 text-center text-xs sm:text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </li>
            ))}
          </ol>
          <StepNav onBack={() => goTo("interest")} onNext={() => goTo("personality")} />
        </section>
      )}

      {step === "personality" && (
        <ChoiceStep
          key="personality"
          title={STEP_LABELS.personality}
          intro="Go with your first instinct."
          questions={personalityQuestions}
          values={answers.personality}
          onChange={(q, v) => update((a) => ({ ...a, personality: a.personality.map((x, i) => (i === q ? v : x)) }))}
          onBack={() => goTo("riasec")}
          onDone={() => goTo("review")}
        />
      )}

      {step === "review" && (
        <section>
          <h1 className="font-crest text-3xl font-bold">{STEP_LABELS.review}</h1>
          <p className="mt-2 text-muted">
            Your matches are worked out on the school&apos;s server when you submit, using the same rules for every
            student. You can retake the assessment later; your house points are only counted once.
          </p>
          <ul className="mt-6 divide-y divide-line rounded-[14px] bg-surface shadow-[var(--shadow-raised)]">
            {(
              [
                ["orientation", progress.orientation, orientationQuestions.length],
                ["interest", progress.interest, streams.length],
                ["riasec", progress.riasec, riasecQuestions.length],
                ["personality", progress.personality, personalityQuestions.length],
              ] as const
            ).map(([s, done, of]) => (
              <li key={s} className="flex items-center gap-3 p-4">
                {done === of ? (
                  <CircleCheck className="text-success" aria-hidden />
                ) : (
                  <CircleAlert className="text-danger" aria-hidden />
                )}
                <span className="flex-1 font-semibold">{STEP_LABELS[s]}</span>
                <span className="tabular text-muted">
                  {done} of {of}
                </span>
                {done !== of && (
                  <button type="button" className="font-semibold text-royal underline" onClick={() => goTo(s)}>
                    Finish
                  </button>
                )}
              </li>
            ))}
          </ul>
          {submitError && (
            <p role="alert" className="mt-4 rounded-[10px] bg-danger-soft px-3 py-2 text-danger">
              {submitError}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <button type="button" className="btn btn-quiet" onClick={() => goTo("personality")}>
              <ArrowLeft size={18} aria-hidden /> Back
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={progress.total !== progress.required || submitting}
              onClick={() =>
                startSubmit(async () => {
                  setSubmitError(null);
                  if (timer.current) clearTimeout(timer.current);
                  dirty.current = false;
                  const res = await submitAssessment({ id: props.id, answers });
                  if (res && !res.ok) setSubmitError(res.error);
                })
              }
            >
              {submitting ? "Working out your matches…" : "Submit and see my matches"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return <span className="text-sm text-muted">Your answers save automatically</span>;
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted" role="status">
      {state === "saving" && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
      {state === "saved" && <CircleCheck size={16} className="text-success" aria-hidden />}
      {state === "error" && <CircleAlert size={16} className="text-danger" aria-hidden />}
      {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Not saved yet, retrying"}
    </span>
  );
}

function StepNav({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="mt-6 flex justify-between gap-3">
      <button type="button" className="btn btn-quiet" onClick={onBack}>
        <ArrowLeft size={18} aria-hidden /> Back
      </button>
      <button type="button" className="btn btn-primary" onClick={onNext}>
        Next <ArrowRight size={18} aria-hidden />
      </button>
    </div>
  );
}

type ChoiceQuestion = { text: string; options: { label: string }[] };

function ChoiceStep(props: {
  title: string;
  intro: string;
  questions: ChoiceQuestion[];
  values: (number | null)[];
  onChange: (q: number, v: number) => void;
  onDone: () => void;
  onBack?: () => void;
}) {
  const firstOpen = props.values.findIndex((v) => v === null);
  const [q, setQ] = useState(firstOpen === -1 ? 0 : firstOpen);
  const question = props.questions[q];
  const last = q === props.questions.length - 1;
  const advance = useRef<ReturnType<typeof setTimeout> | null>(null);

  const choose = (v: number) => {
    props.onChange(q, v);
    if (advance.current) clearTimeout(advance.current);
    advance.current = setTimeout(() => (last ? props.onDone() : setQ(q + 1)), 250);
  };

  return (
    <section>
      <h1 className="font-crest text-3xl font-bold">{props.title}</h1>
      <p className="mt-2 text-muted">{props.intro}</p>
      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-muted tabular">
          Question {q + 1} of {props.questions.length}
        </legend>
        <p className="mt-1 text-xl font-bold">{question.text}</p>
        <div className="mt-4 grid gap-2">
          {question.options.map((o, i) => {
            const checked = props.values[q] === i;
            return (
              <label
                key={i}
                className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-[12px] px-4 py-3 transition-colors ${
                  checked ? "bg-royal text-white" : "bg-surface shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-sunken"
                }`}
              >
                <input
                  type="radio"
                  name={`${props.title}-${q}`}
                  checked={checked}
                  onChange={() => choose(i)}
                  className="size-4 accent-white"
                />
                <span className="font-semibold">{o.label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="mt-6 flex justify-between gap-3">
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => (q > 0 ? setQ(q - 1) : props.onBack?.())}
          disabled={q === 0 && !props.onBack}
        >
          <ArrowLeft size={18} aria-hidden /> Back
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={props.values[q] === null}
          onClick={() => (last ? props.onDone() : setQ(q + 1))}
        >
          {last ? "Next section" : "Next question"} <ArrowRight size={18} aria-hidden />
        </button>
      </div>
    </section>
  );
}
