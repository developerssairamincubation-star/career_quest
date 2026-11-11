"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, Clock, ExternalLink, LoaderCircle } from "lucide-react";
import { LEVEL_SPECS, missingFields, type Field, type LevelNo, type SubmissionStatus } from "@/lib/levels";
import { DEFAULT_ELIGIBILITY, eligibleScholarships, scholarshipById, trustLabel, type Eligibility } from "@/lib/eligibility";
import { saveLevelDraft, submitLevel } from "../../level-actions";

type Body = Record<string, string | string[]>;
type SaveState = "idle" | "saving" | "saved" | "error";

export function LevelForm(props: {
  level: LevelNo;
  initialBody: Body;
  status: SubmissionStatus | null;
  feedback: string | null;
  topStreams: { id: string; label: string }[];
}) {
  const spec = LEVEL_SPECS[props.level];
  const router = useRouter();
  const [body, setBody] = useState<Body>(props.initialBody);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const readOnly = props.status === "submitted" || props.status === "approved";

  const latest = useRef(props.initialBody);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(
    async function save(): Promise<void> {
      if (timer.current) clearTimeout(timer.current);
      if (!dirty.current) return;
      dirty.current = false;
      setSaveState("saving");
      const res = await saveLevelDraft(props.level, latest.current);
      if (res.ok) {
        setSaveState("saved");
        setError(null);
      } else {
        dirty.current = true;
        setError(res.error);
        setSaveState("error");
        timer.current = setTimeout(save, 5000);
      }
    },
    [props.level],
  );

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const set = (id: string, value: string | string[]) => {
    const next = { ...latest.current, [id]: value };
    latest.current = next;
    setBody(next);
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 1000);
  };

  const missing = missingFields(spec, body);

  return (
    <div>
      <StatusBanner status={props.status} feedback={props.feedback} />

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          startSubmit(async () => {
            setError(null);
            if (timer.current) clearTimeout(timer.current);
            dirty.current = false;
            const res = await submitLevel(props.level, latest.current);
            if (!res.ok) setError(res.error);
            else router.refresh();
          });
        }}
      >
        <fieldset disabled={readOnly} className="space-y-6">
          {spec.fields.map((f) => (
            <FieldInput key={f.id} field={f} value={body[f.id]} onChange={(v) => set(f.id, v)} topStreams={props.topStreams} readOnly={readOnly} />
          ))}
        </fieldset>

        {!readOnly && (
          <div className="border-t border-line pt-5">
            {error && (
              <p role="alert" className="mb-4 rounded-[10px] bg-danger-soft px-3 py-2 text-danger">
                {error}
              </p>
            )}
            {missing.length > 0 && (
              <div className="mb-4 text-sm text-muted">
                <p className="font-semibold text-ink">Before you can submit:</p>
                <ul className="mt-1 list-disc pl-5">
                  {missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SaveIndicator state={saveState} />
              <button type="submit" className="btn btn-primary" disabled={missing.length > 0 || submitting}>
                {submitting ? "Submitting…" : props.status === "rejected" ? "Submit again" : "Submit"}
              </button>
            </div>
            <p className="mt-3 text-sm text-muted">
              Submitting opens the next level straight away. Your teacher reads it, and the 100 points go to your house when
              they approve it. You can&apos;t edit it while it&apos;s waiting.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

function StatusBanner({ status, feedback }: { status: SubmissionStatus | null; feedback: string | null }) {
  if (status === "submitted")
    return (
      <p className="mb-6 flex gap-2 rounded-[14px] bg-royal-soft p-4 text-royal-dark" role="status">
        <Clock className="shrink-0" aria-hidden /> Sent. Your teacher will review it; the next level is already open.
      </p>
    );
  if (status === "approved")
    return (
      <div className="mb-6 flex gap-2 rounded-[14px] bg-success-soft p-4 text-success" role="status">
        <CircleCheck className="shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="font-semibold">Approved. 100 points added to your house.</p>
          {feedback && <p className="mt-1 break-words text-ink">Your teacher said: {feedback}</p>}
        </div>
      </div>
    );
  if (status === "rejected")
    return (
      <div className="mb-6 flex gap-2 rounded-[14px] bg-danger-soft p-4 text-danger" role="status">
        <CircleAlert className="shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="font-semibold">Your teacher sent this back. Improve it and send it again.</p>
          {feedback && <p className="mt-1 break-words text-ink">{feedback}</p>}
        </div>
      </div>
    );
  return null;
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "idle") return <span className="text-sm text-muted">Your writing saves automatically</span>;
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted" role="status">
      {state === "saving" && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
      {state === "saved" && <CircleCheck size={16} className="text-success" aria-hidden />}
      {state === "error" && <CircleAlert size={16} className="text-danger" aria-hidden />}
      {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Not saved yet, retrying"}
    </span>
  );
}

function FieldInput(props: {
  field: Field;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
  topStreams: { id: string; label: string }[];
  readOnly: boolean;
}) {
  const f = props.field;
  const id = `f-${f.id}`;
  const hint = "hint" in f && f.hint ? <p id={`${id}-hint`} className="mt-0.5 text-sm text-muted">{f.hint}</p> : null;

  if (f.kind === "text" || f.kind === "line") {
    const v = typeof props.value === "string" ? props.value : "";
    const len = v.trim().length;
    return (
      <div>
        <label htmlFor={id} className="block font-semibold">{f.label}</label>
        {hint}
        {f.kind === "text" ? (
          <textarea
            id={id}
            rows={f.rows ?? 5}
            value={v}
            placeholder={f.placeholder}
            onChange={(e) => props.onChange(e.target.value)}
            aria-describedby={hint ? `${id}-hint` : undefined}
            className="field mt-1.5 resize-y leading-relaxed"
          />
        ) : (
          <input
            id={id}
            value={v}
            placeholder={f.placeholder}
            onChange={(e) => props.onChange(e.target.value)}
            aria-describedby={hint ? `${id}-hint` : undefined}
            className="field mt-1.5"
          />
        )}
        {!props.readOnly && f.kind === "text" && (
          <p className={`tabular mt-1 text-right text-xs ${len >= f.min ? "text-success" : "text-muted"}`}>
            {len} / {f.min} characters minimum
          </p>
        )}
      </div>
    );
  }

  if (f.kind === "choice") {
    return (
      <fieldset>
        <legend className="font-semibold">{f.label}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {f.options.map((o) => (
            <label key={o} className="block">
              <input type="radio" name={id} value={o} checked={props.value === o} onChange={() => props.onChange(o)} className="sr-only" />
              <span className="scale-option px-4">{o}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  const picked = Array.isArray(props.value) ? props.value : [];
  const toggle = (x: string) => props.onChange(picked.includes(x) ? picked.filter((p) => p !== x) : [...picked, x]);

  if (f.kind === "streams") {
    return (
      <fieldset>
        <legend className="font-semibold">{f.label}</legend>
        {hint}
        {props.topStreams.length === 0 ? (
          <p className="mt-2 text-muted">Finish the Level 1 assessment to see your matches here.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {props.topStreams.map((s) => (
              <label key={s.id} className="block">
                <input
                  type="checkbox"
                  checked={picked.includes(s.id)}
                  disabled={!picked.includes(s.id) && picked.length >= f.maxPick}
                  onChange={() => toggle(s.id)}
                  className="sr-only"
                />
                <span className="scale-option px-4">{s.label}</span>
              </label>
            ))}
          </div>
        )}
      </fieldset>
    );
  }

  return (
    <ScholarshipPicker
      label={f.label}
      hint={hint}
      picked={picked}
      toggle={toggle}
      readOnly={props.readOnly}
      streamIds={props.topStreams.map((s) => s.id)}
    />
  );
}

const SELECTS: { key: keyof Eligibility; label: string; options: [string, string][] }[] = [
  { key: "gender", label: "Gender", options: [["any", "Prefer not to say"], ["female", "Girl"], ["male", "Boy"]] },
  { key: "state", label: "State", options: [["any", "Any state"], ["tn", "Tamil Nadu"]] },
  {
    key: "community",
    label: "Community or category",
    options: [["general", "General or not applicable"], ["scst", "SC or ST"], ["obc", "OBC"], ["minority", "Minority"], ["ebc-dnt", "EBC or DNT"]],
  },
  {
    key: "income",
    label: "Yearly family income",
    options: [
      ["unknown", "Not sure"], ["upto2_5", "Up to ₹2.5 lakh"], ["upto4", "Up to ₹4 lakh"], ["upto4_5", "Up to ₹4.5 lakh"],
      ["upto5", "Up to ₹5 lakh"], ["upto6", "Up to ₹6 lakh"], ["upto8", "Up to ₹8 lakh"], ["above8", "Above ₹8 lakh"],
    ],
  },
  {
    key: "school",
    label: "School",
    options: [["any", "Any or not sure"], ["tn-govt-6-12", "TN government school, classes 6–12"], ["tn-aided-tamil-6-12", "TN government-aided Tamil medium, 6–12"]],
  },
  {
    key: "courseLevel",
    label: "Course level",
    options: [["any", "Any higher education"], ["ug", "UG degree"], ["diploma-iti", "Diploma or ITI"], ["professional", "Professional degree"], ["pg", "Postgraduate"], ["school", "Classes 9–12"]],
  },
];

const CHECKS: { key: "disability" | "orphan" | "firstGraduate" | "loan"; label: string }[] = [
  { key: "disability", label: "Student with a disability" },
  { key: "orphan", label: "Orphan student" },
  { key: "firstGraduate", label: "First graduate in the family" },
  { key: "loan", label: "Will need an education loan" },
];

const TRUST_STYLE = {
  official: "bg-success-soft text-success",
  provider: "bg-royal-soft text-royal-dark",
  tracker: "bg-gold-soft text-ink",
  caution: "bg-danger-soft text-danger",
};

function ScholarshipPicker(props: {
  label: string;
  hint: React.ReactNode;
  picked: string[];
  toggle: (id: string) => void;
  readOnly: boolean;
  streamIds: string[];
}) {
  // Never saved: lives only in this component's state.
  const [elig, setElig] = useState<Eligibility>(DEFAULT_ELIGIBILITY);
  const suggestions = useMemo(() => eligibleScholarships(elig, props.streamIds), [elig, props.streamIds]);
  // Keep shortlisted items visible even if the checker answers change later.
  const shown = [...suggestions, ...props.picked.map(scholarshipById).filter((s) => s && !suggestions.includes(s))] as typeof suggestions;

  return (
    <div className="space-y-4">
      {!props.readOnly && (
        <section className="rounded-[14px] bg-sunken p-4">
          <h2 className="font-bold">Scholarship checker</h2>
          <p className="mt-0.5 text-sm text-muted">Optional. These answers aren&apos;t saved; they only change the suggestions below.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {SELECTS.map((s) => (
              <div key={s.key}>
                <label htmlFor={`elig-${s.key}`} className="block text-sm font-semibold">{s.label}</label>
                <select
                  id={`elig-${s.key}`}
                  value={elig[s.key] as string}
                  onChange={(e) => setElig({ ...elig, [s.key]: e.target.value })}
                  className="field mt-1"
                >
                  {s.options.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {CHECKS.map((c) => (
              <label key={c.key} className="flex items-center gap-2">
                <input type="checkbox" checked={elig[c.key]} onChange={(e) => setElig({ ...elig, [c.key]: e.target.checked })} className="size-4 accent-[var(--color-royal)]" />
                {c.label}
              </label>
            ))}
          </div>
        </section>
      )}

      <fieldset>
        <legend className="font-semibold">{props.label}</legend>
        {props.hint}
        <ul className="mt-2 space-y-2">
          {(props.readOnly ? props.picked.map(scholarshipById).filter(Boolean) as typeof suggestions : shown).map((s) => {
            const t = trustLabel(s.id);
            const on = props.picked.includes(s.id);
            return (
              <li key={s.id} className={`rounded-[12px] p-3 ${on ? "bg-royal-soft shadow-[inset_0_0_0_2px_var(--color-royal)]" : "bg-surface shadow-[inset_0_0_0_1px_var(--color-line)]"}`}>
                <div className="flex items-start gap-3">
                  <input
                    id={`sch-${s.id}`}
                    type="checkbox"
                    checked={on}
                    onChange={() => props.toggle(s.id)}
                    className="mt-1 size-4 shrink-0 accent-[var(--color-royal)]"
                  />
                  <div className="flex-1">
                    <label htmlFor={`sch-${s.id}`} className="font-semibold">{s.title}</label>
                    <p className="text-sm text-muted">{s.audience}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TRUST_STYLE[t.tone]}`}>{t.label}</span>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-royal underline">
                        Open website <ExternalLink size={14} aria-hidden />
                      </a>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </fieldset>
    </div>
  );
}
