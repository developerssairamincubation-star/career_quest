import { requireProfileAllowingReset } from "@/lib/auth";
import { ChangePasswordForm } from "./change-password-form";

export const metadata = { title: "Change password" };

export default async function PasswordPage() {
  const profile = await requireProfileAllowingReset();
  const forced = profile.must_change_password;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-crest text-3xl font-bold">{forced ? "Choose a new password" : "Change password"}</h1>
        <p className="mt-2 max-w-prose text-muted">
          {forced
            ? "You signed in with a temporary password. Choose your own now to continue."
            : "Enter your current password, then the new one twice."}
        </p>
      </div>
      <ChangePasswordForm forced={forced} />
    </div>
  );
}
