"use client";

import { useState, useTransition } from "react";
import { resetUserPassword, type ResetResult } from "./actions";

/** Emails the person a temporary password; they must choose their own when they next sign in. */
export function ResetPassword({ userId, name }: { userId: string; name: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ResetResult | null>(null);
  return (
    <div className="max-w-xs text-right">
      <button
        type="button"
        className="btn btn-quiet"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Reset ${name}'s password? Their current password will stop working.`)) return;
          start(async () => setResult(await resetUserPassword(userId)));
        }}
      >
        {pending ? "Resetting…" : "Reset password"}
      </button>
      {result?.emailedTo && (
        <p role="status" className="mt-2 rounded-[10px] bg-gold-soft px-3 py-2 text-left text-sm">
          A temporary password was emailed to <strong>{result.emailedTo}</strong>. They&apos;ll choose a new one when they
          sign in.
        </p>
      )}
      {result?.password && (
        <p role="status" className="mt-2 rounded-[10px] bg-gold-soft px-3 py-2 text-left text-sm">
          {result.mailNote} Give {name} this temporary password yourself:{" "}
          <strong className="tabular">{result.password}</strong>. It won&apos;t be shown again, and they&apos;ll choose a
          new one when they sign in.
        </p>
      )}
      {result?.error && <p role="alert" className="mt-2 text-left text-sm text-danger">{result.error}</p>}
    </div>
  );
}
