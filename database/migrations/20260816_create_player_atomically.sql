create or replace function public.create_levelup_player(
  p_alias text,
  p_daily_target_minutes integer default 35
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_family_id uuid;
  v_player_id uuid;
  v_alias text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  v_alias := btrim(coalesce(p_alias, ''));
  if char_length(v_alias) < 1 or char_length(v_alias) > 40 then
    raise exception 'Player alias must contain between 1 and 40 characters';
  end if;

  if p_daily_target_minutes is null
    or p_daily_target_minutes < 20
    or p_daily_target_minutes > 50
    or p_daily_target_minutes % 5 <> 0
  then
    raise exception 'Daily target must be between 20 and 50 minutes in steps of 5';
  end if;

  select pp.family_id
    into v_family_id
  from public.parent_profiles pp
  where pp.id = auth.uid();

  if v_family_id is null then
    raise exception 'Family setup is required before creating a player';
  end if;

  insert into public.players(
    family_id,
    alias,
    daily_target_minutes,
    level,
    xp,
    coins,
    streak_days,
    avatar
  )
  values(
    v_family_id,
    v_alias,
    p_daily_target_minutes,
    1,
    0,
    0,
    0,
    '{}'::jsonb
  )
  returning id into v_player_id;

  return jsonb_build_object(
    'player_id', v_player_id,
    'alias', v_alias,
    'daily_target_minutes', p_daily_target_minutes
  );
end;
$function$;

revoke execute on function public.create_levelup_player(text, integer)
  from public, anon;
grant execute on function public.create_levelup_player(text, integer)
  to authenticated;

drop policy if exists "parent can create clean family players"
  on public.players;
revoke insert on table public.players from anon, authenticated;
