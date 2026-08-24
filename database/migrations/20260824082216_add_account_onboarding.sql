-- Recovered from the applied Supabase migration history.
-- Version: 20260824082216 · add_account_onboarding

-- Account-wide onboarding state, updated only through ownership-checked RPCs.
create or replace function public.set_levelup_avatar(p_player_id uuid, p_avatar_id text)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare v_avatar jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_avatar_id not in ('astronaut', 'ninja', 'mage', 'scientist') then
    raise exception 'Avatar not available';
  end if;

  update public.players p
  set avatar = coalesce(p.avatar, '{}'::jsonb) || jsonb_build_object(
    'avatar_id', p_avatar_id,
    'onboarding_started_at', coalesce(p.avatar->>'onboarding_started_at', now()::text)
  )
  where p.id = p_player_id
    and exists (
      select 1 from public.parent_profiles pp
      where pp.family_id = p.family_id and pp.id = auth.uid()
    )
  returning p.avatar into v_avatar;
  if not found then raise exception 'Player not available'; end if;
  return v_avatar;
end;
$function$;

create or replace function public.complete_levelup_onboarding(p_player_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  v_avatar jsonb;
  v_level integer;
  v_coins integer;
  v_started_at timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select coalesce(p.avatar, '{}'::jsonb), coalesce(p.level, 1), coalesce(p.coins, 0)
  into v_avatar, v_level, v_coins
  from public.players p
  join public.parent_profiles pp on pp.family_id = p.family_id
  where p.id = p_player_id and pp.id = auth.uid()
  for update of p;
  if not found then raise exception 'Player not available'; end if;
  if coalesce((v_avatar->>'onboarding_completed')::boolean, false) then
    return jsonb_build_object('completed', true, 'level', v_level, 'coins', v_coins, 'avatar', v_avatar);
  end if;

  begin
    v_started_at := (v_avatar->>'onboarding_started_at')::timestamptz;
  exception when others then
    v_started_at := null;
  end;
  if v_started_at is null or not exists (
    select 1 from public.study_sessions ss
    where ss.player_id = p_player_id and ss.completed = true and ss.phase = 'done'
      and ss.ended_at >= v_started_at
  ) then
    raise exception 'Complete the onboarding mission first';
  end if;

  update public.players p
  set avatar = coalesce(p.avatar, '{}'::jsonb) || jsonb_build_object(
    'onboarding_completed', true,
    'onboarding_completed_at', now()::text
  )
  where p.id = p_player_id
  returning p.avatar into v_avatar;

  return jsonb_build_object('completed', true, 'level', v_level, 'coins', v_coins, 'avatar', v_avatar);
end;
$function$;

revoke execute on function public.set_levelup_avatar(uuid, text) from public, anon;
revoke execute on function public.complete_levelup_onboarding(uuid) from public, anon;
grant execute on function public.set_levelup_avatar(uuid, text) to authenticated;
grant execute on function public.complete_levelup_onboarding(uuid) to authenticated;

