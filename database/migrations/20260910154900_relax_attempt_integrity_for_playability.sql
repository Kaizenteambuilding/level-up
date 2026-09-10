create or replace function public.submit_levelup_attempt(
  p_player_id uuid,
  p_skill_id text,
  p_correct boolean,
  p_response_ms integer,
  p_difficulty integer,
  p_seed bigint,
  p_prompt text,
  p_session_id uuid,
  p_diagnostic_tags text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if exists (
    select 1
    from public.attempts a
    where a.session_id = p_session_id
      and a.question_seed = p_seed
  ) then
    return public._submit_levelup_attempt_core(
      p_player_id, p_skill_id, p_correct, p_response_ms, p_difficulty,
      p_seed, p_prompt, p_session_id, p_diagnostic_tags
    );
  end if;

  if p_seed is null or p_seed < 0 or p_seed > 4294967295 then
    raise exception 'Question seed is invalid';
  end if;

  if p_response_ms is null or p_response_ms < 1 or p_response_ms > 3600000 then
    raise exception 'Response time is invalid';
  end if;

  if p_difficulty is null or p_difficulty < 1 or p_difficulty > 5 then
    raise exception 'Question difficulty is invalid';
  end if;

  if not exists (
    select 1
    from public.study_sessions ss
    join public.players p on p.id = ss.player_id
    join public.parent_profiles pp on pp.family_id = p.family_id
    where ss.id = p_session_id
      and ss.player_id = p_player_id
      and pp.id = auth.uid()
  ) then
    raise exception 'Study session not available for this account';
  end if;

  if exists (
    select 1
    from public.attempts a
    where a.skill_id = p_skill_id
      and a.question_seed = p_seed
      and a.prompt_snapshot is distinct from p_prompt
  ) then
    raise exception 'Question payload does not match its seed';
  end if;

  return public._submit_levelup_attempt_core(
    p_player_id, p_skill_id, p_correct, p_response_ms, p_difficulty,
    p_seed, p_prompt, p_session_id, p_diagnostic_tags
  );
end;
$function$;

revoke all on function public.submit_levelup_attempt(uuid, text, boolean, integer, integer, bigint, text, uuid, text[])
  from public, anon;
grant execute on function public.submit_levelup_attempt(uuid, text, boolean, integer, integer, bigint, text, uuid, text[])
  to authenticated;

comment on function public.submit_levelup_attempt(uuid, text, boolean, integer, integer, bigint, text, uuid, text[])
is 'Playability-first integrity gate for Level Up attempts. Keeps authentication, ownership, input bounds, idempotency and seed/prompt consistency while avoiding heuristic anti-cheat checks that can block legitimate play.';
