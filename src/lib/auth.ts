import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "student" | "teacher" | "counsellor" | "admin";

export type Profile = {
  id: string;
  school_id: string | null;
  role: Role;
  full_name: string;
  email: string;
  class_id: string | null;
  roll_no: string | null;
  house: HouseId | null;
  /** True after a default password was issued; the person must choose their own before doing anything else. */
  must_change_password: boolean;
};

export type HouseId = "varunaa" | "vaaranam" | "veera" | "vimaana";

export const CHANGE_PASSWORD_PATH = "/account/password";

const loadProfile = cache(async (): Promise<Profile> => {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) redirect("/login");
  const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
  if (!data) redirect("/login?error=no-profile");
  return data as Profile;
});

/** The change-password page only: the profile without the "must change password" redirect. */
export const requireProfileAllowingReset = loadProfile;

/**
 * The signed-in user's profile, or a redirect to /login. Cached per request.
 * Someone holding a default password is sent to change it first, so every page and action is gated.
 */
export async function requireProfile(): Promise<Profile> {
  const profile = await loadProfile();
  if (profile.must_change_password) redirect(CHANGE_PASSWORD_PATH);
  return profile;
}

export async function requireRole(...roles: Role[]) {
  const profile = await requireProfile();
  if (!roles.includes(profile.role)) redirect("/start");
  return profile;
}

export const isStaff = (role: Role) => role !== "student";
