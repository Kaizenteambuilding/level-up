create table if not exists public.boss_attempts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  subject_id text not null check (subject_id in ('math','spanish','english','geography_history','biology_geology')),
  school_year_start integer not null,
  term smallint not null check (term between 1 and 3),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  correct integer,
  total integer,
  percent integer,
  passed boolean not null default false,
  failed_areas text[] not null default '{}',
  next_retry_at timestamptz,
  check (correct is null or correct >= 0),
  check (total is null or total > 0),
  check (percent is null or percent between 0 and 100)
);

create index if not exists boss_attempts_player_term_idx
  on public.boss_attempts(player_id, school_year_start, term, subject_id, started_at desc);

alter table public.boss_attempts enable row level security;
revoke all on table public.boss_attempts from public, anon, authenticated;

create or replace function public.get_levelup_boss_status(p_player_id uuid, p_subject_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Europe/Madrid')::date;
  v_school_year_start integer;
  v_term smallint := 0;
  v_unlock_date date;
  v_streak integer := 0;
  v_latest date;
  v_passed boolean := false;
  v_retry_at timestamptz;
  v_available boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_subject_id not in ('math','spanish','english','geography_history','biology_geology') then
    raise exception 'Unknown subject';
  end if;

  if not exists (
    select 1
    from public.players p
    join public.parent_profiles pp on pp.family_id = p.family_id
    where p.id = p_player_id
      and pp.id = auth.uid()
  ) then
    raise exception 'Player not available';
  end if;

  v_school_year_start := case
    when extract(month from v_today)::integer >= 9 then extract(year from v_today)::integer
    else extract(year from v_today)::integer - 1
  end;

  if v_today >= make_date(v_school_year_start + 1, 6, 1) then
    v_term := 3;
    v_unlock_date := make_date(v_school_year_start + 1, 6, 1);
  elsif v_today >= make_date(v_school_year_start + 1, 3, 15) then
    v_term := 2;
    v_unlock_date := make_date(v_school_year_start + 1, 3, 15);
  elsif v_today >= make_date(v_school_year_start, 12, 8) then
    v_term := 1;
    v_unlock_date := make_date(v_school_year_start, 12, 8);
  else
    v_term := 0;
    v_unlock_date := make_date(v_school_year_start, 12, 8);
  end if;

  with activity_dates as (
    select distinct (ss.ended_at at time zone 'Europe/Madrid')::date activity_date
    from public.study_sessions ss
    where ss.player_id = p_player_id
      and ss.completed = true
      and ss.phase = 'done'
      and ss.ended_at is not null
  )
  select max(activity_date) into v_latest from activity_dates;

  if v_latest is not null
     and v_latest >= v_today - 1 then
    with activity_dates as (
      select distinct (ss.ended_at at time zone 'Europe/Madrid')::date activity_date
      from public.study_sessions ss
      where ss.player_id = p_player_id
        and ss.completed = true
        and ss.phase = 'done'
        and ss.ended_at is not null
    ), ordered as (
      select activity_date, row_number() over (order by activity_date desc) position
      from activity_dates
    )
    select count(*)::integer into v_streak
    from ordered
    where activity_date = v_latest - (position::integer - 1);
  end if;

  if v_term > 0 then
    select exists (
      select 1
      from public.boss_attempts ba
      where ba.player_id = p_player_id
        and ba.subject_id = p_subject_id
        and ba.school_year_start = v_school_year_start
        and ba.term = v_term
        and ba.passed = true
    ) into v_passed;

    select max(ba.next_retry_at)
    into v_retry_at
    from public.boss_attempts ba
    where ba.player_id = p_player_id
      and ba.subject_id = p_subject_id
      and ba.school_year_start = v_school_year_start
      and ba.term = v_term
      and ba.completed_at is not null
      and ba.passed = false;
  end if;

  v_available := v_term > 0
    and v_streak >= 12
    and not v_passed
    and (v_retry_at is null or v_retry_at <= now());

  return jsonb_build_object(
    'school_year_start', v_school_year_start,
    'term', v_term,
    'unlock_date', v_unlock_date,
    'streak_days', v_streak,
    'required_streak_days', 12,
    'passed', v_passed,
    'retry_at', v_retry_at,
    'available', v_available
  );
end;
$$;

create or replace function public.start_levelup_boss_attempt(p_player_id uuid, p_subject_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status jsonb;
  v_attempt_id uuid;
begin
  v_status := public.get_levelup_boss_status(p_player_id, p_subject_id);

  if coalesce((v_status->>'available')::boolean, false) is not true then
    raise exception 'Boss is not available';
  end if;

  insert into public.boss_attempts(player_id, subject_id, school_year_start, term)
  values (
    p_player_id,
    p_subject_id,
    (v_status->>'school_year_start')::integer,
    (v_status->>'term')::smallint
  )
  returning id into v_attempt_id;

  return jsonb_build_object('attempt_id', v_attempt_id, 'status', v_status);
end;
$$;

create or replace function public.complete_levelup_boss_attempt(
  p_attempt_id uuid,
  p_correct integer,
  p_total integer,
  p_failed_areas text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.boss_attempts%rowtype;
  v_percent integer;
  v_passed boolean;
  v_retry_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_total <> 15 or p_correct < 0 or p_correct > p_total then
    raise exception 'Invalid boss result';
  end if;

  select ba.*
  into v_attempt
  from public.boss_attempts ba
  join public.players p on p.id = ba.player_id
  join public.parent_profiles pp on pp.family_id = p.family_id
  where ba.id = p_attempt_id
    and pp.id = auth.uid()
    and ba.completed_at is null
  for update of ba;

  if not found then
    raise exception 'Boss attempt not available';
  end if;

  v_percent := round((p_correct::numeric / p_total::numeric) * 100)::integer;
  v_passed := v_percent >= 80;
  v_retry_at := case when v_passed then null else now() + interval '24 hours' end;

  update public.boss_attempts
  set completed_at = now(),
      correct = p_correct,
      total = p_total,
      percent = v_percent,
      passed = v_passed,
      failed_areas = coalesce(p_failed_areas, '{}'),
      next_retry_at = v_retry_at
  where id = p_attempt_id;

  return jsonb_build_object(
    'attempt_id', p_attempt_id,
    'correct', p_correct,
    'total', p_total,
    'percent', v_percent,
    'passed', v_passed,
    'retry_at', v_retry_at
  );
end;
$$;

revoke all on function public.get_levelup_boss_status(uuid, text) from public, anon;
revoke all on function public.start_levelup_boss_attempt(uuid, text) from public, anon;
revoke all on function public.complete_levelup_boss_attempt(uuid, integer, integer, text[]) from public, anon;
grant execute on function public.get_levelup_boss_status(uuid, text) to authenticated;
grant execute on function public.start_levelup_boss_attempt(uuid, text) to authenticated;
grant execute on function public.complete_levelup_boss_attempt(uuid, integer, integer, text[]) to authenticated;
