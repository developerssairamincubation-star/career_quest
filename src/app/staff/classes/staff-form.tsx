"use client";

import { useActionState } from "react";
import { createStaff, type StaffState } from "../actions";

export function StaffForm() {
  const [state, action, pending] = useActionState<StaffState, FormData>(createStaff, {});
  return (
    <form action={action} className="panel mt-6 grid gap-4 p-5 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
      <h3 className="font-bold sm:col-span-4">Add a staff member</h3>
      <div>
        <label htmlFor="sf-name" className="block font-semibold">Name</label>
        <input id="sf-name" name="full_name" required className="field mt-1.5" />
      </div>
      <div>
        <label htmlFor="sf-email" className="block font-semibold">Email</label>
        <input id="sf-email" name="email" type="email" required className="field mt-1.5" />
      </div>
      <div>
        <label htmlFor="sf-role" className="block font-semibold">Role</label>
        <select id="sf-role" name="role" className="field mt-1.5" defaultValue="teacher">
          <option value="teacher">Teacher</option>
          <option value="counsellor">Counsellor</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Adding…" : "Add staff member"}
      </button>
      {state.error && <p role="alert" className="text-danger sm:col-span-4">{state.error}</p>}
      {state.created && (
        <p role="status" className="rounded-[10px] bg-gold-soft px-3 py-2 sm:col-span-4">
          Account created for <strong>{state.created.email}</strong>. Their password is{" "}
          <strong className="tabular">{state.created.password}</strong>. Share it with them now; it won&apos;t be shown again.
        </p>
      )}
    </form>
  );
}
