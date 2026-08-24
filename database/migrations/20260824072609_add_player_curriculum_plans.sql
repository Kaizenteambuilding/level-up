-- Recovered from the applied Supabase migration history.
-- Version: 20260824072609 · add_player_curriculum_plans

-- Calendar-aware curriculum pacing, kept separate from game level and adaptive mastery.
create table if not exists public.player_curriculum_plans (
  player_id uuid not null references public.players(id) on delete cascade,
  subject_id text not null,
  academic_year_start smallint not null check (academic_year_start between 2020 and 2100),
  pacing_mode text not null default 'automatic' check (pacing_mode in ('automatic', 'manual')),
  current_term smallint not null default 1 check (current_term between 1 and 3),
  focus_unit_ids text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (player_id, subject_id)
);

alter table public.player_curriculum_plans enable row level security;

create policy "parent can read family curriculum plans"
on public.player_curriculum_plans
for select
to authenticated
using (
  player_id in (
    select p.id
    from public.players p
    join public.parent_profiles pp on pp.family_id = p.family_id
    where pp.id = (select auth.uid())
  )
);

grant select on table public.player_curriculum_plans to authenticated;
revoke all privileges on table public.player_curriculum_plans from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.player_curriculum_plans from authenticated;

create or replace function public.set_player_curriculum_plan(
  p_player_id uuid,
  p_subject_id text,
  p_academic_year_start integer,
  p_pacing_mode text,
  p_current_term integer,
  p_focus_unit_ids text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_focus_unit_ids text[];
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.players p
    join public.parent_profiles pp on pp.family_id = p.family_id
    where p.id = p_player_id and pp.id = auth.uid()
  ) then
    raise exception 'Player not available';
  end if;

  if p_subject_id <> 'math' then
    raise exception 'Unsupported subject';
  end if;
  if p_academic_year_start < 2020 or p_academic_year_start > 2100 then
    raise exception 'Invalid academic year';
  end if;
  if p_pacing_mode not in ('automatic', 'manual') then
    raise exception 'Invalid pacing mode';
  end if;
  if p_current_term < 1 or p_current_term > 3 then
    raise exception 'Invalid term';
  end if;

  select coalesce(array_agg(distinct requested.unit_id order by requested.unit_id), '{}')
    into v_focus_unit_ids
  from unnest(coalesce(p_focus_unit_ids, '{}')) requested(unit_id)
  join public.curriculum_units cu on cu.id = requested.unit_id
  where cu.subject_id = p_subject_id
    and cu.active = true
    and cu.sort_order > (p_current_term - 1) * 5
    and cu.sort_order <= p_current_term * 5;

  if p_pacing_mode = 'manual' and cardinality(v_focus_unit_ids) = 0 then
    raise exception 'Manual pacing requires at least one current unit';
  end if;

  insert into public.player_curriculum_plans(
    player_id, subject_id, academic_year_start, pacing_mode,
    current_term, focus_unit_ids, updated_at
  ) values (
    p_player_id, p_subject_id, p_academic_year_start, p_pacing_mode,
    p_current_term, v_focus_unit_ids, now()
  )
  on conflict (player_id, subject_id) do update
  set academic_year_start = excluded.academic_year_start,
      pacing_mode = excluded.pacing_mode,
      current_term = excluded.current_term,
      focus_unit_ids = excluded.focus_unit_ids,
      updated_at = excluded.updated_at;

  return jsonb_build_object(
    'player_id', p_player_id,
    'subject_id', p_subject_id,
    'academic_year_start', p_academic_year_start,
    'pacing_mode', p_pacing_mode,
    'current_term', p_current_term,
    'focus_unit_ids', v_focus_unit_ids
  );
end;
$function$;

revoke execute on function public.set_player_curriculum_plan(uuid, text, integer, text, integer, text[])
  from public, anon;
grant execute on function public.set_player_curriculum_plan(uuid, text, integer, text, integer, text[])
  to authenticated;

