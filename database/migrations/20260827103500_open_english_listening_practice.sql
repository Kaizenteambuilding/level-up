-- Version: 20260827103500
create or replace function public.open_levelup_practice_session(p_player_id uuid, p_mode text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_session_id uuid;
  v_started_at timestamptz;
  v_resumed boolean := false;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_mode not in ('english_terminal', 'english_conversation', 'english_listening') then raise exception 'Practice mode is not available'; end if;
  if p_player_id is null or not exists (
    select 1 from public.players p join public.parent_profiles pp on pp.family_id = p.family_id
    where p.id = p_player_id and pp.id = auth.uid()
  ) then raise exception 'Player not available for this account'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_player_id::text || ':' || p_mode, 0));
  if exists (
    select 1 from public.study_sessions ss
    where ss.player_id = p_player_id and ss.mode = p_mode and ss.completed = true and ss.phase = 'done'
      and (coalesce(ss.completed_at, ss.ended_at) at time zone 'Europe/Madrid')::date = (now() at time zone 'Europe/Madrid')::date
  ) then raise exception 'Practice already completed today'; end if;
  update public.study_sessions set ended_at = now(), phase = 'abandoned'
  where player_id = p_player_id and mode = p_mode and completed = false and ended_at is null and started_at < now() - interval '24 hours';
  select ss.id, ss.started_at into v_session_id, v_started_at
  from public.study_sessions ss
  where ss.player_id = p_player_id and ss.mode = p_mode and ss.completed = false and ss.ended_at is null and ss.started_at >= now() - interval '24 hours'
  order by ss.started_at desc limit 1 for update;
  if v_session_id is not null then v_resumed := true;
  else
    insert into public.study_sessions(player_id, mode, phase) values (p_player_id, p_mode, 'practice')
    returning id, started_at into v_session_id, v_started_at;
  end if;
  return jsonb_build_object('session_id', v_session_id, 'started_at', v_started_at, 'mode', p_mode, 'resumed', v_resumed);
end;
$function$;
revoke execute on function public.open_levelup_practice_session(uuid,text) from public, anon;
grant execute on function public.open_levelup_practice_session(uuid,text) to authenticated;
comment on function public.open_levelup_practice_session(uuid,text) is 'Opens or resumes bounded authenticated English district practice. Supports Terminal de palabras, Plaza de conversación and Muelle de escucha, each limited to one completion per Madrid calendar day.';
