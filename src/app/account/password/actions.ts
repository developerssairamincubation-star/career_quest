"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfileAllowingReset } from "@/lib/auth";
import { createAdminClient, createClient, createStatelessClient } from "@/lib/supabase/server";

export type ChangePasswordState = { error?: string; done?: boolean };

// 72 is the most characters the password hash (bcrypt) looks at.
const schema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    next: z.string().min(8, "Your new password needs at least 8 characters.").max(72, "Use 72 characters or fewer."),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "The new passwords don't match." })
  .refine((v) => v.next !== v.current, { path: ["next"], message: "Choose a password different from the current one." });

export async function changePassword(_prev: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const profile = await requireProfileAllowingReset();
  const parsed = schema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Prove they know the current password, without touching their session cookies.
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const email = (claims?.claims?.email as string | undefined) ?? profile.email;
  const { error: badOld } = await createStatelessClient().auth.signInWithPassword({
    email,
    password: parsed.data.current,
  });
  if (badOld) {
    return {
      error: profile.must_change_password
        ? "That isn't the temporary password we sent. Check the email and try again."
        : "Your current password isn't right.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(profile.id, { password: parsed.data.next });
  if (error) return { error: error.message };
  const { error: fErr } = await admin.from("profiles").update({ must_change_password: false }).eq("id", profile.id);
  if (fErr) return { error: "Your password changed, but we couldn't finish. Sign out and back in, then try again." };

  if (profile.must_change_password) redirect("/start");
  return { done: true };
}
