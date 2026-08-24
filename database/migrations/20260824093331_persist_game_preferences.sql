-- Recovered from the applied Supabase migration history.
-- Version: 20260824093331 · persist_game_preferences

create or replace function public.set_levelup_game_preferences(p_player_id uuid, p_base_theme text default null, p_sound_enabled boolean default null)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare v_preferences jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_base_theme is null and p_sound_enabled is null then raise exception 'A preference is required'; end if;
  if p_base_theme is not null and p_base_theme not in ('space', 'forest', 'arcade') then raise exception 'Base theme not available'; end if;
  select coalesce(p.avatar, '{}'::jsonb) into v_preferences from public.players p join public.parent_profiles pp on pp.family_id = p.family_id where p.id = p_player_id and pp.id = auth.uid() for update of p;
  if not found then raise exception 'Player not available'; end if;
  if p_base_theme is not null then v_preferences := jsonb_set(v_preferences, '{base_theme}', to_jsonb(p_base_theme), true); end if;
  if p_sound_enabled is not null then v_preferences := jsonb_set(v_preferences, '{sound_enabled}', to_jsonb(p_sound_enabled), true); end if;
  update public.players set avatar = v_preferences where id = p_player_id;
  return v_preferences;
end;
$function$;
revoke execute on function public.set_levelup_game_preferences(uuid, text, boolean) from public, anon;
grant execute on function public.set_levelup_game_preferences(uuid, text, boolean) to authenticated;

