"use client";

import { useActionState } from "react";
import { reviewSubmission, type ReviewState } from "../../review-actions";

export function ReviewForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(reviewSubmission, {});
  return (
    <form action={action} className="panel mt-8 space-y-4 p-5">
      <input type="hidden" name="id" value={id} />
      <div>
        <label htmlFor="feedback" className="block font-semibold">Feedback for the student</label>
        <p id="feedback-hint" className="text-sm text-muted">Needed when you send it back; optional when you approve.</p>
        <textarea id="feedback" name="feedback" rows={4} aria-describedby="feedback-hint" className="field mt-1.5" />
      </div>
      {state.error && <p role="alert" className="rounded-[10px] bg-danger-soft px-3 py-2 text-danger">{state.error}</p>}
      <div className="flex flex-wrap justify-end gap-3">
        <button type="submit" name="decision" value="reject" className="btn btn-quiet" disabled={pending}>
          Send back to improve
        </button>
        <button type="submit" name="decision" value="approve" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Approve and add 100 points"}
        </button>
      </div>
    </form>
  );
}
