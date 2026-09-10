alter function public.submit_levelup_attempt(uuid, text, boolean, integer, integer, bigint, text, uuid, text[])
  rename to _submit_levelup_attempt_core;

revoke all on function public._submit_levelup_attempt_core(uuid, text, boolean, integer, integer, bigint, text, uuid, text[])
  from public, anon, authenticated;

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
declare
  v_expected_difficulty integer := 1;
  v_session_started_at timestamptz;
  v_last_attempt_at timestamptz;
  v_anchor timestamptz;
  v_elapsed_ms bigint;
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

  if p_response_ms is null or p_response_ms < 250 or p_response_ms > 3600000 then
    raise exception 'Response time is invalid';
  end if;

  select greatest(1, least(5, coalesce(pss.difficulty, 1)))
  into v_expected_difficulty
  from public.player_skill_state pss
  where pss.player_id = p_player_id
    and pss.skill_id = p_skill_id;

  v_expected_difficulty := coalesce(v_expected_difficulty, 1);
  if p_difficulty is distinct from v_expected_difficulty then
    raise exception 'Question difficulty does not match server state';
  end if;

  select ss.started_at,
         (select max(a.created_at) from public.attempts a where a.session_id = ss.id)
  into v_session_started_at, v_last_attempt_at
  from public.study_sessions ss
  join public.players p on p.id = ss.player_id
  join public.parent_profiles pp on pp.family_id = p.family_id
  where ss.id = p_session_id
    and ss.player_id = p_player_id
    and pp.id = auth.uid();

  if not found then
    raise exception 'Study session not available for this account';
  end if;

  v_anchor := coalesce(v_last_attempt_at, v_session_started_at);
  v_elapsed_ms := floor(extract(epoch from (now() - v_anchor)) * 1000)::bigint;

  if v_elapsed_ms < 500 then
    raise exception 'Answer submitted too quickly';
  end if;

  if p_response_ms > v_elapsed_ms + 15000 then
    raise exception 'Response time does not match session timing';
  end if;

  if exists (
    select 1
    from (
      select a.prompt_snapshot
      from public.attempts a
      where a.player_id = p_player_id
      order by a.created_at desc
      limit 120
    ) recent
    where recent.prompt_snapshot = p_prompt
  ) then
    raise exception 'Question was recently used';
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
is 'Integrity gate for Level Up attempts. Validates server difficulty, timing, prompt reuse and deterministic seed consistency before delegating to the restricted core writer.';
