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

  if v_today between make_date(v_school_year_start, 12, 5) and make_date(v_school_year_start, 12, 22) then
    v_term := 1;
    v_unlock_date := make_date(v_school_year_start, 12, 5);
  elsif v_today between make_date(v_school_year_start + 1, 3, 20) and make_date(v_school_year_start + 1, 4, 5) then
    v_term := 2;
    v_unlock_date := make_date(v_school_year_start + 1, 3, 20);
  elsif v_today between make_date(v_school_year_start + 1, 6, 5) and make_date(v_school_year_start + 1, 6, 22) then
    v_term := 3;
    v_unlock_date := make_date(v_school_year_start + 1, 6, 5);
  else
    v_term := 0;
    v_unlock_date := case
      when v_today < make_date(v_school_year_start, 12, 5) then make_date(v_school_year_start, 12, 5)
      when v_today < make_date(v_school_year_start + 1, 3, 20) then make_date(v_school_year_start + 1, 3, 20)
      when v_today < make_date(v_school_year_start + 1, 6, 5) then make_date(v_school_year_start + 1, 6, 5)
      else make_date(v_school_year_start + 1, 12, 5)
    end;
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

  if v_latest is not null and v_latest >= v_today - 1 then
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
