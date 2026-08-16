-- Transactional regression test for the protected Level Up write path.
-- It selects one configured parent, creates temporary data and rolls everything
-- back. Any broken invariant raises an exception and fails the script.
begin;

do $context$
begin
  perform set_config(
    'levelup.audit_parent_id',
    (select pp.id::text from public.parent_profiles pp order by pp.id limit 1),
    true
  );
end
$context$;

set local role authenticated;
do $jwt$
begin
  perform set_config(
    'request.jwt.claim.sub',
    current_setting('levelup.audit_parent_id'),
    true
  );
end
$jwt$;

do $test$
declare
  v_family_id uuid;
  v_player_id uuid;
  v_session_id uuid;
  v_resumed_session_id uuid;
  v_result jsonb;
  v_rejected boolean;
  v_attempt_count integer;
  v_attempt_xp integer;
  v_player_xp integer;
  v_session_xp integer;
  i integer;
begin
  select pp.family_id
    into v_family_id
  from public.parent_profiles pp
  where pp.id = auth.uid();

  if v_family_id is null then
    raise exception 'The audit requires one configured parent';
  end if;

  v_rejected := false;
  begin
    insert into public.players(family_id, alias)
    values (v_family_id, 'Direct insert must fail');
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'Direct player insertion was accepted';
  end if;

  v_rejected := false;
  begin
    insert into public.study_sessions(player_id)
    values (gen_random_uuid());
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'Direct session insertion was accepted';
  end if;

  v_rejected := false;
  begin
    insert into public.attempts(player_id, skill_id, correct)
    values (gen_random_uuid(), 'M01S01', true);
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'Direct attempt insertion was accepted';
  end if;

  v_rejected := false;
  begin
    perform public.create_levelup_player('   ', 35);
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'Blank player alias was accepted';
  end if;

  v_rejected := false;
  begin
    perform public.create_levelup_player('Invalid target', 37);
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'Invalid daily target was accepted';
  end if;

  v_player_id := (
    public.create_levelup_player('Transactional audit player', 35)
    ->> 'player_id'
  )::uuid;

  v_rejected := false;
  begin
    perform public.create_levelup_player('  TRANSACTIONAL AUDIT PLAYER  ', 35);
  exception when unique_violation then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'Normalized duplicate alias was accepted';
  end if;

  v_session_id := (
    public.open_levelup_session(v_player_id) ->> 'session_id'
  )::uuid;
  v_resumed_session_id := (
    public.open_levelup_session(v_player_id) ->> 'session_id'
  )::uuid;

  if v_resumed_session_id <> v_session_id then
    raise exception 'Opening twice did not resume the same mission';
  end if;

  v_rejected := false;
  begin
    perform public.submit_levelup_attempt(
      v_player_id, 'M01S01', true, 1000, 1, 7000001, '',
      v_session_id, '{}'::text[]
    );
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'Blank prompt was accepted';
  end if;

  v_rejected := false;
  begin
    perform public.submit_levelup_attempt(
      v_player_id, 'M01S01', true, 1000, 1, 7000002,
      'Oversized diagnostic metadata', v_session_id,
      array[repeat('x', 6401)]
    );
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'Oversized diagnostic metadata was accepted';
  end if;

  perform public.submit_levelup_attempt(
    v_player_id,
    'M01S01',
    true,
    5001,
    1,
    8000001,
    'Transactional audit question 1',
    v_session_id,
    array['audit:test']
  );

  v_rejected := false;
  begin
    perform public.submit_levelup_attempt(
      v_player_id, 'M01S01', true, 5001, 1, 8000001,
      'Duplicated transactional question', v_session_id, array['audit:test']
    );
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'A duplicated question seed was accepted';
  end if;

  v_rejected := false;
  begin
    perform public.complete_levelup_session(v_session_id);
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'A mission with fewer than ten attempts was completed';
  end if;

  for i in 2..10 loop
    perform public.submit_levelup_attempt(
      v_player_id,
      'M01S01',
      (i % 3 <> 0),
      5000 + i,
      1,
      8000000 + i,
      'Transactional audit question ' || i,
      v_session_id,
      array['audit:test']
    );
  end loop;

  v_rejected := false;
  begin
    perform public.submit_levelup_attempt(
      v_player_id, 'M01S01', true, 1000, 1, 9000001,
      'Eleventh attempt', v_session_id, array['audit:test']
    );
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'An eleventh attempt was accepted';
  end if;

  select count(*)::integer, coalesce(sum(a.xp_awarded), 0)::integer
    into v_attempt_count, v_attempt_xp
  from public.attempts a
  where a.session_id = v_session_id;

  if v_attempt_count <> 10 or v_attempt_xp <= 0 then
    raise exception 'Persisted attempt totals are invalid';
  end if;

  v_result := public.complete_levelup_session(v_session_id);
  if coalesce((v_result ->> 'completed')::boolean, false) is not true
    or (v_result ->> 'attempts')::integer <> 10
    or (v_result ->> 'xp_earned')::integer <> v_attempt_xp
  then
    raise exception 'Mission completion returned invalid totals';
  end if;

  select p.xp into v_player_xp
  from public.players p
  where p.id = v_player_id;

  select s.xp_earned into v_session_xp
  from public.study_sessions s
  where s.id = v_session_id;

  if v_player_xp <> v_attempt_xp or v_session_xp <> v_attempt_xp then
    raise exception 'XP is inconsistent between attempts, player and session';
  end if;

  v_result := public.complete_levelup_session(v_session_id);
  if coalesce((v_result ->> 'completed')::boolean, false) is not true
    or (v_result ->> 'attempts')::integer <> 10
  then
    raise exception 'Mission completion is not idempotent';
  end if;
end
$test$;

select jsonb_build_object(
  'status', 'passed',
  'attempts_verified', 10,
  'transaction_rolled_back', true
) as rpc_integrity_test;

rollback;
