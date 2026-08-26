-- Restore the intended XP transaction boundary: attempts retain provisional XP,
-- while player XP is committed exactly once when a 10-attempt mission completes.
-- This preserves multi-subject validation and lost-response idempotency.

create or replace function public.submit_levelup_attempt(
  p_player_id uuid,
  p_skill_id text,
  p_correct boolean,
  p_response_ms integer,
  p_difficulty integer,
  p_seed bigint,
  p_prompt text,
  p_session_id uuid,
  p_diagnostic_tags text[] default '{}'::text[]
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_family_id uuid;
  v_session_player_id uuid;
  v_session_completed boolean;
  v_session_ended_at timestamptz;
  v_session_started_at timestamptz;
  v_attempt_count integer;
  v_xp_awarded integer := 0;
  v_current_xp integer;
  v_current_level integer;
  v_mastery numeric := 50;
  v_confidence numeric := 50;
  v_new_difficulty integer;
  v_attempt_difficulty integer;
  v_priority integer := 50;
  v_attempt_id uuid;
  v_existing_player_id uuid;
  v_existing_skill_id text;
  v_existing_correct boolean;
  v_existing_prompt text;
  v_existing_xp integer;
  v_existing_created_at timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_player_id is null or p_session_id is null then raise exception 'A valid player and study session are required'; end if;
  if p_correct is null or p_seed is null then raise exception 'Attempt result and question seed are required'; end if;
  if p_prompt is null or btrim(p_prompt) = '' or char_length(p_prompt) > 2000 then raise exception 'Question prompt is invalid'; end if;
  if p_response_ms is null or p_response_ms < 1 or p_response_ms > 3600000 then raise exception 'Response time is invalid'; end if;
  if coalesce(cardinality(p_diagnostic_tags), 0) > 20 then raise exception 'Too many diagnostic tags'; end if;

  if not exists (
    select 1
    from public.skills s
    join public.curriculum_units cu on cu.id = s.unit_id
    where s.id = p_skill_id
      and s.active = true
      and s.generator_key is not null
      and cu.active = true
  ) then
    raise exception 'Skill is not available in the active curriculum';
  end if;

  select p.family_id, coalesce(p.xp, 0), coalesce(p.level, 1)
    into v_family_id, v_current_xp, v_current_level
  from public.players p
  join public.parent_profiles pp on pp.family_id = p.family_id
  where p.id = p_player_id and pp.id = auth.uid()
  for update of p;
  if v_family_id is null then raise exception 'Player not available for this account'; end if;

  select ss.player_id, ss.completed, ss.ended_at, ss.started_at
    into v_session_player_id, v_session_completed, v_session_ended_at, v_session_started_at
  from public.study_sessions ss where ss.id = p_session_id for update;
  if not found then raise exception 'Study session not found'; end if;
  if v_session_player_id <> p_player_id then raise exception 'Study session does not belong to player'; end if;

  select a.id, a.player_id, a.skill_id, a.correct, a.prompt_snapshot,
         coalesce(a.xp_awarded, 0), a.created_at
    into v_attempt_id, v_existing_player_id, v_existing_skill_id,
         v_existing_correct, v_existing_prompt, v_existing_xp,
         v_existing_created_at
  from public.attempts a
  where a.session_id = p_session_id
    and a.question_seed = p_seed;

  if found then
    if v_existing_player_id is distinct from p_player_id
       or v_existing_skill_id is distinct from p_skill_id
       or v_existing_correct is distinct from p_correct
       or v_existing_prompt is distinct from p_prompt then
      raise exception 'Question seed already used by a different attempt';
    end if;

    select p.xp, p.level into v_current_xp, v_current_level
    from public.players p where p.id = p_player_id;

    select pss.mastery, pss.confidence, pss.difficulty, pss.priority
      into v_mastery, v_confidence, v_new_difficulty, v_priority
    from public.player_skill_state pss
    where pss.player_id = p_player_id and pss.skill_id = p_skill_id;

    select count(*) into v_attempt_count
    from public.attempts a
    where a.session_id = p_session_id
      and (
        a.created_at < v_existing_created_at
        or (a.created_at = v_existing_created_at and a.id <= v_attempt_id)
      );

    return jsonb_build_object(
      'attempt_id', v_attempt_id,
      'attempt_number', v_attempt_count,
      'xp_awarded', v_existing_xp,
      'xp', v_current_xp,
      'level', v_current_level,
      'mastery', coalesce(v_mastery, 50),
      'confidence', coalesce(v_confidence, 50),
      'difficulty', coalesce(v_new_difficulty, 1),
      'priority', coalesce(v_priority, 50),
      'reconciled', true
    );
  end if;

  if coalesce(v_session_completed, false) or v_session_ended_at is not null then raise exception 'Study session is already closed'; end if;
  if v_session_started_at < now() - interval '24 hours' then raise exception 'Study session has expired'; end if;

  select count(*) into v_attempt_count from public.attempts a where a.session_id = p_session_id;
  if v_attempt_count >= 10 then raise exception 'Maximum attempts for this session reached'; end if;

  insert into public.player_skill_state(player_id, skill_id, mastery, confidence, difficulty, priority, error_tags, updated_at)
  values(p_player_id, p_skill_id, 50, 50, 1, 50, '{}'::jsonb, now())
  on conflict(player_id, skill_id) do nothing;

  select mastery, confidence, difficulty into v_mastery, v_confidence, v_new_difficulty
  from public.player_skill_state
  where player_id = p_player_id and skill_id = p_skill_id
  for update;

  v_attempt_difficulty := greatest(1, least(5, coalesce(v_new_difficulty, 1)));
  if p_correct then
    v_xp_awarded := 15 + v_attempt_difficulty * 10;
    v_mastery := least(100, v_mastery + case when v_attempt_difficulty >= 3 then 3 else 2 end);
    v_confidence := least(100, v_confidence + 3);
    if v_new_difficulty < 5 and p_response_ms <= 20000
      and v_mastery >= (45 + v_new_difficulty * 8)
      and v_confidence >= (48 + v_new_difficulty * 7)
    then v_new_difficulty := v_new_difficulty + 1; end if;
  else
    v_mastery := greatest(0, v_mastery - 1);
    v_confidence := greatest(0, v_confidence - 2);
    if v_new_difficulty > 1 and (v_mastery < (40 + v_new_difficulty * 7) or v_confidence < (42 + v_new_difficulty * 6))
    then v_new_difficulty := v_new_difficulty - 1; end if;
  end if;

  v_priority := greatest(1, least(100, round(50 + (50 - v_mastery) * 0.8 + (50 - v_confidence) * 0.4)::integer));

  update public.player_skill_state
  set mastery = v_mastery, confidence = v_confidence, difficulty = v_new_difficulty,
      priority = v_priority, last_practiced_at = now(), updated_at = now(),
      error_tags = case when p_correct then coalesce(error_tags, '{}'::jsonb)
        else coalesce(error_tags, '{}'::jsonb) || jsonb_build_object(
          left(coalesce(p_diagnostic_tags[1], 'generic_error'), 120),
          coalesce((error_tags ->> left(coalesce(p_diagnostic_tags[1], 'generic_error'), 120))::integer, 0) + 1
        ) end
  where player_id = p_player_id and skill_id = p_skill_id;

  insert into public.attempts(
    session_id, player_id, skill_id, question_seed, difficulty,
    prompt_snapshot, correct, response_ms, xp_awarded, diagnostic_tags, created_at
  ) values(
    p_session_id, p_player_id, p_skill_id, p_seed, v_attempt_difficulty,
    p_prompt, p_correct, p_response_ms, v_xp_awarded,
    coalesce(p_diagnostic_tags, '{}'::text[]), now()
  ) returning id into v_attempt_id;

  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'attempt_number', v_attempt_count + 1,
    'xp_awarded', v_xp_awarded,
    'xp', v_current_xp,
    'level', v_current_level,
    'mastery', v_mastery,
    'confidence', v_confidence,
    'difficulty', v_new_difficulty,
    'priority', v_priority,
    'reconciled', false
  );
