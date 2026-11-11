import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";

// Signed-in home: sends each role to its own area. The public landing page lives at "/".
export default async function Start() {
  const profile = await requireProfile();
  redirect(profile.role === "student" ? "/quest" : "/staff");
}
