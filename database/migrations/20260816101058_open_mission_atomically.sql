-- Recovered from the applied Supabase migration history.
-- Version: 20260816101058 · open_mission_atomically

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

  -- Serialize mission opening per player. A second tab waits and receives the
  -- same session instead of racing the partial unique index.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_player_id::text, 0)
  );

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

drop policy if exists "parent can create clean family sessions"
  on public.study_sessions;