end;
$function$;

create or replace function public.complete_levelup_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_player_id uuid;
  v_completed boolean;
  v_ended_at timestamptz;
  v_attempt_count integer;
  v_correct integer;
  v_session_xp integer;
  v_actual_minutes integer;
  v_finished_at timestamptz;
  v_coins_earned integer;
  v_level_before integer;
  v_level_after integer;
  v_total_xp integer;
  v_total_coins integer;
  v_next_threshold integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_session_id is null then raise exception 'A valid study session is required'; end if;

  select ss.player_id, ss.completed, ss.ended_at
    into v_player_id, v_completed, v_ended_at
  from public.study_sessions ss
  join public.players p on p.id = ss.player_id
  join public.parent_profiles pp on pp.family_id = p.family_id
  where ss.id = p_session_id and pp.id = auth.uid()
  for update of ss;
  if not found then raise exception 'Study session not available for this account'; end if;

  if coalesce(v_completed, false) then
    select count(a.id)::integer, count(*) filter (where a.correct = true)::integer,
      coalesce(sum(a.xp_awarded), 0)::integer, ss.actual_minutes, ss.ended_at,
      ss.coins_earned, ss.level_before, ss.level_after, p.coins
    into v_attempt_count, v_correct, v_session_xp, v_actual_minutes, v_finished_at,
      v_coins_earned, v_level_before, v_level_after, v_total_coins
    from public.study_sessions ss join public.players p on p.id = ss.player_id
    left join public.attempts a on a.session_id = ss.id
    where ss.id = p_session_id
    group by ss.actual_minutes, ss.ended_at, ss.coins_earned, ss.level_before, ss.level_after, p.coins;
    return jsonb_build_object(
      'completed', true, 'attempts', v_attempt_count, 'correct', v_correct,
      'xp_earned', v_session_xp, 'coins_earned', v_coins_earned, 'coins', v_total_coins,
      'level_before', v_level_before, 'level_after', v_level_after,
      'actual_minutes', v_actual_minutes, 'ended_at', v_finished_at
    );
  end if;
  if v_ended_at is not null then raise exception 'Study session is already closed'; end if;

  select count(*)::integer, count(*) filter (where a.correct = true)::integer,
    coalesce(sum(a.xp_awarded), 0)::integer,
    least(180, greatest(1, round(coalesce(sum(a.response_ms), 0) / 60000.0)))::integer,
    max(a.created_at)
  into v_attempt_count, v_correct, v_session_xp, v_actual_minutes, v_finished_at
  from public.attempts a where a.session_id = p_session_id;
  if v_attempt_count <> 10 then raise exception 'A completed mission requires exactly 10 attempts'; end if;

  select coalesce(p.xp, 0), coalesce(p.level, 1)
    into v_total_xp, v_level_before
  from public.players p where p.id = v_player_id for update;

  v_total_xp := v_total_xp + v_session_xp;
  v_level_after := 1;
  while v_level_after < 50 loop
    v_next_threshold := 225 * v_level_after + 75 * v_level_after * v_level_after;
    exit when v_total_xp < v_next_threshold;
    v_level_after := v_level_after + 1;
  end loop;
  v_coins_earned := 40 + v_correct * 5;

  update public.players
  set xp = v_total_xp,
      coins = coalesce(coins, 0) + v_coins_earned,
      level = v_level_after
  where id = v_player_id
  returning coins into v_total_coins;

  update public.study_sessions
  set ended_at = v_finished_at,
      completed_at = v_finished_at,
      completed = true,
      xp_earned = v_session_xp,
      coins_earned = v_coins_earned,
      level_before = v_level_before,
      level_after = v_level_after,
      actual_minutes = v_actual_minutes,
      phase = 'done'
  where id = p_session_id;

  return jsonb_build_object(
    'completed', true, 'attempts', v_attempt_count, 'correct', v_correct,
    'xp_earned', v_session_xp, 'coins_earned', v_coins_earned, 'coins', v_total_coins,
    'level_before', v_level_before, 'level_after', v_level_after,
    'actual_minutes', v_actual_minutes, 'ended_at', v_finished_at
  );
end;
$function$;

revoke execute on function public.submit_levelup_attempt(uuid,text,boolean,integer,integer,bigint,text,uuid,text[])
  from public, anon;
grant execute on function public.submit_levelup_attempt(uuid,text,boolean,integer,integer,bigint,text,uuid,text[])
  to authenticated;

revoke execute on function public.complete_levelup_session(uuid)
  from public, anon;
grant execute on function public.complete_levelup_session(uuid)
  to authenticated;
