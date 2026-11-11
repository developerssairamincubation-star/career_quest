"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});
  const error = state.error ?? notice;

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="email" className="block font-semibold">
          School email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          defaultValue={state.email}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? "login-error" : undefined}
          className="field"
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="password" className="block font-semibold">
            Password
          </label>
          <Link href="/login/forgot" className="text-sm font-semibold text-royal hover:underline">
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? "login-error" : undefined}
          className="field"
        />
      </div>
      {error && (
        <p id="login-error" role="alert" className="rounded-[10px] bg-danger-soft px-3 py-2 text-danger">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
