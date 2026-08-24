-- Server-authoritative game progression. Academic mastery remains independent.
alter table public.study_sessions
  add column if not exists coins_earned integer not null default 0
    check (coins_earned between 0 and 100),
  add column if not exists level_before integer
    check (level_before between 1 and 50),
  add column if not exists level_after integer
    check (level_after between 1 and 50);

update public.players p
set level = (
  select max(candidate)::integer as level
  from generate_series(1, 50) candidate
  where coalesce(p.xp, 0) >= 225 * (candidate - 1) + 75 * (candidate - 1) * (candidate - 1)
);

create table if not exists public.game_items (
  id text primary key,
  name text not null,
  slot text not null check (slot in ('head', 'companion', 'trail')),
  price integer not null check (price between 1 and 10000),
  minimum_level integer not null default 1 check (minimum_level between 1 and 50),
  active boolean not null default true
);

insert into public.game_items(id, name, slot, price, minimum_level, active)
values
  ('headphones', 'Auriculares neón', 'head', 90, 2, true),
  ('wizard-hat', 'Sombrero de sabio', 'head', 120, 3, true),
  ('robot', 'Compañero robot', 'companion', 160, 4, true),
  ('fox', 'Zorro explorador', 'companion', 140, 3, true),
  ('sparkles', 'Estela estelar', 'trail', 75, 2, true),
  ('fire', 'Estela de energía', 'trail', 110, 4, true)
on conflict (id) do update
set name = excluded.name,
    slot = excluded.slot,
    price = excluded.price,
    minimum_level = excluded.minimum_level,
    active = excluded.active;

create table if not exists public.player_inventory (
  player_id uuid not null references public.players(id) on delete cascade,
  item_id text not null references public.game_items(id),
  slot text not null check (slot in ('head', 'companion', 'trail')),
  equipped boolean not null default false,
  acquired_at timestamptz not null default now(),
  primary key (player_id, item_id)
);

create unique index if not exists player_inventory_one_equipped_per_slot_idx
  on public.player_inventory(player_id, slot) where equipped = true;

alter table public.game_items enable row level security;
alter table public.player_inventory enable row level security;

create policy "authenticated can read active game items"
on public.game_items for select to authenticated
using (active = true);

create policy "parent can read family inventory"
on public.player_inventory for select to authenticated
using (
  player_id in (
    select p.id from public.players p
    join public.parent_profiles pp on pp.family_id = p.family_id
    where pp.id = (select auth.uid())
  )
);

grant select on table public.game_items, public.player_inventory to authenticated;
revoke all privileges on table public.game_items, public.player_inventory from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.game_items, public.player_inventory from authenticated;

create or replace function public.purchase_levelup_item(p_player_id uuid, p_item_id text)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  v_item public.game_items%rowtype;
  v_coins integer;
  v_level integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select gi.* into v_item from public.game_items gi
  where gi.id = p_item_id and gi.active = true;
  if not found then raise exception 'Item not available'; end if;

  select p.coins, p.level into v_coins, v_level
  from public.players p
  join public.parent_profiles pp on pp.family_id = p.family_id
  where p.id = p_player_id and pp.id = auth.uid()
  for update of p;
  if not found then raise exception 'Player not available'; end if;
  if coalesce(v_level, 1) < v_item.minimum_level then raise exception 'Item level is still locked'; end if;
  if exists (select 1 from public.player_inventory where player_id = p_player_id and item_id = p_item_id) then
    raise exception 'Item already owned';
  end if;
  if coalesce(v_coins, 0) < v_item.price then raise exception 'Not enough coins'; end if;

  update public.players set coins = coalesce(coins, 0) - v_item.price where id = p_player_id
  returning coins into v_coins;
  update public.player_inventory set equipped = false
    where player_id = p_player_id and slot = v_item.slot and equipped = true;
  insert into public.player_inventory(player_id, item_id, slot, equipped)
    values (p_player_id, v_item.id, v_item.slot, true);

  return jsonb_build_object('item_id', v_item.id, 'slot', v_item.slot, 'coins', v_coins, 'equipped', true);
end;
$function$;

create or replace function public.equip_levelup_item(p_player_id uuid, p_item_id text)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare v_slot text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.players p
    join public.parent_profiles pp on pp.family_id = p.family_id
    where p.id = p_player_id and pp.id = auth.uid()
  ) then raise exception 'Player not available'; end if;

  select pi.slot into v_slot from public.player_inventory pi
  where pi.player_id = p_player_id and pi.item_id = p_item_id;
  if not found then raise exception 'Item not owned'; end if;

  update public.player_inventory set equipped = false
    where player_id = p_player_id and slot = v_slot and equipped = true;
  update public.player_inventory set equipped = true
    where player_id = p_player_id and item_id = p_item_id;
  return jsonb_build_object('item_id', p_item_id, 'slot', v_slot, 'equipped', true);
