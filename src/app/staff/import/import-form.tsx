"use client";

import { useActionState } from "react";
import { Download } from "lucide-react";
import { importStudents, type ImportState } from "../actions";

function downloadCredentials(rows: NonNullable<ImportState["results"]>) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = ["full_name,email,password", ...rows.filter((r) => r.password).map((r) => [r.full_name, r.email, r.password!].map(esc).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "student-sign-ins.csv" });
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportForm() {
  const [state, action, pending] = useActionState<ImportState, FormData>(importStudents, {});
  const created = state.results?.filter((r) => r.status === "created") ?? [];
  const failed = state.results?.filter((r) => r.status === "error") ?? [];

  return (
    <>
      <form action={action} className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label htmlFor="file" className="block font-semibold">Template or CSV file</label>
          <input id="file" name="file" type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required className="field mt-1.5 py-2" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Creating accounts…" : "Create accounts"}
        </button>
      </form>
      {state.error && (
        <p role="alert" className="mt-4 rounded-[10px] bg-danger-soft px-3 py-2 text-danger">{state.error}</p>
      )}

      {state.results && (
        <section className="mt-8" aria-live="polite">
          <h2 className="text-xl font-bold">
            {created.length} created{failed.length > 0 && `, ${failed.length} not created`}
          </h2>
          {created.length > 0 && (
            <div className="mt-3 rounded-[14px] bg-gold-soft p-4">
              <p className="font-semibold">Download the sign-in details now.</p>
              <p className="mt-1 text-sm">
                Passwords are shown only once and aren&apos;t stored anywhere you can see later. If one is lost, reset it
                from the student&apos;s page.
              </p>
              <button type="button" className="btn btn-primary mt-3" onClick={() => downloadCredentials(created)}>
                <Download size={18} aria-hidden /> Download sign-in details (CSV)
              </button>
            </div>
          )}
          {failed.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-[14px] bg-surface shadow-[var(--shadow-raised)]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-muted">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Line</th>
                    <th className="px-4 py-2 font-semibold">Email</th>
                    <th className="px-4 py-2 font-semibold">Problem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {failed.map((r) => (
                    <tr key={r.line}>
                      <td className="tabular px-4 py-2">{r.line}</td>
                      <td className="px-4 py-2">{r.email || "(blank)"}</td>
                      <td className="px-4 py-2 text-danger">{r.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
