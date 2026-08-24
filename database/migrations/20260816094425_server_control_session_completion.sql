-- Recovered from the applied Supabase migration history.
-- Version: 20260816094425 · server_control_session_completion

create or replace function public.complete_levelup_session(
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
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
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_session_id is null then
    raise exception 'A valid study session is required';
  end if;

  select ss.player_id, ss.completed, ss.ended_at
    into v_player_id, v_completed, v_ended_at
  from public.study_sessions ss
  join public.players p on p.id = ss.player_id
  join public.parent_profiles pp on pp.family_id = p.family_id
  where ss.id = p_session_id
    and pp.id = auth.uid()
  for update of ss;

  if not found then
    raise exception 'Study session not available for this account';
  end if;

  if coalesce(v_completed, false) then
    select
      count(*)::integer,
      count(*) filter (where a.correct = true)::integer,
      coalesce(sum(a.xp_awarded), 0)::integer,
      coalesce(ss.actual_minutes, 0),
      ss.ended_at
      into v_attempt_count, v_correct, v_session_xp, v_actual_minutes, v_finished_at
    from public.study_sessions ss
    left join public.attempts a on a.session_id = ss.id
    where ss.id = p_session_id
    group by ss.actual_minutes, ss.ended_at;

    return jsonb_build_object(
      'completed', true,
      'attempts', v_attempt_count,
      'correct', v_correct,
      'xp_earned', v_session_xp,
      'actual_minutes', v_actual_minutes,
      'ended_at', v_finished_at
    );
  end if;

  if v_ended_at is not null then
    raise exception 'Study session is already closed';
  end if;

  select
    count(*)::integer,
    count(*) filter (where a.correct = true)::integer,
    coalesce(sum(a.xp_awarded), 0)::integer,
    least(180, greatest(1, round(coalesce(sum(a.response_ms), 0) / 60000.0)))::integer,
    max(a.created_at)
    into v_attempt_count, v_correct, v_session_xp, v_actual_minutes, v_finished_at
  from public.attempts a
  where a.session_id = p_session_id;

  if v_attempt_count <> 10 then
    raise exception 'A completed mission requires exactly 10 attempts';
  end if;

  update public.study_sessions
  set ended_at = v_finished_at,
      completed_at = v_finished_at,
      completed = true,
      xp_earned = v_session_xp,
      actual_minutes = v_actual_minutes,
      phase = 'done'
  where id = p_session_id;

  return jsonb_build_object(
    'completed', true,
    'attempts', v_attempt_count,
    'correct', v_correct,
    'xp_earned', v_session_xp,
    'actual_minutes', v_actual_minutes,
    'ended_at', v_finished_at
  );
end;
$function$;

revoke execute on function public.complete_levelup_session(uuid)
  from public, anon;
grant execute on function public.complete_levelup_session(uuid)
  to authenticated;

drop policy if exists "parent can update family sessions"
  on public.study_sessions;

drop policy if exists "parent can create family sessions"
  on public.study_sessions;
create policy "parent can create clean family sessions"
on public.study_sessions
for insert
to authenticated
with check (
  player_id in (
    select p.id
    from public.players p
    join public.parent_profiles pp on pp.family_id = p.family_id
    where pp.id = (select auth.uid())
  )
  and coalesce(completed, false) = false
  and ended_at is null
  and completed_at is null
  and coalesce(xp_earned, 0) = 0
  and actual_minutes is null
  and mode = 'daily'
  and phase = 'warmup'
);

drop policy if exists "parent can update family players"
  on public.players;

drop policy if exists "parent can create family players"
  on public.players;
create policy "parent can create clean family players"
on public.players
for insert
to authenticated
with check (
  family_id in (
    select pp.family_id
    from public.parent_profiles pp
    where pp.id = (select auth.uid())
  )
  and coalesce(level, 1) = 1
  and coalesce(xp, 0) = 0
  and coalesce(coins, 0) = 0
  and coalesce(streak_days, 0) = 0
  and daily_target_minutes between 20 and 50
  and char_length(btrim(alias)) between 1 and 40
);

