"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { HOUSES } from "@/lib/houses";
import { generatePassword } from "@/lib/passwords";
import { issueDefaultPassword } from "@/lib/password-reset";
import { createAdminClient } from "@/lib/supabase/server";
import { readTable } from "./import/xlsx";

const MAX_ROWS = 1000;

const rowSchema = z.object({
  email: z.string().trim().toLowerCase().email("invalid email"),
  full_name: z.string().trim().min(1, "name is missing"),
  roll_no: z.string().trim().optional().default(""),
  grade: z.coerce.number().int().min(9, "grade must be 9–12").max(12, "grade must be 9–12"),
  section: z.string().trim().toUpperCase().min(1, "section is missing"),
  teacher: z.string().trim().optional().default(""),
  house: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .transform((h) => (h ? h : null))
    .refine((h) => h === null || HOUSES.some((x) => x.id === h), "house must be varunaa, vaaranam, veera or vimaana"),
  password: z.string().optional().transform((p) => (p && p.length >= 8 ? p : null)),
});

export type ImportRowResult = {
  line: number;
  email: string;
  full_name: string;
  status: "created" | "error";
  message?: string;
  password?: string;
};
export type ImportState = { results?: ImportRowResult[]; error?: string };

export async function importStudents(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const me = await requireRole("admin", "counsellor");
  if (!me.school_id) return { error: "Your account isn't linked to a school." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV or Excel file to upload." };
  if (file.size > 2_000_000) return { error: "That file is over 2 MB. Split it into smaller files." };

  const table = await readTable(file).catch(() => null);
  if (!table) return { error: "Couldn't read that file. Upload the template (.xlsx) or a .csv." };
  const missing = ["email", "full_name", "grade", "section"].filter((c) => !table.fields.includes(c));
  if (missing.length) return { error: `The file is missing these columns: ${missing.join(", ")}.` };
  if (table.rows.length > MAX_ROWS) return { error: `Upload at most ${MAX_ROWS} students at a time.` };

  const admin = createAdminClient();
  const classCache = new Map<string, string>();
  const classId = async (grade: number, section: string) => {
    const key = `${grade}-${section}`;
    if (classCache.has(key)) return classCache.get(key)!;
    const { data, error } = await admin
      .from("classes")
      .upsert({ school_id: me.school_id, grade, section }, { onConflict: "school_id,grade,section" })
      .select("id")
      .single();
    if (error) throw error;
    classCache.set(key, data.id);
    return data.id as string;
  };

  // Teacher name (any case) -> teacher record(s) in this school.
  const { data: teacherRows } = await admin
    .from("profiles")
    .select("id, full_name")
    .eq("role", "teacher")
    .eq("school_id", me.school_id);
  const teachersByName = new Map<string, string[]>();
  for (const t of teacherRows ?? []) {
    const key = (t.full_name as string).trim().toLowerCase();
    teachersByName.set(key, [...(teachersByName.get(key) ?? []), t.id as string]);
  }

  const results: ImportRowResult[] = [];
  for (const [i, raw] of table.rows.entries()) {
    const line = i + 2; // header is line 1
    const row = rowSchema.safeParse(raw);
    if (!row.success) {
      results.push({
        line,
        email: raw.email ?? "",
        full_name: raw.full_name ?? "",
        status: "error",
        message: row.error.issues.map((x) => x.message).join("; "),
      });
      continue;
    }
    const r = row.data;
    const teacherIds = r.teacher ? (teachersByName.get(r.teacher.toLowerCase()) ?? []) : [];
    if (r.teacher && teacherIds.length !== 1) {
      results.push({
        line,
        email: r.email,
        full_name: r.full_name,
        status: "error",
        message: teacherIds.length ? `more than one teacher is named "${r.teacher}"` : `"${r.teacher}" isn't a teacher in your school`,
      });
      continue;
    }
    const password = r.password ?? generatePassword();
    try {
      const cid = await classId(r.grade, r.section);
      // Teachers are linked to classes, so the named teacher looks after this student's class.
      if (teacherIds[0]) {
        const { error: tErr } = await admin.from("class_teachers").upsert({ class_id: cid, teacher_id: teacherIds[0] });
        if (tErr) throw tErr;
      }
      const { data: created, error } = await admin.auth.admin.createUser({
        email: r.email,
        password,
        email_confirm: true,
        user_metadata: { full_name: r.full_name },
      });
      if (error || !created.user) {
        results.push({
          line,
          email: r.email,
          full_name: r.full_name,
          status: "error",
          message: error?.message.includes("already") ? "an account with this email already exists" : error?.message,
        });
        continue;
      }
      const { error: pErr } = await admin.from("profiles").insert({
        id: created.user.id,
        school_id: me.school_id,
        role: "student",
        full_name: r.full_name,
        email: r.email,
        class_id: cid,
        roll_no: r.roll_no || null,
        house: r.house,
      });
      if (pErr) {
        await admin.auth.admin.deleteUser(created.user.id);
        throw pErr;
      }
      results.push({ line, email: r.email, full_name: r.full_name, status: "created", password });
    } catch (e) {
      results.push({ line, email: r.email, full_name: r.full_name, status: "error", message: (e as Error).message });
    }
  }
  revalidatePath("/staff");
  return { results };
}

const staffSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  full_name: z.string().trim().min(1, "Enter a name."),
  role: z.enum(["teacher", "counsellor", "admin"]),
});

