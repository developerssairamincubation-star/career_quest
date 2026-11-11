import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setClassTeacher } from "../actions";
import { ResetPassword } from "../reset-password";
import { StaffForm } from "./staff-form";

export const metadata = { title: "Classes and staff" };

export default async function ClassesPage() {
  const me = await requireRole("admin", "counsellor");
  const supabase = await createClient();
  const [{ data: classes }, { data: staff }, { data: links }] = await Promise.all([
    supabase.from("classes").select("id, grade, section").order("grade").order("section"),
    supabase.from("profiles").select("id, full_name, email, role").neq("role", "student").order("full_name"),
    supabase.from("class_teachers").select("class_id, teacher_id"),
  ]);
  const teachers = (staff ?? []).filter((s) => s.role === "teacher");
  const byClass = new Map<string, Set<string>>();
  for (const l of links ?? []) {
    if (!byClass.has(l.class_id)) byClass.set(l.class_id, new Set());
    byClass.get(l.class_id)!.add(l.teacher_id);
  }

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-crest text-3xl font-bold">Classes and staff</h1>
        <p className="mt-2 max-w-prose text-muted">
          Teachers see only the classes they&apos;re assigned to. Counsellors and admins see every class in the school.
        </p>
        {(classes ?? []).length === 0 ? (
          <p className="mt-4 text-muted">No classes yet. They&apos;re created when you add students.</p>
        ) : teachers.length === 0 ? (
          <p className="mt-4 text-muted">Add a teacher below, then assign them to classes here.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {(classes ?? []).map((c) => {
              const assigned = byClass.get(c.id) ?? new Set();
              return (
                <li key={c.id} className="panel p-4">
                  <h2 className="font-bold">Grade {c.grade}, section {c.section}</h2>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {teachers.map((t) => {
                      const on = assigned.has(t.id);
                      return (
                        <li key={t.id}>
                          <form action={setClassTeacher}>
                            <input type="hidden" name="class_id" value={c.id} />
                            <input type="hidden" name="teacher_id" value={t.id} />
                            <input type="hidden" name="assign" value={on ? "0" : "1"} />
                            <button
                              type="submit"
                              aria-pressed={on}
                              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                                on ? "bg-royal text-white" : "bg-sunken text-muted hover:text-ink"
                              }`}
                            >
                              {t.full_name}
                            </button>
                          </form>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-bold">Staff</h2>
        <ul className="mt-3 divide-y divide-line">
          {(staff ?? []).map((s) => (
            <li key={s.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span className="font-semibold">{s.full_name}</span>
              <span className="text-muted">
                <span className="capitalize">{s.role}</span>, {s.email}
              </span>
              {me.role === "admin" && s.role !== "admin" && (
                <span className="basis-full sm:basis-auto">
                  <ResetPassword userId={s.id} name={s.full_name} />
                </span>
              )}
            </li>
          ))}
        </ul>
        {me.role === "admin" && <StaffForm />}
      </section>
    </div>
  );
}
