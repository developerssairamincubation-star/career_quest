import "server-only";
import { headers } from "next/headers";
import { defaultPasswordEmail, mailConfigured, sendMail } from "@/lib/mail";
import { generatePassword } from "@/lib/passwords";
import { createAdminClient } from "@/lib/supabase/server";

/** How long someone must wait between "Forgot password" requests (limits lock-out abuse). */
export const FORGOT_COOLDOWN_MS = 10 * 60_000;

export type IssueResult =
  | { ok: true; emailed: true }
  | { ok: true; emailed: false; password: string; reason: "not-configured" | "failed" }
  | { ok: false; error: "cooldown" | "mail-failed" | "db" ; message?: string };

async function signInUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/login`;
}

/**
 * Gives a person a new default password and marks it "must change".
 *
 * - `self`: they asked on the sign-in page. The password is ONLY ever emailed, never shown, and if the
 *   email can't be sent nothing changes (otherwise anyone could take over any account).
 * - `staff`: a teacher/admin reset it. If email isn't available the password is returned so the staff
 *   member can pass it on in person.
 *
 * Callers must have checked who is allowed to reset whom before calling this.
 */
export async function issueDefaultPassword(
  target: { id: string; email: string; full_name: string },
  by: "self" | "staff",
): Promise<IssueResult> {
  const admin = createAdminClient();
  const password = generatePassword();

  // 1. Self requests: atomically claim the cooldown slot so parallel requests can't both go through.
  if (by === "self") {
    const now = new Date();
    const cutoff = new Date(now.getTime() - FORGOT_COOLDOWN_MS).toISOString();
    const { data, error } = await admin
      .from("profiles")
      .update({ password_reset_at: now.toISOString() })
      .eq("id", target.id)
      .or(`password_reset_at.is.null,password_reset_at.lt.${cutoff}`)
      .select("id");
    if (error) return { ok: false, error: "db", message: error.message };
    if (!data?.length) return { ok: false, error: "cooldown" };
  }

  // 2. Email first: if it can't be sent, the old password keeps working.
  const mail = defaultPasswordEmail({
    name: target.full_name,
    password,
    signInUrl: await signInUrl(),
    byStaff: by === "staff",
  });
  const configured = mailConfigured();
  const emailed = configured && (await sendMail({ to: target.email, ...mail }));
  if (!emailed && by === "self") {
    await admin.from("profiles").update({ password_reset_at: null }).eq("id", target.id);
    return { ok: false, error: "mail-failed" };
  }

  // 3. Flag, then password. If the password step fails the flag is harmless (they just change it).
  const { error: fErr } = await admin.from("profiles").update({ must_change_password: true }).eq("id", target.id);
  if (fErr) return { ok: false, error: "db", message: fErr.message };
  const { error: pErr } = await admin.auth.admin.updateUserById(target.id, { password });
  if (pErr) return { ok: false, error: "db", message: pErr.message };

  return emailed ? { ok: true, emailed: true } : { ok: true, emailed: false, password, reason: configured ? "failed" : "not-configured" };
}
