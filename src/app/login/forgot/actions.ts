"use server";

import { z } from "zod";
import { mailConfigured } from "@/lib/mail";
import { issueDefaultPassword } from "@/lib/password-reset";
import { createAdminClient } from "@/lib/supabase/server";

export type ForgotState = { error?: string; sent?: boolean; email?: string };

const schema = z.object({ email: z.string().trim().toLowerCase().email("Enter the email address your school gave you.") });

// The answer is the same whether or not the address belongs to an account, so this form can't be
// used to find out who has one.
export async function requestDefaultPassword(_prev: ForgotState, formData: FormData): Promise<ForgotState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0].message, email };

  // The password is only ever sent by email. With no email set up, resetting would just lock people out.
  if (!mailConfigured()) {
    return {
      error: "Email isn't set up yet, so we can't send a new password. Ask your teacher (students) or your school admin (teachers) to reset it.",
      email,
    };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .eq("email", parsed.data.email)
    .maybeSingle();
  if (profile) {
    const r = await issueDefaultPassword(profile, "self");
    if (!r.ok && r.error !== "cooldown") console.error("forgot password failed:", r.error, r.message ?? "");
  }
  return { sent: true, email: parsed.data.email };
}
