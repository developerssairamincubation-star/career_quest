"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestDefaultPassword, type ForgotState } from "./actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState<ForgotState, FormData>(requestDefaultPassword, {});

  if (state.sent) {
    return (
      <div className="space-y-5">
        <p role="status" className="rounded-[10px] bg-gold-soft px-3 py-2">
          If <strong>{state.email}</strong> belongs to an account, we&apos;ve emailed it a temporary password. Sign in with it
          and you&apos;ll be asked to choose a new one. It can take a few minutes to arrive, so check your spam folder too.
        </p>
        <Link href="/login" className="btn btn-primary w-full">Back to sign in</Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="email" className="block font-semibold">School email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          defaultValue={state.email}
          aria-invalid={Boolean(state.error) || undefined}
          aria-describedby={state.error ? "forgot-error" : undefined}
          className="field"
        />
      </div>
      {state.error && (
        <p id="forgot-error" role="alert" className="rounded-[10px] bg-danger-soft px-3 py-2 text-danger">{state.error}</p>
      )}
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Sending…" : "Email me a temporary password"}
      </button>
      <p className="text-center">
        <Link href="/login" className="font-semibold text-royal hover:underline">Back to sign in</Link>
      </p>
    </form>
  );
}