export type StaffState = { error?: string; created?: { email: string; password: string } };

export async function createStaff(_prev: StaffState, formData: FormData): Promise<StaffState> {
  const me = await requireRole("admin");
  const parsed = staffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const admin = createAdminClient();
  const password = generatePassword();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) return { error: error?.message ?? "Couldn't create the account." };
  const { error: pErr } = await admin.from("profiles").insert({
    id: data.user.id,
    school_id: me.school_id,
    role: parsed.data.role,
    full_name: parsed.data.full_name,
    email: parsed.data.email,
  });
  if (pErr) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: pErr.message };
  }
  revalidatePath("/staff/classes");
  return { created: { email: parsed.data.email, password } };
}

export async function setClassTeacher(formData: FormData) {
  const me = await requireRole("admin", "counsellor");
  const classId = z.string().uuid().parse(formData.get("class_id"));
  const teacherId = z.string().uuid().parse(formData.get("teacher_id"));
  const assign = formData.get("assign") === "1";
  const admin = createAdminClient();

  // Both must belong to the caller's school.
  const [{ data: cls }, { data: teacher }] = await Promise.all([
    admin.from("classes").select("school_id").eq("id", classId).single(),
    admin.from("profiles").select("school_id, role").eq("id", teacherId).single(),
  ]);
  if (cls?.school_id !== me.school_id || teacher?.school_id !== me.school_id || teacher?.role !== "teacher") {
    throw new Error("That class or teacher isn't in your school.");
  }
  if (assign) {
    await admin.from("class_teachers").upsert({ class_id: classId, teacher_id: teacherId });
  } else {
    await admin.from("class_teachers").delete().eq("class_id", classId).eq("teacher_id", teacherId);
  }
  revalidatePath("/staff/classes");
}

export type ResetResult = {
  error?: string;
  /** Where the temporary password was emailed. */
  emailedTo?: string;
  /** Only when email wasn't possible: the password to pass on in person. */
  password?: string;
  mailNote?: string;
};

/**
 * Who may reset whom:
 *  - a student: their class teacher, or a counsellor/admin of the same school
 *  - a teacher or counsellor: an admin of the same school
 *  - an admin: nobody else (they use "Forgot password" or Change password themselves)
 * The person gets a temporary password by email and must replace it when they next sign in.
 */
export async function resetUserPassword(userId: string): Promise<ResetResult> {
  const me = await requireRole("admin", "counsellor", "teacher");
  if (!z.string().uuid().safeParse(userId).success) return { error: "Person not found." };
  const admin = createAdminClient();
  const { data: t } = await admin
    .from("profiles")
    .select("id, school_id, class_id, role, email, full_name")
    .eq("id", userId)
    .single();
  if (!t || t.school_id !== me.school_id) return { error: "Person not found." };

  if (t.role === "student") {
    if (me.role === "teacher") {
      const { data: ok } = await admin
        .from("class_teachers")
        .select("class_id")
        .eq("teacher_id", me.id)
        .eq("class_id", t.class_id)
        .maybeSingle();
      if (!ok) return { error: "This student isn't in one of your classes." };
    }
  } else if (t.role === "teacher" || t.role === "counsellor") {
    if (me.role !== "admin") return { error: "Only an admin can reset a teacher's or counsellor's password." };
  } else {
    return { error: "Admins reset their own password: use Forgot password on the sign-in page, or Change password in the profile menu." };
  }

  const r = await issueDefaultPassword(t as { id: string; email: string; full_name: string }, "staff");
  if (!r.ok) return { error: r.message ?? "Couldn't reset the password. Try again." };
  if (r.emailed) return { emailedTo: t.email };
  return {
    password: r.password,
    mailNote:
      r.reason === "not-configured"
        ? "Email isn't set up yet, so the password wasn't emailed."
        : "The email couldn't be sent.",
  };
}
