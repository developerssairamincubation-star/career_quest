-- Career House Quest: Phase 1 schema
-- Paste into Supabase Dashboard → SQL Editor → Run. Safe to run once on an empty project.

create type public.app_role as enum ('student', 'teacher', 'counsellor', 'admin');

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  grade smallint not null check (grade between 9 and 12),
  section text not null,
  created_at timestamptz not null default now(),
  unique (school_id, grade, section)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  role public.app_role not null default 'student',
  full_name text not null,
  email text not null,
  class_id uuid references public.classes(id) on delete set null,
  roll_no text,
  house text check (house in ('varunaa', 'vaaranam', 'veera', 'vimaana')),
  created_at timestamptz not null default now()
);
create index on public.profiles (school_id, role);
create index on public.profiles (class_id);

-- Which teachers look after which classes.
create table public.class_teachers (
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  primary key (class_id, teacher_id)
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  attempt_no int not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  step text not null default 'orientation',
  answers jsonb not null,
  results jsonb,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (student_id, attempt_no)
);
-- At most one unfinished attempt per student.
create unique index one_open_attempt on public.assessments (student_id) where status = 'in_progress';

-- Points are only ever inserted by the server (service role). One award per student per level.
create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  house text not null,
  level smallint not null check (level between 1 and 5),
  amount int not null check (amount > 0),
  reason text not null,
  source_id uuid,
  awarded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (student_id, level)
);
create index on public.points_ledger (house);

-- ---------- helpers (security definer so policies don't recurse) ----------
create or replace function public.my_role() returns public.app_role
language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

create or replace function public.my_school() returns uuid
language sql stable security definer set search_path = public as
$$ select school_id from profiles where id = auth.uid() $$;

-- Can the signed-in user see this student's data?
create or replace function public.can_view_student(target uuid) returns boolean
language sql stable security definer set search_path = public as
$$
  select
    target = auth.uid()
    or exists (
      select 1 from profiles me join profiles s on s.id = target
      where me.id = auth.uid()
        and s.school_id = me.school_id
        and (
          me.role in ('counsellor', 'admin')
          or (me.role = 'teacher' and exists (
                select 1 from class_teachers ct
                where ct.teacher_id = me.id and ct.class_id = s.class_id))
        )
    )
$$;

-- ---------- row level security ----------
alter table public.schools enable row level security;
alter table public.classes enable row level security;
alter table public.profiles enable row level security;
alter table public.class_teachers enable row level security;
alter table public.assessments enable row level security;
alter table public.points_ledger enable row level security;

create policy "own school" on public.schools for select using (id = public.my_school());
create policy "own school classes" on public.classes for select using (school_id = public.my_school());
create policy "visible profiles" on public.profiles for select using (public.can_view_student(id) or (school_id = public.my_school() and role <> 'student'));
create policy "staff assignments" on public.class_teachers for select using (
  teacher_id = auth.uid() or public.my_role() in ('counsellor', 'admin'));

-- Students can create and edit only their own unfinished attempt, and can never write results.
create policy "read assessments" on public.assessments for select using (public.can_view_student(student_id));
create policy "start attempt" on public.assessments for insert with check (
  student_id = auth.uid() and status = 'in_progress' and results is null and completed_at is null);
create policy "save draft" on public.assessments for update
  using (student_id = auth.uid() and status = 'in_progress')
  with check (student_id = auth.uid() and status = 'in_progress' and results is null and completed_at is null);

create policy "read points" on public.points_ledger for select using (public.can_view_student(student_id));

-- Students cannot change their own attempt number or start time either.
create or replace function public.guard_assessment_update() returns trigger
language plpgsql as $$
begin
  if auth.role() <> 'service_role' then
    new.attempt_no := old.attempt_no;
    new.started_at := old.started_at;
    new.student_id := old.student_id;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger guard_assessment_update before update on public.assessments
  for each row execute function public.guard_assessment_update();

-- House totals for the signed-in user's school (aggregates only, no student names).
create or replace function public.house_standings()
returns table (house text, points bigint, students bigint)
language sql stable security definer set search_path = public as
$$
  select h.house, coalesce(sum(pl.amount), 0) as points, count(distinct p.id) as students
  from (values ('varunaa'), ('vaaranam'), ('veera'), ('vimaana')) as h(house)
  left join profiles p on p.house = h.house and p.school_id = public.my_school() and p.role = 'student'
  left join points_ledger pl on pl.student_id = p.id
  group by h.house
  order by points desc, h.house
$$;

revoke all on function public.house_standings() from anon;
grant execute on function public.house_standings() to authenticated;

-- Per-class progress for the staff overview, limited to the classes the caller may see.
create or replace function public.class_summary()
returns table (class_id uuid, grade smallint, section text, students bigint, started bigint, completed bigint)
language sql stable security definer set search_path = public as
$$
  select c.id, c.grade, c.section,
         count(distinct p.id) as students,
         count(distinct a.student_id) as started,
         count(distinct a.student_id) filter (where a.status = 'completed') as completed
  from classes c
  join profiles me on me.id = auth.uid()
  left join profiles p on p.class_id = c.id and p.role = 'student'
  left join assessments a on a.student_id = p.id
  where c.school_id = me.school_id
    and (me.role in ('counsellor', 'admin')
         or (me.role = 'teacher' and exists (
               select 1 from class_teachers ct where ct.class_id = c.id and ct.teacher_id = me.id)))
  group by c.id, c.grade, c.section
  order by c.grade, c.section
$$;

revoke all on function public.class_summary() from anon;
grant execute on function public.class_summary() to authenticated;
