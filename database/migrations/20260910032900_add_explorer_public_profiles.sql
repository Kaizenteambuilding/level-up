create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.player_public_profiles (
  player_id uuid primary key references public.players(id) on delete cascade,
  alias text not null,
  avatar_id text not null default 'astronaut' check (avatar_id in ('astronaut','ninja','mage','scientist')),
  level integer not null default 1 check (level between 1 and 50),
  level_progress_percent integer not null default 0 check (level_progress_percent between 0 and 100),
  completed_expeditions integer not null default 0 check (completed_expeditions >= 0),
  updated_at timestamptz not null default now()
);

alter table public.player_public_profiles enable row level security;
revoke all on table public.player_public_profiles from public, anon, authenticated;
grant select on table public.player_public_profiles to authenticated;

create policy "authenticated explorers can view public profiles"
on public.player_public_profiles
for select
to authenticated
using ((select auth.uid()) is not null);

create or replace function private.refresh_player_public_profile(p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_player public.players%rowtype;
  v_level integer;
  v_floor_xp integer;
  v_ceiling_xp integer;
  v_percent integer;
  v_completed integer;
begin
  if p_player_id is null then
    return;
  end if;

  select * into v_player
  from public.players
  where id = p_player_id;

  if not found then
    delete from public.player_public_profiles where player_id = p_player_id;
    return;
  end if;

  v_level := greatest(1, least(50, coalesce(v_player.level, 1)));
  if v_level >= 50 then
    v_percent := 100;
  else
    v_floor_xp := 225 * (v_level - 1) + 75 * (v_level - 1) * (v_level - 1);
    v_ceiling_xp := 225 * v_level + 75 * v_level * v_level;
    v_percent := greatest(0, least(100, round(100.0 * greatest(0, coalesce(v_player.xp, 0) - v_floor_xp) / greatest(1, v_ceiling_xp - v_floor_xp))::integer));
  end if;

  select count(*)::integer into v_completed
  from public.study_sessions
  where player_id = p_player_id
    and completed = true
    and phase = 'done'
    and mode = 'daily';

  insert into public.player_public_profiles (
    player_id, alias, avatar_id, level, level_progress_percent, completed_expeditions, updated_at
  ) values (
    v_player.id,
    v_player.alias,
    case when v_player.avatar->>'avatar_id' in ('astronaut','ninja','mage','scientist') then v_player.avatar->>'avatar_id' else 'astronaut' end,
    v_level,
    v_percent,
    coalesce(v_completed, 0),
    now()
  )
  on conflict (player_id) do update set
    alias = excluded.alias,
    avatar_id = excluded.avatar_id,
    level = excluded.level,
    level_progress_percent = excluded.level_progress_percent,
    completed_expeditions = excluded.completed_expeditions,
    updated_at = excluded.updated_at;
end;
$function$;

revoke all on function private.refresh_player_public_profile(uuid) from public, anon, authenticated;

create or replace function private.sync_player_public_profile_from_player()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  perform private.refresh_player_public_profile(new.id);
  return new;
end;
$function$;
revoke all on function private.sync_player_public_profile_from_player() from public, anon, authenticated;

create or replace function private.sync_player_public_profile_from_session()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'DELETE' then
    perform private.refresh_player_public_profile(old.player_id);
    return old;
  end if;

  perform private.refresh_player_public_profile(new.player_id);
  if tg_op = 'UPDATE' and old.player_id is distinct from new.player_id then
    perform private.refresh_player_public_profile(old.player_id);
  end if;
  return new;
end;
$function$;
revoke all on function private.sync_player_public_profile_from_session() from public, anon, authenticated;

create trigger sync_player_public_profile_after_player
  after insert or update of alias, level, xp, avatar on public.players
  for each row execute function private.sync_player_public_profile_from_player();

create trigger sync_player_public_profile_after_session
  after insert or update or delete on public.study_sessions
  for each row execute function private.sync_player_public_profile_from_session();

select private.refresh_player_public_profile(id) from public.players;