end;
$function$;

revoke execute on function public.purchase_levelup_item(uuid, text) from public, anon;
revoke execute on function public.equip_levelup_item(uuid, text) from public, anon;
grant execute on function public.purchase_levelup_item(uuid, text) to authenticated;
grant execute on function public.equip_levelup_item(uuid, text) to authenticated;

create or replace function public.complete_levelup_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  v_player_id uuid; v_completed boolean; v_ended_at timestamptz;
  v_attempt_count integer; v_correct integer; v_session_xp integer;
  v_actual_minutes integer; v_finished_at timestamptz;
  v_coins_earned integer; v_level_before integer; v_level_after integer;
  v_total_xp integer; v_total_coins integer; v_next_threshold integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_session_id is null then raise exception 'A valid study session is required'; end if;

  select ss.player_id, ss.completed, ss.ended_at
    into v_player_id, v_completed, v_ended_at
  from public.study_sessions ss
  join public.players p on p.id = ss.player_id
  join public.parent_profiles pp on pp.family_id = p.family_id
  where ss.id = p_session_id and pp.id = auth.uid()
  for update of ss;
  if not found then raise exception 'Study session not available for this account'; end if;

  if coalesce(v_completed, false) then
    select count(a.id)::integer, count(*) filter (where a.correct = true)::integer,
      coalesce(sum(a.xp_awarded), 0)::integer, ss.actual_minutes, ss.ended_at,
      ss.coins_earned, ss.level_before, ss.level_after, p.coins
    into v_attempt_count, v_correct, v_session_xp, v_actual_minutes, v_finished_at,
      v_coins_earned, v_level_before, v_level_after, v_total_coins
    from public.study_sessions ss join public.players p on p.id = ss.player_id
    left join public.attempts a on a.session_id = ss.id
    where ss.id = p_session_id
    group by ss.actual_minutes, ss.ended_at, ss.coins_earned, ss.level_before, ss.level_after, p.coins;
    return jsonb_build_object('completed', true, 'attempts', v_attempt_count, 'correct', v_correct,
      'xp_earned', v_session_xp, 'coins_earned', v_coins_earned, 'coins', v_total_coins,
      'level_before', v_level_before, 'level_after', v_level_after,
      'actual_minutes', v_actual_minutes, 'ended_at', v_finished_at);
  end if;
  if v_ended_at is not null then raise exception 'Study session is already closed'; end if;

  select count(*)::integer, count(*) filter (where a.correct = true)::integer,
    coalesce(sum(a.xp_awarded), 0)::integer,
    least(180, greatest(1, round(coalesce(sum(a.response_ms), 0) / 60000.0)))::integer,
    max(a.created_at)
  into v_attempt_count, v_correct, v_session_xp, v_actual_minutes, v_finished_at
  from public.attempts a where a.session_id = p_session_id;
  if v_attempt_count <> 10 then raise exception 'A completed mission requires exactly 10 attempts'; end if;

  select coalesce(p.xp, 0), coalesce(p.level, 1) into v_total_xp, v_level_before
  from public.players p where p.id = v_player_id for update;
  v_level_after := 1;
  while v_level_after < 50 loop
    v_next_threshold := 225 * v_level_after + 75 * v_level_after * v_level_after;
    exit when v_total_xp < v_next_threshold;
    v_level_after := v_level_after + 1;
  end loop;
  v_coins_earned := 40 + v_correct * 5;

  update public.players
  set coins = coalesce(coins, 0) + v_coins_earned, level = v_level_after
  where id = v_player_id returning coins into v_total_coins;
  update public.study_sessions
  set ended_at = v_finished_at, completed_at = v_finished_at, completed = true,
      xp_earned = v_session_xp, coins_earned = v_coins_earned,
      level_before = v_level_before, level_after = v_level_after,
      actual_minutes = v_actual_minutes, phase = 'done'
  where id = p_session_id;

  return jsonb_build_object('completed', true, 'attempts', v_attempt_count, 'correct', v_correct,
    'xp_earned', v_session_xp, 'coins_earned', v_coins_earned, 'coins', v_total_coins,
    'level_before', v_level_before, 'level_after', v_level_after,
    'actual_minutes', v_actual_minutes, 'ended_at', v_finished_at);
end;
$function$;

revoke execute on function public.complete_levelup_session(uuid) from public, anon;
grant execute on function public.complete_levelup_session(uuid) to authenticated;
