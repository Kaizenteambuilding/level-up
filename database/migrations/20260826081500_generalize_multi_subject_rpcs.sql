-- Prepare RPCs for multi-subject play without activating unfinished content.
-- New subjects remain unavailable until their curriculum units and skills are active.

create or replace function public.set_player_curriculum_plan(
  p_player_id uuid,
  p_subject_id text,
  p_academic_year_start integer,
  p_pacing_mode text,
  p_current_term integer,
  p_focus_unit_ids text[] default '{}'::text[]
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_focus_unit_ids text[];
  v_subject_exists boolean;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.players p
    join public.parent_profiles pp on pp.family_id = p.family_id
    where p.id = p_player_id and pp.id = auth.uid()
  ) then
    raise exception 'Player not available';
  end if;

  select exists (
    select 1 from public.curriculum_units cu where cu.subject_id = p_subject_id
  ) into v_subject_exists;
  if not v_subject_exists then
    raise exception 'Unsupported subject';
  end if;

  if p_academic_year_start < 2020 or p_academic_year_start > 2100 then
    raise exception 'Invalid academic year';
  end if;
  if p_pacing_mode not in ('automatic', 'manual') then
    raise exception 'Invalid pacing mode';
  end if;
  if p_current_term < 1 or p_current_term > 3 then
    raise exception 'Invalid term';
  end if;

  select coalesce(array_agg(distinct requested.unit_id order by requested.unit_id), '{}')
    into v_focus_unit_ids
  from unnest(coalesce(p_focus_unit_ids, '{}')) requested(unit_id)
  join public.curriculum_units cu on cu.id = requested.unit_id
  where cu.subject_id = p_subject_id
    and cu.active = true;

  if p_pacing_mode = 'manual' and cardinality(v_focus_unit_ids) = 0 then
    raise exception 'Manual pacing requires at least one active unit';
  end if;

  insert into public.player_curriculum_plans(
    player_id, subject_id, academic_year_start, pacing_mode,
    current_term, focus_unit_ids, updated_at
  ) values (
    p_player_id, p_subject_id, p_academic_year_start, p_pacing_mode,
    p_current_term, v_focus_unit_ids, now()
  )
  on conflict (player_id, subject_id) do update
  set academic_year_start = excluded.academic_year_start,
      pacing_mode = excluded.pacing_mode,
      current_term = excluded.current_term,
      focus_unit_ids = excluded.focus_unit_ids,
      updated_at = excluded.updated_at;

  return jsonb_build_object(
    'player_id', p_player_id,
    'subject_id', p_subject_id,
    'academic_year_start', p_academic_year_start,
    'pacing_mode', p_pacing_mode,
    'current_term', p_current_term,
    'focus_unit_ids', v_focus_unit_ids
  );
end;
$function$;

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
  v_new_xp integer;
  v_new_level integer;
  v_mastery numeric := 50;
  v_confidence numeric := 50;
  v_new_difficulty integer;
  v_attempt_difficulty integer;
  v_priority integer := 50;
  v_attempt_id uuid;
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

  select p.family_id into v_family_id
  from public.players p
  join public.parent_profiles pp on pp.family_id = p.family_id
  where p.id = p_player_id and pp.id = auth.uid();
  if v_family_id is null then raise exception 'Player not available for this account'; end if;

  select ss.player_id, ss.completed, ss.ended_at, ss.started_at
    into v_session_player_id, v_session_completed, v_session_ended_at, v_session_started_at
  from public.study_sessions ss where ss.id = p_session_id for update;
  if not found then raise exception 'Study session not found'; end if;
  if v_session_player_id <> p_player_id then raise exception 'Study session does not belong to player'; end if;
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

  update public.players
  set xp = coalesce(xp, 0) + v_xp_awarded, level = coalesce(level, 1)
  where id = p_player_id returning xp, level into v_new_xp, v_new_level;

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
    'xp', v_new_xp,
    'level', v_new_level,
    'mastery', v_mastery,
    'confidence', v_confidence,
    'difficulty', v_new_difficulty,
    'priority', v_priority
  );
end;
$function$;
