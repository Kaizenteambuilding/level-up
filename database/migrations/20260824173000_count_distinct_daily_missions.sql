-- Count one completed mission per Europe/Madrid calendar day in the authoritative game summary.
-- Historical duplicate sessions remain intact for auditability; only progression-facing totals are de-duplicated.

create or replace function public.get_levelup_game_summary(p_player_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_total integer := 0;
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
    count(distinct (ss.ended_at at time zone 'Europe/Madrid')::date)::integer,
    max(ss.ended_at)
  into v_total, v_last_completed
  from public.study_sessions ss
  where ss.player_id = p_player_id
    and ss.completed = true
    and ss.phase = 'done'
    and ss.ended_at is not null;

  with mission_dates as (
    select distinct (ss.ended_at at time zone 'Europe/Madrid')::date as mission_date
    from public.study_sessions ss
    where ss.player_id = p_player_id
      and ss.completed = true
      and ss.phase = 'done'
      and ss.ended_at is not null
  )
  select max(mission_date) into v_latest from mission_dates;

  if v_latest is not null
     and v_latest >= (now() at time zone 'Europe/Madrid')::date - 1
  then
    with mission_dates as (
      select distinct (ss.ended_at at time zone 'Europe/Madrid')::date as mission_date
      from public.study_sessions ss
      where ss.player_id = p_player_id
        and ss.completed = true
        and ss.phase = 'done'
        and ss.ended_at is not null
    ), ordered as (
      select mission_date, row_number() over (order by mission_date desc) as position
      from mission_dates
    )
    select count(*)::integer
      into v_streak
    from ordered
    where mission_date = v_latest - (position::integer - 1);
  end if;

  return jsonb_build_object(
    'total_missions', coalesce(v_total, 0),
    'streak_days', v_streak,
    'last_completed_at', v_last_completed
  );
end;
$function$;

revoke execute on function public.get_levelup_game_summary(uuid)
  from public, anon;
grant execute on function public.get_levelup_game_summary(uuid)
  to authenticated;
