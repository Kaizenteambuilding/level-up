begin;

-- Keep exactly one public RPC signature. The previous database had two
-- overloads with the same named parameters in a different order.
drop function if exists public.submit_levelup_attempt(
  uuid, text, boolean, integer, integer, bigint, text, text[], uuid
);
drop function if exists public.submit_levelup_attempt(
  uuid, text, boolean, integer, integer, bigint, text, uuid, text[]
);

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
set search_path = public
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
  v_priority integer := 50;
  v_attempt_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select p.family_id
    into v_family_id
  from public.players p
  join public.parent_profiles pp
    on pp.family_id = p.family_id
  where p.id = p_player_id
    and pp.id = auth.uid();

  if v_family_id is null then
    raise exception 'Player not available for this account';
  end if;

  if p_session_id is null then
    raise exception 'A valid study session is required';
  end if;

  select ss.player_id, ss.completed, ss.ended_at, ss.started_at
    into v_session_player_id, v_session_completed, v_session_ended_at, v_session_started_at
  from public.study_sessions ss
  where ss.id = p_session_id
  for update;

  if not found then
    raise exception 'Study session not found';
  end if;

  if v_session_player_id <> p_player_id then
    raise exception 'Study session does not belong to player';
  end if;

  if coalesce(v_session_completed, false) or v_session_ended_at is not null then
    raise exception 'Study session is already closed';
  end if;

  if v_session_started_at < now() - interval '24 hours' then
    raise exception 'Study session has expired';
  end if;

  select count(*)
    into v_attempt_count
  from public.attempts a
  where a.session_id = p_session_id;

  if v_attempt_count >= 10 then
    raise exception 'Maximum attempts for this session reached';
  end if;

  insert into public.player_skill_state(
    player_id,
    skill_id,
    mastery,
    confidence,
    difficulty,
    priority,
    error_tags,
    updated_at
  )
  values(
    p_player_id,
    p_skill_id,
    50,
    50,
    greatest(1, least(5, coalesce(p_difficulty, 2))),
    50,
    '{}'::jsonb,
    now()
  )
  on conflict(player_id, skill_id) do nothing;

  select mastery, confidence, difficulty
    into v_mastery, v_confidence, v_new_difficulty
  from public.player_skill_state
  where player_id = p_player_id
    and skill_id = p_skill_id
  for update;

  if p_correct then
    v_xp_awarded := 15 + greatest(1, least(5, coalesce(p_difficulty, v_new_difficulty))) * 10;
    v_mastery := least(
      100,
      v_mastery + case when coalesce(p_difficulty, v_new_difficulty) >= 3 then 3 else 2 end
    );
    v_confidence := least(100, v_confidence + 3);

    if v_new_difficulty < 5
      and greatest(1, coalesce(p_response_ms, 1)) <= 20000
      and v_mastery >= (45 + v_new_difficulty * 8)
      and v_confidence >= (48 + v_new_difficulty * 7)
    then
      v_new_difficulty := v_new_difficulty + 1;
    end if;
  else
    v_mastery := greatest(0, v_mastery - 1);
    v_confidence := greatest(0, v_confidence - 2);

    if v_new_difficulty > 1
      and (
        v_mastery < (40 + v_new_difficulty * 7)
        or v_confidence < (42 + v_new_difficulty * 6)
      )
    then
      v_new_difficulty := v_new_difficulty - 1;
    end if;
  end if;

  v_priority := greatest(
    1,
    least(
      100,
      round(
        50
        + (50 - v_mastery) * 0.8
        + (50 - v_confidence) * 0.4
      )::integer
    )
  );

  update public.player_skill_state
  set mastery = v_mastery,
      confidence = v_confidence,
      difficulty = v_new_difficulty,
      priority = v_priority,
      last_practiced_at = now(),
      updated_at = now(),
      error_tags = case
        when p_correct then coalesce(error_tags, '{}'::jsonb)
        else
          coalesce(error_tags, '{}'::jsonb)
          || jsonb_build_object(
            coalesce(p_diagnostic_tags[1], 'generic_error'),
            coalesce(
              (
                error_tags ->> coalesce(p_diagnostic_tags[1], 'generic_error')
              )::integer,
              0
            ) + 1
          )
      end
  where player_id = p_player_id
    and skill_id = p_skill_id;

  update public.players
  set xp = coalesce(xp, 0) + v_xp_awarded,
      level = least(
        50,
        greatest(
          coalesce(level, 1),
          1 + ((coalesce(xp, 0) + v_xp_awarded) / 500)
        )
      )
  where id = p_player_id
  returning xp, level into v_new_xp, v_new_level;

  insert into public.attempts(
    session_id,
    player_id,
    skill_id,
    question_seed,
    difficulty,
    prompt_snapshot,
    correct,
    response_ms,
    xp_awarded,
    diagnostic_tags,
    created_at
  )
  values(
    p_session_id,
    p_player_id,
    p_skill_id,
    p_seed,
    greatest(1, least(5, coalesce(p_difficulty, v_new_difficulty))),
    p_prompt,
    p_correct,
    greatest(1, coalesce(p_response_ms, 1)),
    v_xp_awarded,
    coalesce(p_diagnostic_tags, '{}'::text[]),
    now()
  )
  returning id into v_attempt_id;

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

revoke all on function public.submit_levelup_attempt(
  uuid, text, boolean, integer, integer, bigint, text, uuid, text[]
) from public, anon;
grant execute on function public.submit_levelup_attempt(
  uuid, text, boolean, integer, integer, bigint, text, uuid, text[]
) to authenticated, service_role;

-- Recover a genuinely complete historical mission whose UI close failed.
with recoverable as (
  select
    ss.id,
    max(a.created_at) as finished_at,
    coalesce(sum(a.xp_awarded), 0)::integer as earned_xp,
    least(
      180,
      greatest(1, round(coalesce(sum(a.response_ms), 0) / 60000.0))
    )::integer as active_minutes
  from public.study_sessions ss
  join public.attempts a on a.session_id = ss.id
  where ss.completed = false
    and ss.ended_at is null
    and ss.started_at < now() - interval '24 hours'
  group by ss.id
  having count(a.id) = 10
)
update public.study_sessions ss
set ended_at = recoverable.finished_at,
    completed_at = recoverable.finished_at,
    completed = true,
    xp_earned = recoverable.earned_xp,
    actual_minutes = recoverable.active_minutes,
    phase = 'done'
from recoverable
where ss.id = recoverable.id;

-- Preserve attempts and XP, but close partial or historically corrupted sessions.
update public.study_sessions
set ended_at = now(),
    phase = 'abandoned'
where completed = false
  and ended_at is null
  and started_at < now() - interval '24 hours';

create or replace function public.abandon_expired_levelup_sessions_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  update public.study_sessions
  set ended_at = now(),
      phase = 'abandoned'
  where player_id = new.player_id
    and completed = false
    and ended_at is null
    and started_at < now() - interval '24 hours';

  return new;
end;
$function$;

drop trigger if exists abandon_expired_levelup_sessions_before_insert
  on public.study_sessions;
create trigger abandon_expired_levelup_sessions_before_insert
before insert on public.study_sessions
for each row
execute function public.abandon_expired_levelup_sessions_on_insert();

create unique index if not exists one_open_levelup_session_per_player
  on public.study_sessions(player_id)
  where completed = false and ended_at is null;

commit;
