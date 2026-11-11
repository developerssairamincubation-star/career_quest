-- House totals for the public landing page. Returns only per-house aggregates (no names,
-- classes or individual scores), so it is safe to expose to signed-out visitors.
create or replace function public.alliance_standings()
returns table (house text, points bigint, members bigint, levels_cleared bigint)
language sql stable security definer set search_path = public as
$$
  select h.house,
         coalesce((select sum(pl.amount) from points_ledger pl where pl.house = h.house), 0) as points,
         (select count(*) from profiles p where p.house = h.house and p.role = 'student') as members,
         (select count(*) from points_ledger pl where pl.house = h.house) as levels_cleared
  from (values ('varunaa'), ('vaaranam'), ('veera'), ('vimaana')) as h(house)
  order by points desc, h.house
$$;

revoke all on function public.alliance_standings() from public;
grant execute on function public.alliance_standings() to anon, authenticated;
