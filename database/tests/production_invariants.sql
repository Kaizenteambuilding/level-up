-- Read-only production health check. It does not create, update or delete data.
-- Any broken persistence invariant raises an exception.
do $health$
begin
  if exists (
    select 1
    from public.study_sessions s
    left join public.attempts a on a.session_id = s.id
    where s.completed = true and s.phase = 'done'
    group by s.id
    having count(a.id) <> 10
  ) then
    raise exception 'A completed mission does not contain exactly ten attempts';
  end if;

  if exists (
    select 1
    from public.study_sessions
    where completed = false and ended_at is null
    group by player_id
    having count(*) > 1
  ) then
    raise exception 'A player has more than one open mission';
  end if;

  if exists (
    select 1
    from public.study_sessions
    where completed = false
      and ended_at is null
      and started_at < now() - interval '24 hours'
  ) then
    raise exception 'An overdue mission is still open';
  end if;

  if exists (
    select 1
    from public.study_sessions
    where completed = true and ended_at is null
  ) then
    raise exception 'A completed mission has no end time';
  end if;

  if exists (
    select 1
    from public.attempts a
    left join public.study_sessions s on s.id = a.session_id
    where a.session_id is not null and s.id is null
  ) then
    raise exception 'An attempt references a missing mission';
  end if;

  if exists (
    select 1
    from public.study_sessions s
    left join public.attempts a on a.session_id = s.id
    where s.completed = true and s.phase = 'done'
    group by s.id, s.xp_earned
    having coalesce(s.xp_earned, 0) <> coalesce(sum(a.xp_awarded), 0)
  ) then
    raise exception 'Mission XP differs from the sum of its attempts';
  end if;
end
$health$;

select jsonb_build_object(
  'status', 'passed',
  'checked_at', now(),
  'writes_performed', false
) as production_invariants;
