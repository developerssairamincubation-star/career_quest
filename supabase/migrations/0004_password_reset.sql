-- Password reset: default passwords must be replaced on first sign-in.
-- Paste into Supabase Dashboard → SQL Editor → Run.

alter table public.profiles
  add column if not exists must_change_password boolean not null default false,
  -- When someone last used "Forgot password" on the sign-in page (limits repeat requests).
  add column if not exists password_reset_at timestamptz;

-- No update policy exists on profiles, so people can't clear these flags themselves;
-- only the server (service role) changes them.
