create or replace function public.get_levelup_achievement_summary(p_player_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_boss_wins integer := 0;
  v_subjects integer := 0;
  v_perfect integer := 0;
  v_cleared_terms integer := 0;
begin
  if v_uid is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.players p
    join public.parent_profiles pp on pp.family_id = p.family_id
    where p.id = p_player_id
      and pp.id = v_uid
  ) then
    raise exception 'Player not available';
  end if;

  select count(*)::integer,
         count(distinct subject_id)::integer,
         count(*) filter (where correct = 15 and total = 15)::integer
    into v_boss_wins, v_subjects, v_perfect
  from public.boss_attempts
  where player_id = p_player_id
    and passed = true;

  select count(*)::integer
    into v_cleared_terms
  from (
    select school_year_start, term
    from public.boss_attempts
    where player_id = p_player_id
      and passed = true
    group by school_year_start, term
    having count(distinct subject_id) = 5
  ) completed_terms;

  return jsonb_build_object(
    'boss_wins', coalesce(v_boss_wins, 0),
    'boss_subjects_defeated', coalesce(v_subjects, 0),
    'perfect_boss_wins', coalesce(v_perfect, 0),
    'cleared_boss_terms', coalesce(v_cleared_terms, 0)
  );
end;
$$;

revoke all on function public.get_levelup_achievement_summary(uuid) from public, anon;
grant execute on function public.get_levelup_achievement_summary(uuid) to authenticated;
