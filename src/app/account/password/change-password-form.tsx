"use client";

import { useActionState } from "react";
import { changePassword, type ChangePasswordState } from "./actions";

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [state, action, pending] = useActionState<ChangePasswordState, FormData>(changePassword, {});
  return (
    <form action={action} className="panel max-w-md space-y-5 p-6" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="current" className="block font-semibold">
          {forced ? "Temporary password (from your email)" : "Current password"}
        </label>
        <input id="current" name="current" type="password" autoComplete="current-password" required className="field" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="next" className="block font-semibold">New password</label>
        <input id="next" name="next" type="password" autoComplete="new-password" minLength={8} required className="field" />
        <p className="text-sm text-muted">At least 8 characters.</p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="confirm" className="block font-semibold">Confirm new password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="field" />
      </div>
      {state.error && (
        <p role="alert" className="rounded-[10px] bg-danger-soft px-3 py-2 text-danger">{state.error}</p>
      )}
      {state.done && (
        <p role="status" className="rounded-[10px] bg-gold-soft px-3 py-2">Your password has been changed.</p>
      )}
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
