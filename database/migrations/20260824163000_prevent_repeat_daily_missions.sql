-- Prevent a player from opening or completing a second daily mission on the same Europe/Madrid calendar day.
-- Historical duplicate completions are preserved; this migration only hardens future behavior.

create or replace function public.open_levelup_session(
  p_player_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_session_id uuid;
  v_started_at timestamptz;
  v_resumed boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_player_id is null or not exists (
    select 1
    from public.players p
    join public.parent_profiles pp on pp.family_id = p.family_id
    where p.id = p_player_id
      and pp.id = auth.uid()
  ) then
    raise exception 'Player not available for this account';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_player_id::text, 0)
  );

  if exists (
    select 1
    from public.study_sessions ss
    where ss.player_id = p_player_id
      and ss.mode = 'daily'
      and ss.completed = true
      and ss.phase = 'done'
      and (coalesce(ss.completed_at, ss.ended_at) at time zone 'Europe/Madrid')::date
          = (now() at time zone 'Europe/Madrid')::date
  ) then
    update public.study_sessions
    set ended_at = coalesce(ended_at, now()),
        phase = 'abandoned'
    where player_id = p_player_id
      and mode = 'daily'
      and completed = false
      and ended_at is null;

    raise exception 'Daily mission already completed';
  end if;

  update public.study_sessions
  set ended_at = now(),
      phase = 'abandoned'
  where player_id = p_player_id
    and completed = false
    and ended_at is null
    and started_at < now() - interval '24 hours';

  select ss.id, ss.started_at
    into v_session_id, v_started_at
  from public.study_sessions ss
  where ss.player_id = p_player_id
    and ss.mode = 'daily'
    and ss.completed = false
    and ss.ended_at is null
    and ss.started_at >= now() - interval '24 hours'
  order by ss.started_at desc
  limit 1
  for update;

  if v_session_id is not null then
    v_resumed := true;
  else
    insert into public.study_sessions(player_id, mode, phase)
    values (p_player_id, 'daily', 'warmup')
    returning id, started_at into v_session_id, v_started_at;
  end if;

  return jsonb_build_object(
    'session_id', v_session_id,
    'started_at', v_started_at,
    'resumed', v_resumed
  );
end;
$function$;

revoke execute on function public.open_levelup_session(uuid)
  from public, anon;
grant execute on function public.open_levelup_session(uuid)
  to authenticated;

create or replace function public.prevent_repeat_daily_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.mode = 'daily'
     and new.completed = true
     and new.phase = 'done'
     and (tg_op = 'INSERT' or old.completed is distinct from true or old.phase is distinct from 'done')
     and exists (
       select 1
       from public.study_sessions ss
       where ss.player_id = new.player_id
         and ss.id <> new.id
         and ss.mode = 'daily'
         and ss.completed = true
         and ss.phase = 'done'
         and (coalesce(ss.completed_at, ss.ended_at) at time zone 'Europe/Madrid')::date
             = (coalesce(new.completed_at, new.ended_at, now()) at time zone 'Europe/Madrid')::date
     )
  then
    raise exception 'Daily mission already completed';
  end if;

  return new;
end;
$function$;

revoke execute on function public.prevent_repeat_daily_completion()
  from public, anon, authenticated;

drop trigger if exists prevent_repeat_daily_completion
  on public.study_sessions;

create trigger prevent_repeat_daily_completion
before insert or update of completed, phase, completed_at, ended_at
on public.study_sessions
for each row
execute function public.prevent_repeat_daily_completion();
