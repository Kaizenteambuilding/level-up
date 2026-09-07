create or replace function public.complete_levelup_boss_attempt(
  p_attempt_id uuid,
  p_answers integer[],
  p_failed_areas text[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.boss_attempts%rowtype;
  v_key integer[];
  v_correct integer := 0;
  v_percent integer;
  v_passed boolean;
  v_retry_at timestamptz;
  v_failed_indexes integer[] := '{}';
  i integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if coalesce(array_length(p_answers, 1), 0) <> 15 then
    raise exception 'Invalid boss answers';
  end if;

  if exists (
    select 1
    from unnest(p_answers) answer
    where answer is null or answer < 0 or answer > 3
  ) then
    raise exception 'Invalid boss answers';
  end if;

  select ba.*
  into v_attempt
  from public.boss_attempts ba
  join public.players p on p.id = ba.player_id
  join public.parent_profiles pp on pp.family_id = p.family_id
  where ba.id = p_attempt_id
    and pp.id = auth.uid()
    and ba.completed_at is null
  for update of ba;

  if not found then
    raise exception 'Boss attempt not available';
  end if;

  v_key := case v_attempt.subject_id
    when 'math' then array[2,1,0,2,1,1,2,2,1,2,2,1,1,1,0]
    when 'spanish' then array[1,2,2,1,1,1,1,2,1,1,1,2,2,1,2]
    when 'english' then array[1,1,1,1,1,1,1,0,1,2,0,0,2,1,1]
    when 'geography_history' then array[1,1,1,1,1,1,1,1,0,0,1,0,1,0,2]
    when 'biology_geology' then array[2,1,2,2,1,0,1,1,1,1,1,0,1,2,1]
    else null
  end;

  if v_key is null then
    raise exception 'Unknown boss subject';
  end if;

  for i in 1..15 loop
    if p_answers[i] = v_key[i] then
      v_correct := v_correct + 1;
    else
      v_failed_indexes := array_append(v_failed_indexes, i - 1);
    end if;
  end loop;

  v_percent := round((v_correct::numeric / 15::numeric) * 100)::integer;
  v_passed := v_percent >= 80;
  v_retry_at := case when v_passed then null else now() + interval '24 hours' end;

  update public.boss_attempts
  set completed_at = now(),
      correct = v_correct,
      total = 15,
      percent = v_percent,
      passed = v_passed,
      failed_areas = coalesce(p_failed_areas, '{}'),
      next_retry_at = v_retry_at
  where id = p_attempt_id;

  return jsonb_build_object(
    'attempt_id', p_attempt_id,
    'correct', v_correct,
    'total', 15,
    'percent', v_percent,
    'passed', v_passed,
    'retry_at', v_retry_at,
    'failed_indexes', v_failed_indexes
  );
end;
$$;

revoke all on function public.complete_levelup_boss_attempt(uuid, integer[], text[]) from public, anon;
grant execute on function public.complete_levelup_boss_attempt(uuid, integer[], text[]) to authenticated;
