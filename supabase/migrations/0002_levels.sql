-- Career House Quest: Levels 2–5 (write-ups + teacher review)
-- Run after 0001_phase1.sql: Supabase Dashboard → SQL Editor → paste → Run.

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  level smallint not null check (level between 2 and 5),
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  body jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, level)
);
create index on public.submissions (status, submitted_at);

-- A level opens once the previous one is finished:
--   Level 2 after the Level 1 assessment is completed,
--   Levels 3–5 after the previous level has been submitted (or approved).
create or replace function public.level_unlocked(student uuid, lvl int) returns boolean
language sql stable security definer set search_path = public as
$$
  select case
    when lvl = 2 then exists (select 1 from assessments where student_id = student and status = 'completed')
    when lvl between 3 and 5 then exists (
      select 1 from submissions where student_id = student and level = lvl - 1 and status in ('submitted', 'approved'))
    else false
  end
$$;

alter table public.submissions enable row level security;

create policy "read submissions" on public.submissions for select using (public.can_view_student(student_id));

-- Students write only their own rows, only for unlocked levels, and only while the row is a
-- draft or was sent back. Waiting-for-review and approved rows are locked. Students can only
-- set draft/submitted; approve/reject is done by the server for staff.
create policy "start submission" on public.submissions for insert with check (
  student_id = auth.uid()
  and status in ('draft', 'submitted')
  and public.level_unlocked(auth.uid(), level));
create policy "edit submission" on public.submissions for update
  using (student_id = auth.uid() and status in ('draft', 'rejected'))
  with check (student_id = auth.uid() and status in ('draft', 'submitted'));

-- Students can't touch review fields, level or owner.
create or replace function public.guard_submission_update() returns trigger
language plpgsql as $$
begin
  if auth.role() <> 'service_role' then
    new.student_id := old.student_id;
    new.level := old.level;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
    new.feedback := old.feedback;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger guard_submission_update before update on public.submissions
  for each row execute function public.guard_submission_update();

create or replace function public.guard_submission_insert() returns trigger
language plpgsql as $$
begin
  if auth.role() <> 'service_role' then
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.feedback := null;
  end if;
  return new;
end $$;
create trigger guard_submission_insert before insert on public.submissions
  for each row execute function public.guard_submission_insert();
