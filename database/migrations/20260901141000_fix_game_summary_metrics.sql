create or replace function public.get_levelup_game_summary(p_player_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_total_activities integer := 0;
  v_total_daily_expeditions integer := 0;
  v_active_days integer := 0;
  v_streak integer := 0;
  v_latest date;
  v_last_completed timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
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

  select
    count(*)::integer,
    count(*) filter (where ss.mode = 'daily')::integer,
    count(distinct (ss.ended_at at time zone 'Europe/Madrid')::date)::integer,
    max(ss.ended_at)
  into v_total_activities, v_total_daily_expeditions, v_active_days, v_last_completed
  from public.study_sessions ss
  where ss.player_id = p_player_id
    and ss.completed = true
    and ss.phase = 'done'
    and ss.ended_at is not null;

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
     and v_latest >= (now() at time zone 'Europe/Madrid')::date - 1 then
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

  return jsonb_build_object(
    'total_missions', coalesce(v_total_activities, 0),
    'total_activities', coalesce(v_total_activities, 0),
    'total_daily_expeditions', coalesce(v_total_daily_expeditions, 0),
    'active_days', coalesce(v_active_days, 0),
    'streak_days', v_streak,
    'last_completed_at', v_last_completed
  );
end;
$$;