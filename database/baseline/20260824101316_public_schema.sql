-- LEVEL UP reproducible public-schema baseline
-- Snapshot cutoff: 20260824101316 (add_privacy_safe_product_events)
-- Contains schema and non-personal catalogue data only. Never run on an existing project.

begin;

set local search_path = public, extensions, pg_catalog;
set local check_function_bodies = off;

do $baseline_guard$
begin
  if to_regclass('public.players') is not null then
    raise exception 'LEVEL UP baseline requires an empty public application schema';
  end if;
end
$baseline_guard$;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- Application tables

create table public.attempts (
  id uuid default gen_random_uuid() not null,
  session_id uuid,
  player_id uuid,
  skill_id text,
  question_seed bigint,
  difficulty integer,
  prompt_snapshot text,
  correct boolean,
  response_ms integer,
  xp_awarded integer default 0,
  diagnostic_tags text[] default '{}'::text[],
  created_at timestamp with time zone default now()
);

create table public.curriculum_units (
  id text not null,
  subject_id text not null,
  name text not null,
  sort_order integer default 0 not null,
  active boolean default true not null
);

create table public.exams (
  id uuid default gen_random_uuid() not null,
  player_id uuid,
  subject_id text,
  exam_date date,
  title text,
  topic_ids text[] default '{}'::text[],
  created_at timestamp with time zone default now()
);

create table public.families (
  id uuid default gen_random_uuid() not null,
  name text not null,
  created_at timestamp with time zone default now()
);

create table public.game_items (
  id text not null,
  name text not null,
  slot text not null,
  price integer not null,
  minimum_level integer default 1 not null,
  active boolean default true not null
);

create table public.parent_profiles (
  id uuid not null,
  family_id uuid,
  display_name text,
  created_at timestamp with time zone default now() not null
);

create table public.player_curriculum_plans (
  player_id uuid not null,
  subject_id text not null,
  academic_year_start smallint not null,
  pacing_mode text default 'automatic'::text not null,
  current_term smallint default 1 not null,
  focus_unit_ids text[] default '{}'::text[] not null,
  updated_at timestamp with time zone default now() not null
);

create table public.player_inventory (
  player_id uuid not null,
  item_id text not null,
  slot text not null,
  equipped boolean default false not null,
  acquired_at timestamp with time zone default now() not null
);

create table public.player_skill_state (
  player_id uuid not null,
  skill_id text not null,
  mastery numeric default 50,
  confidence numeric default 50,
  difficulty integer default 2,
  priority numeric default 50,
  error_tags jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default now(),
  last_practiced_at timestamp with time zone
);

create table public.players (
  id uuid default gen_random_uuid() not null,
  family_id uuid,
  alias text not null,
  level integer default 1,
  xp integer default 0,
  coins integer default 0,
  streak_days integer default 0,
  daily_target_minutes integer default 35,
  avatar jsonb default '{}'::jsonb
);

create table public.product_events (
  id bigint generated always as identity not null,
  parent_id uuid not null,
  player_id uuid not null,
  event_name text not null,
  route text not null,
  created_at timestamp with time zone default now() not null
);

create table public.skills (
  id text not null,
  name text not null,
  subject_id text not null,
  unit_id text,
  goal text,
  prerequisites text[] default '{}'::text[] not null,
  common_errors text[] default '{}'::text[] not null,
  generator_key text,
  sort_order integer default 0 not null,
  critical boolean default false not null,
  active boolean default true not null
);

create table public.study_sessions (
  id uuid default gen_random_uuid() not null,
  player_id uuid,
  started_at timestamp with time zone default now(),
  ended_at timestamp with time zone,
  mode text default 'daily'::text,
  completed boolean default false,
  generated_plan jsonb default '{}'::jsonb,
  planned_minutes integer default 35,
  actual_minutes integer,
  xp_earned integer default 0,
  phase text default 'warmup'::text,
  completed_at timestamp with time zone,
  coins_earned integer default 0 not null,
  level_before integer,
  level_after integer
);

-- Constraints

alter table only public.attempts add constraint attempts_pkey PRIMARY KEY (id);
alter table only public.curriculum_units add constraint curriculum_units_pkey PRIMARY KEY (id);
alter table only public.exams add constraint exams_pkey PRIMARY KEY (id);
alter table only public.families add constraint families_pkey PRIMARY KEY (id);
alter table only public.game_items add constraint game_items_pkey PRIMARY KEY (id);
alter table only public.parent_profiles add constraint parent_profiles_pkey PRIMARY KEY (id);
alter table only public.player_curriculum_plans add constraint player_curriculum_plans_pkey PRIMARY KEY (player_id, subject_id);
alter table only public.player_inventory add constraint player_inventory_pkey PRIMARY KEY (player_id, item_id);
alter table only public.player_skill_state add constraint player_skill_state_pkey PRIMARY KEY (player_id, skill_id);
alter table only public.players add constraint players_pkey PRIMARY KEY (id);
alter table only public.product_events add constraint product_events_pkey PRIMARY KEY (id);
alter table only public.skills add constraint skills_pkey PRIMARY KEY (id);
alter table only public.study_sessions add constraint study_sessions_pkey PRIMARY KEY (id);
alter table only public.attempts add constraint attempts_bounded_diagnostic_tags CHECK (COALESCE(cardinality(diagnostic_tags), 0) <= 20 AND octet_length(array_to_string(COALESCE(diagnostic_tags, '{}'::text[]), ''::text)) <= 6400);
alter table only public.attempts add constraint attempts_new_rows_require_session CHECK (session_id IS NOT NULL) NOT VALID;
alter table only public.attempts add constraint attempts_required_result CHECK (player_id IS NOT NULL AND skill_id IS NOT NULL AND question_seed IS NOT NULL AND correct IS NOT NULL AND prompt_snapshot IS NOT NULL AND btrim(prompt_snapshot) <> ''::text AND char_length(prompt_snapshot) <= 2000 AND COALESCE(xp_awarded, 0) >= 0) NOT VALID;
alter table only public.attempts add constraint attempts_safe_question_seed CHECK (question_seed >= 0 AND question_seed <= '9007199254740991'::bigint);
alter table only public.attempts add constraint attempts_valid_difficulty CHECK (difficulty >= 1 AND difficulty <= 5) NOT VALID;
alter table only public.attempts add constraint attempts_valid_response_time CHECK (response_ms >= 1 AND response_ms <= 3600000) NOT VALID;
alter table only public.game_items add constraint game_items_minimum_level_check CHECK (minimum_level >= 1 AND minimum_level <= 50);
alter table only public.game_items add constraint game_items_price_check CHECK (price >= 1 AND price <= 10000);
alter table only public.game_items add constraint game_items_slot_check CHECK (slot = ANY (ARRAY['head'::text, 'companion'::text, 'trail'::text]));
alter table only public.player_curriculum_plans add constraint player_curriculum_plans_academic_year_start_check CHECK (academic_year_start >= 2020 AND academic_year_start <= 2100);
alter table only public.player_curriculum_plans add constraint player_curriculum_plans_current_term_check CHECK (current_term >= 1 AND current_term <= 3);
alter table only public.player_curriculum_plans add constraint player_curriculum_plans_pacing_mode_check CHECK (pacing_mode = ANY (ARRAY['automatic'::text, 'manual'::text]));
alter table only public.player_inventory add constraint player_inventory_slot_check CHECK (slot = ANY (ARRAY['head'::text, 'companion'::text, 'trail'::text]));
alter table only public.product_events add constraint product_events_event_name_check CHECK (event_name = ANY (ARRAY['onboarding_opened'::text, 'onboarding_avatar_saved'::text, 'onboarding_mission_opened'::text, 'onboarding_completed'::text, 'world_opened'::text, 'mission_started'::text, 'mission_completed'::text, 'client_error'::text]));
alter table only public.product_events add constraint product_events_route_check CHECK (route ~ '^/[a-z0-9/?=&_-]{0,120}$'::text);
alter table only public.study_sessions add constraint study_sessions_coins_earned_check CHECK (coins_earned >= 0 AND coins_earned <= 100);
alter table only public.study_sessions add constraint study_sessions_level_after_check CHECK (level_after >= 1 AND level_after <= 50);
alter table only public.study_sessions add constraint study_sessions_level_before_check CHECK (level_before >= 1 AND level_before <= 50);
alter table only public.attempts add constraint attempts_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);
alter table only public.attempts add constraint attempts_session_id_fkey FOREIGN KEY (session_id) REFERENCES study_sessions(id);
alter table only public.attempts add constraint attempts_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES skills(id);
alter table only public.exams add constraint exams_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);
alter table only public.parent_profiles add constraint parent_profiles_family_id_fkey FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;
alter table only public.parent_profiles add constraint parent_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table only public.player_curriculum_plans add constraint player_curriculum_plans_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;
alter table only public.player_inventory add constraint player_inventory_item_id_fkey FOREIGN KEY (item_id) REFERENCES game_items(id);
alter table only public.player_inventory add constraint player_inventory_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;
alter table only public.player_skill_state add constraint player_skill_state_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);
alter table only public.player_skill_state add constraint player_skill_state_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES skills(id);
alter table only public.players add constraint players_family_id_fkey FOREIGN KEY (family_id) REFERENCES families(id);
alter table only public.product_events add constraint product_events_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table only public.product_events add constraint product_events_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE;
alter table only public.study_sessions add constraint study_sessions_player_id_fkey FOREIGN KEY (player_id) REFERENCES players(id);

-- Non-constraint indexes

CREATE INDEX attempts_player_id_idx ON public.attempts USING btree (player_id);
CREATE INDEX attempts_session_id_idx ON public.attempts USING btree (session_id);
CREATE UNIQUE INDEX attempts_session_question_seed_unique ON public.attempts USING btree (session_id, question_seed) WHERE (session_id IS NOT NULL);
CREATE INDEX attempts_skill_id_idx ON public.attempts USING btree (skill_id);
CREATE INDEX exams_player_id_idx ON public.exams USING btree (player_id);
CREATE INDEX parent_profiles_family_id_idx ON public.parent_profiles USING btree (family_id);
CREATE INDEX player_inventory_item_id_idx ON public.player_inventory USING btree (item_id);
CREATE UNIQUE INDEX player_inventory_one_equipped_per_slot_idx ON public.player_inventory USING btree (player_id, slot) WHERE (equipped = true);
CREATE INDEX player_skill_state_skill_id_idx ON public.player_skill_state USING btree (skill_id);
CREATE UNIQUE INDEX players_family_alias_unique_idx ON public.players USING btree (family_id, lower(btrim(alias))) WHERE (family_id IS NOT NULL);
CREATE INDEX players_family_id_idx ON public.players USING btree (family_id);
CREATE INDEX product_events_parent_created_idx ON public.product_events USING btree (parent_id, created_at DESC);
CREATE INDEX product_events_player_created_idx ON public.product_events USING btree (player_id, created_at DESC);
CREATE UNIQUE INDEX one_open_levelup_session_per_player ON public.study_sessions USING btree (player_id) WHERE ((completed = false) AND (ended_at IS NULL));

-- Functions and RPC

CREATE OR REPLACE FUNCTION public.abandon_expired_levelup_sessions_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.study_sessions
  set ended_at = now(),
      phase = 'abandoned'
  where player_id = new.player_id
    and completed = false
    and ended_at is null
    and started_at < now() - interval '24 hours';

  return new;
end;
$function$

CREATE OR REPLACE FUNCTION public.complete_levelup_onboarding(p_player_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$

CREATE OR REPLACE FUNCTION public.complete_levelup_session(p_session_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$

CREATE OR REPLACE FUNCTION public.create_levelup_player(p_alias text, p_daily_target_minutes integer DEFAULT 35)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
    family_id, alias, daily_target_minutes, level, xp, coins, streak_days, avatar
  )
  values(
    v_family_id, v_alias, p_daily_target_minutes, 1, 0, 0, 0, '{}'::jsonb
  )
  returning id into v_player_id;

  return jsonb_build_object(
    'player_id', v_player_id,
    'alias', v_alias,
    'daily_target_minutes', p_daily_target_minutes
  );
end;
$function$

CREATE OR REPLACE FUNCTION public.equip_levelup_item(p_player_id uuid, p_item_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$

CREATE OR REPLACE FUNCTION public.get_levelup_game_summary(p_player_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_total integer; v_streak integer := 0; v_latest date; v_last_completed timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.players p join public.parent_profiles pp on pp.family_id = p.family_id where p.id = p_player_id and pp.id = auth.uid()) then raise exception 'Player not available'; end if;
  select count(*)::integer, max(ss.ended_at) into v_total, v_last_completed from public.study_sessions ss where ss.player_id = p_player_id and ss.completed = true and ss.phase = 'done';
  with mission_dates as (select distinct (ss.ended_at at time zone 'Europe/Madrid')::date as mission_date from public.study_sessions ss where ss.player_id = p_player_id and ss.completed = true and ss.phase = 'done' and ss.ended_at is not null)
  select max(mission_date) into v_latest from mission_dates;
  if v_latest is not null and v_latest >= (now() at time zone 'Europe/Madrid')::date - 1 then
    with mission_dates as (select distinct (ss.ended_at at time zone 'Europe/Madrid')::date as mission_date from public.study_sessions ss where ss.player_id = p_player_id and ss.completed = true and ss.phase = 'done' and ss.ended_at is not null), ordered as (select mission_date, row_number() over (order by mission_date desc) as position from mission_dates)
    select count(*)::integer into v_streak from ordered where mission_date = v_latest - (position::integer - 1);
  end if;
  return jsonb_build_object('total_missions', coalesce(v_total, 0), 'streak_days', v_streak, 'last_completed_at', v_last_completed);
end;
$function$

CREATE OR REPLACE FUNCTION public.open_levelup_session(p_player_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_session_id uuid;
  v_started_at timestamptz;
  v_resumed boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_player_id is null or not exists (
    select 1
    from public.players p
    join public.parent_profiles pp on pp.family_id = p.family_id
    where p.id = p_player_id
      and pp.id = auth.uid()
  ) then
    raise exception 'Player not available for this account';
  end if;

  -- Serialize mission opening per player. A second tab waits and receives the
  -- same session instead of racing the partial unique index.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_player_id::text, 0)
  );

  update public.study_sessions
  set ended_at = now(),
      phase = 'abandoned'
  where player_id = p_player_id
    and completed = false
    and ended_at is null
    and started_at < now() - interval '24 hours';

  select ss.id, ss.started_at
    into v_session_id, v_started_at
  from public.study_sessions ss
  where ss.player_id = p_player_id
    and ss.mode = 'daily'
    and ss.completed = false
    and ss.ended_at is null
    and ss.started_at >= now() - interval '24 hours'
  order by ss.started_at desc
  limit 1
  for update;

  if v_session_id is not null then
    v_resumed := true;
  else
    insert into public.study_sessions(player_id, mode, phase)
    values (p_player_id, 'daily', 'warmup')
    returning id, started_at into v_session_id, v_started_at;
  end if;

  return jsonb_build_object(
    'session_id', v_session_id,
    'started_at', v_started_at,
    'resumed', v_resumed
  );
end;
$function$

CREATE OR REPLACE FUNCTION public.purchase_levelup_item(p_player_id uuid, p_item_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$

CREATE OR REPLACE FUNCTION public.recalculate_skill_priority()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.priority := greatest(
    1,
    least(
      100,
      round(
        50
        + (50 - new.mastery) * 0.8
        + (50 - new.confidence) * 0.4
      )
    )
  );

  return new;
end;
$function$

CREATE OR REPLACE FUNCTION public.report_levelup_product_event(p_player_id uuid, p_event_name text, p_route text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_event_name not in ('onboarding_opened','onboarding_avatar_saved','onboarding_mission_opened','onboarding_completed','world_opened','mission_started','mission_completed','client_error') then raise exception 'Event not available'; end if;
  if p_route is null or p_route !~ '^/[a-z0-9/?=&_-]{0,120}$' then raise exception 'Route not available'; end if;
  if not exists (select 1 from public.players p join public.parent_profiles pp on pp.family_id = p.family_id where p.id = p_player_id and pp.id = auth.uid()) then raise exception 'Player not available'; end if;
  delete from public.product_events where parent_id = auth.uid() and created_at < now() - interval '180 days';
  insert into public.product_events(parent_id, player_id, event_name, route) values (auth.uid(), p_player_id, p_event_name, p_route);
end;
$function$

CREATE OR REPLACE FUNCTION public.set_levelup_avatar(p_player_id uuid, p_avatar_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$

CREATE OR REPLACE FUNCTION public.set_levelup_game_preferences(p_player_id uuid, p_base_theme text DEFAULT NULL::text, p_sound_enabled boolean DEFAULT NULL::boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$

CREATE OR REPLACE FUNCTION public.set_player_curriculum_plan(p_player_id uuid, p_subject_id text, p_academic_year_start integer, p_pacing_mode text, p_current_term integer, p_focus_unit_ids text[] DEFAULT '{}'::text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_focus_unit_ids text[];
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.players p
    join public.parent_profiles pp on pp.family_id = p.family_id
    where p.id = p_player_id and pp.id = auth.uid()
  ) then
    raise exception 'Player not available';
  end if;

  if p_subject_id <> 'math' then
    raise exception 'Unsupported subject';
  end if;
  if p_academic_year_start < 2020 or p_academic_year_start > 2100 then
    raise exception 'Invalid academic year';
  end if;
  if p_pacing_mode not in ('automatic', 'manual') then
    raise exception 'Invalid pacing mode';
  end if;
  if p_current_term < 1 or p_current_term > 3 then
    raise exception 'Invalid term';
  end if;

  select coalesce(array_agg(distinct requested.unit_id order by requested.unit_id), '{}')
    into v_focus_unit_ids
  from unnest(coalesce(p_focus_unit_ids, '{}')) requested(unit_id)
  join public.curriculum_units cu on cu.id = requested.unit_id
  where cu.subject_id = p_subject_id
    and cu.active = true
    and cu.sort_order > (p_current_term - 1) * 5
    and cu.sort_order <= p_current_term * 5;

  if p_pacing_mode = 'manual' and cardinality(v_focus_unit_ids) = 0 then
    raise exception 'Manual pacing requires at least one current unit';
  end if;

  insert into public.player_curriculum_plans(
    player_id, subject_id, academic_year_start, pacing_mode,
    current_term, focus_unit_ids, updated_at
  ) values (
    p_player_id, p_subject_id, p_academic_year_start, p_pacing_mode,
    p_current_term, v_focus_unit_ids, now()
  )
  on conflict (player_id, subject_id) do update
  set academic_year_start = excluded.academic_year_start,
      pacing_mode = excluded.pacing_mode,
      current_term = excluded.current_term,
      focus_unit_ids = excluded.focus_unit_ids,
      updated_at = excluded.updated_at;

  return jsonb_build_object(
    'player_id', p_player_id,
    'subject_id', p_subject_id,
    'academic_year_start', p_academic_year_start,
    'pacing_mode', p_pacing_mode,
    'current_term', p_current_term,
    'focus_unit_ids', v_focus_unit_ids
  );
end;
$function$

CREATE OR REPLACE FUNCTION public.setup_parent_family(family_name text, parent_name text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  new_family_id uuid;
  clean_family_name text := btrim(family_name);
  clean_parent_name text := btrim(parent_name);
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  if clean_family_name is null
    or char_length(clean_family_name) = 0
    or char_length(clean_family_name) > 80
  then
    raise exception 'Family name must contain between 1 and 80 characters';
  end if;

  if clean_parent_name is null
    or char_length(clean_parent_name) = 0
    or char_length(clean_parent_name) > 80
  then
    raise exception 'Parent name must contain between 1 and 80 characters';
  end if;

  select pp.family_id
    into new_family_id
  from public.parent_profiles pp
  where pp.id = (select auth.uid());

  if new_family_id is not null then
    return new_family_id;
  end if;

  insert into public.families(name)
  values (clean_family_name)
  returning id into new_family_id;

  insert into public.parent_profiles(id, family_id, display_name)
  values ((select auth.uid()), new_family_id, clean_parent_name)
  on conflict (id) do update
    set family_id = excluded.family_id,
        display_name = excluded.display_name;

  return new_family_id;
end;
$function$

CREATE OR REPLACE FUNCTION public.submit_levelup_attempt(p_player_id uuid, p_skill_id text, p_correct boolean, p_response_ms integer, p_difficulty integer, p_seed bigint, p_prompt text, p_session_id uuid, p_diagnostic_tags text[] DEFAULT '{}'::text[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_family_id uuid;
  v_session_player_id uuid;
  v_session_completed boolean;
  v_session_ended_at timestamptz;
  v_session_started_at timestamptz;
  v_attempt_count integer;
  v_xp_awarded integer := 0;
  v_new_xp integer;
  v_new_level integer;
  v_mastery numeric := 50;
  v_confidence numeric := 50;
  v_new_difficulty integer;
  v_attempt_difficulty integer;
  v_priority integer := 50;
  v_attempt_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_player_id is null or p_session_id is null then
    raise exception 'A valid player and study session are required';
  end if;

  if p_correct is null or p_seed is null then
    raise exception 'Attempt result and question seed are required';
  end if;

  if p_prompt is null or btrim(p_prompt) = '' or char_length(p_prompt) > 2000 then
    raise exception 'Question prompt is invalid';
  end if;

  if p_response_ms is null or p_response_ms < 1 or p_response_ms > 3600000 then
    raise exception 'Response time is invalid';
  end if;

  if coalesce(cardinality(p_diagnostic_tags), 0) > 20 then
    raise exception 'Too many diagnostic tags';
  end if;

  if not exists (
    select 1
    from public.skills s
    where s.id = p_skill_id
      and s.active = true
      and s.generator_key is not null
      and s.unit_id = any (array[
        'M01','M02','M03','M04','M05','M06','M07','M08',
        'M09','M10','M11','M12','M13','M14','M15'
      ]::text[])
  ) then
    raise exception 'Skill is not available in the active curriculum';
  end if;

  select p.family_id
    into v_family_id
  from public.players p
  join public.parent_profiles pp
    on pp.family_id = p.family_id
  where p.id = p_player_id
    and pp.id = auth.uid();

  if v_family_id is null then
    raise exception 'Player not available for this account';
  end if;

  select ss.player_id, ss.completed, ss.ended_at, ss.started_at
    into v_session_player_id, v_session_completed, v_session_ended_at, v_session_started_at
  from public.study_sessions ss
  where ss.id = p_session_id
  for update;

  if not found then
    raise exception 'Study session not found';
  end if;

  if v_session_player_id <> p_player_id then
    raise exception 'Study session does not belong to player';
  end if;

  if coalesce(v_session_completed, false) or v_session_ended_at is not null then
    raise exception 'Study session is already closed';
  end if;

  if v_session_started_at < now() - interval '24 hours' then
    raise exception 'Study session has expired';
  end if;

  select count(*)
    into v_attempt_count
  from public.attempts a
  where a.session_id = p_session_id;

  if v_attempt_count >= 10 then
    raise exception 'Maximum attempts for this session reached';
  end if;

  insert into public.player_skill_state(
    player_id, skill_id, mastery, confidence, difficulty,
    priority, error_tags, updated_at
  )
  values(
    p_player_id, p_skill_id, 50, 50, 1,
    50, '{}'::jsonb, now()
  )
  on conflict(player_id, skill_id) do nothing;

  select mastery, confidence, difficulty
    into v_mastery, v_confidence, v_new_difficulty
  from public.player_skill_state
  where player_id = p_player_id
    and skill_id = p_skill_id
  for update;

  v_attempt_difficulty := greatest(1, least(5, coalesce(v_new_difficulty, 1)));

  if p_correct then
    v_xp_awarded := 15 + v_attempt_difficulty * 10;
    v_mastery := least(
      100,
      v_mastery + case when v_attempt_difficulty >= 3 then 3 else 2 end
    );
    v_confidence := least(100, v_confidence + 3);

    if v_new_difficulty < 5
      and p_response_ms <= 20000
      and v_mastery >= (45 + v_new_difficulty * 8)
      and v_confidence >= (48 + v_new_difficulty * 7)
    then
      v_new_difficulty := v_new_difficulty + 1;
    end if;
  else
    v_mastery := greatest(0, v_mastery - 1);
    v_confidence := greatest(0, v_confidence - 2);

    if v_new_difficulty > 1
      and (
        v_mastery < (40 + v_new_difficulty * 7)
        or v_confidence < (42 + v_new_difficulty * 6)
      )
    then
      v_new_difficulty := v_new_difficulty - 1;
    end if;
  end if;

  v_priority := greatest(
    1,
    least(
      100,
      round(50 + (50 - v_mastery) * 0.8 + (50 - v_confidence) * 0.4)::integer
    )
  );

  update public.player_skill_state
  set mastery = v_mastery,
      confidence = v_confidence,
      difficulty = v_new_difficulty,
      priority = v_priority,
      last_practiced_at = now(),
      updated_at = now(),
      error_tags = case
        when p_correct then coalesce(error_tags, '{}'::jsonb)
        else
          coalesce(error_tags, '{}'::jsonb)
          || jsonb_build_object(
            left(coalesce(p_diagnostic_tags[1], 'generic_error'), 120),
            coalesce(
              (error_tags ->> left(coalesce(p_diagnostic_tags[1], 'generic_error'), 120))::integer,
              0
            ) + 1
          )
      end
  where player_id = p_player_id
    and skill_id = p_skill_id;

  update public.players
  set xp = coalesce(xp, 0) + v_xp_awarded,
      level = coalesce(level, 1)
  where id = p_player_id
  returning xp, level into v_new_xp, v_new_level;

  insert into public.attempts(
    session_id, player_id, skill_id, question_seed, difficulty,
    prompt_snapshot, correct, response_ms, xp_awarded,
    diagnostic_tags, created_at
  )
  values(
    p_session_id, p_player_id, p_skill_id, p_seed, v_attempt_difficulty,
    p_prompt, p_correct, p_response_ms, v_xp_awarded,
    coalesce(p_diagnostic_tags, '{}'::text[]), now()
  )
  returning id into v_attempt_id;

  return jsonb_build_object(
    'attempt_id', v_attempt_id,
    'attempt_number', v_attempt_count + 1,
    'xp_awarded', v_xp_awarded,
    'xp', v_new_xp,
    'level', v_new_level,
    'mastery', v_mastery,
    'confidence', v_confidence,
    'difficulty', v_new_difficulty,
    'priority', v_priority
  );
end;
$function$

-- Triggers

CREATE TRIGGER trg_recalculate_skill_priority BEFORE INSERT OR UPDATE OF mastery, confidence ON player_skill_state FOR EACH ROW EXECUTE FUNCTION recalculate_skill_priority();
CREATE TRIGGER abandon_expired_levelup_sessions_before_insert BEFORE INSERT ON study_sessions FOR EACH ROW EXECUTE FUNCTION abandon_expired_levelup_sessions_on_insert();

-- Row-level security

alter table public.attempts enable row level security;
alter table public.curriculum_units enable row level security;
alter table public.exams enable row level security;
alter table public.families enable row level security;
alter table public.game_items enable row level security;
alter table public.parent_profiles enable row level security;
alter table public.player_curriculum_plans enable row level security;
alter table public.player_inventory enable row level security;
alter table public.player_skill_state enable row level security;
alter table public.players enable row level security;
alter table public.product_events enable row level security;
alter table public.skills enable row level security;
alter table public.study_sessions enable row level security;

create policy "parent can read family attempts" on public.attempts as permissive for select to authenticated using ((player_id IN ( SELECT p.id
   FROM (players p
     JOIN parent_profiles pp ON ((pp.family_id = p.family_id)))
  WHERE (pp.id = ( SELECT auth.uid() AS uid)))));
create policy "authenticated can read curriculum units" on public.curriculum_units as permissive for select to authenticated using (true);
create policy "exams are intentionally unavailable" on public.exams as permissive for all to anon, authenticated using (false) with check (false);
create policy "parent can read own family" on public.families as permissive for select to authenticated using ((id IN ( SELECT pp.family_id
   FROM parent_profiles pp
  WHERE (pp.id = ( SELECT auth.uid() AS uid)))));
create policy "authenticated can read active game items" on public.game_items as permissive for select to authenticated using ((active = true));
create policy "parent can read own profile" on public.parent_profiles as permissive for select to authenticated using ((id = ( SELECT auth.uid() AS uid)));
create policy "parent can read family curriculum plans" on public.player_curriculum_plans as permissive for select to authenticated using ((player_id IN ( SELECT p.id
   FROM (players p
     JOIN parent_profiles pp ON ((pp.family_id = p.family_id)))
  WHERE (pp.id = ( SELECT auth.uid() AS uid)))));
create policy "parent can read family inventory" on public.player_inventory as permissive for select to authenticated using ((player_id IN ( SELECT p.id
   FROM (players p
     JOIN parent_profiles pp ON ((pp.family_id = p.family_id)))
  WHERE (pp.id = ( SELECT auth.uid() AS uid)))));
create policy "parent can read family skill state" on public.player_skill_state as permissive for select to authenticated using ((player_id IN ( SELECT p.id
   FROM (players p
     JOIN parent_profiles pp ON ((pp.family_id = p.family_id)))
  WHERE (pp.id = ( SELECT auth.uid() AS uid)))));
create policy "parent can read family players" on public.players as permissive for select to authenticated using ((family_id IN ( SELECT pp.family_id
   FROM parent_profiles pp
  WHERE (pp.id = ( SELECT auth.uid() AS uid)))));
create policy "parents can read own product events" on public.product_events as permissive for select to authenticated using ((parent_id = ( SELECT auth.uid() AS uid)));
create policy "authenticated can read skills" on public.skills as permissive for select to authenticated using (true);
create policy "parent can read family sessions" on public.study_sessions as permissive for select to authenticated using ((player_id IN ( SELECT p.id
   FROM (players p
     JOIN parent_profiles pp ON ((pp.family_id = p.family_id)))
  WHERE (pp.id = ( SELECT auth.uid() AS uid)))));

-- Non-personal game catalogue

insert into public.game_items(id,name,slot,price,minimum_level,active) values
  ('fire', 'Estela de energía', 'trail', 110, 4, true),
  ('fox', 'Zorro explorador', 'companion', 140, 3, true),
  ('headphones', 'Auriculares neón', 'head', 90, 2, true),
  ('robot', 'Compañero robot', 'companion', 160, 4, true),
  ('sparkles', 'Estela estelar', 'trail', 75, 2, true),
  ('wizard-hat', 'Sombrero de sabio', 'head', 120, 3, true)
on conflict (id) do update set name=excluded.name, slot=excluded.slot, price=excluded.price, minimum_level=excluded.minimum_level, active=excluded.active;

-- Versioned snapshot of the active 1º ESO mathematics catalogue.
-- Safe to run repeatedly after the base schema exists.

with catalogue as (
  select *
  from jsonb_to_recordset($levelup_units$
[
  {
    "id": "M01",
    "subject_id": "math",
    "name": "Números naturales",
    "sort_order": 1,
    "active": true
  },
  {
    "id": "M02",
    "subject_id": "math",
    "name": "Potencias y raíces",
    "sort_order": 2,
    "active": true
  },
  {
    "id": "M03",
    "subject_id": "math",
    "name": "Divisibilidad",
    "sort_order": 3,
    "active": true
  },
  {
    "id": "M04",
    "subject_id": "math",
    "name": "Números enteros",
    "sort_order": 4,
    "active": true
  },
  {
    "id": "M05",
    "subject_id": "math",
    "name": "Números decimales",
    "sort_order": 5,
    "active": true
  },
  {
    "id": "M06",
    "subject_id": "math",
    "name": "Sistema métrico y medida",
    "sort_order": 6,
    "active": true
  },
  {
    "id": "M07",
    "subject_id": "math",
    "name": "Fracciones",
    "sort_order": 7,
    "active": true
  },
  {
    "id": "M08",
    "subject_id": "math",
    "name": "Proporcionalidad y porcentajes",
    "sort_order": 8,
    "active": true
  },
  {
    "id": "M09",
    "subject_id": "math",
    "name": "Álgebra y ecuaciones",
    "sort_order": 9,
    "active": true
  },
  {
    "id": "M10",
    "subject_id": "math",
    "name": "Rectas y ángulos",
    "sort_order": 10,
    "active": true
  },
  {
    "id": "M11",
    "subject_id": "math",
    "name": "Figuras geométricas",
    "sort_order": 11,
    "active": true
  },
  {
    "id": "M12",
    "subject_id": "math",
    "name": "Perímetros y áreas",
    "sort_order": 12,
    "active": true
  },
  {
    "id": "M13",
    "subject_id": "math",
    "name": "Tablas y gráficas",
    "sort_order": 13,
    "active": true
  },
  {
    "id": "M14",
    "subject_id": "math",
    "name": "Estadística",
    "sort_order": 14,
    "active": true
  },
  {
    "id": "M15",
    "subject_id": "math",
    "name": "Probabilidad",
    "sort_order": 15,
    "active": true
  }
]
$levelup_units$::jsonb) as row(
    id text,
    subject_id text,
    name text,
    sort_order integer,
    active boolean
  )
)
insert into public.curriculum_units(id, subject_id, name, sort_order, active)
select id, subject_id, name, sort_order, active
from catalogue
on conflict (id) do update
set subject_id = excluded.subject_id,
    name = excluded.name,
    sort_order = excluded.sort_order,
    active = excluded.active;

with catalogue as (
  select *
  from jsonb_to_recordset($levelup_skills$
[
  {
    "id": "M01S01",
    "name": "Leer y escribir números naturales",
    "subject_id": "math",
    "unit_id": "M01",
    "goal": "Interpretar valor posicional y representar naturales",
    "prerequisites": [],
    "common_errors": [
      "confundir valor posicional",
      "omitir ceros intermedios"
    ],
    "generator_key": "natural_place_value",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M01S02",
    "name": "Comparar y ordenar naturales",
    "subject_id": "math",
    "unit_id": "M01",
    "goal": "Comparar y ordenar naturales",
    "prerequisites": [
      "M01S01"
    ],
    "common_errors": [
      "invertir > y <"
    ],
    "generator_key": "natural_compare",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M01S03",
    "name": "Suma y resta de naturales",
    "subject_id": "math",
    "unit_id": "M01",
    "goal": "Operar y estimar con suma y resta",
    "prerequisites": [
      "M01S01"
    ],
    "common_errors": [
      "errores de llevadas"
    ],
    "generator_key": "natural_add_sub",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M01S04",
    "name": "Multiplicación y división de naturales",
    "subject_id": "math",
    "unit_id": "M01",
    "goal": "Operar e interpretar cociente y resto",
    "prerequisites": [
      "M01S03"
    ],
    "common_errors": [
      "confundir divisor y cociente",
      "ignorar resto"
    ],
    "generator_key": "natural_mult_div",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M01S05",
    "name": "Jerarquía de operaciones",
    "subject_id": "math",
    "unit_id": "M01",
    "goal": "Resolver operaciones combinadas con prioridad y paréntesis",
    "prerequisites": [
      "M01S03",
      "M01S04"
    ],
    "common_errors": [
      "resolver de izquierda a derecha",
      "ignorar paréntesis"
    ],
    "generator_key": "operation_priority",
    "sort_order": 5,
    "critical": true,
    "active": true
  },
  {
    "id": "M01S06",
    "name": "Problemas con naturales",
    "subject_id": "math",
    "unit_id": "M01",
    "goal": "Elegir operaciones y comprobar resultados",
    "prerequisites": [
      "M01S05"
    ],
    "common_errors": [
      "usar todos los datos aunque sobren",
      "elegir operación por palabra clave"
    ],
    "generator_key": "natural_word_problem",
    "sort_order": 6,
    "critical": true,
    "active": true
  },
  {
    "id": "M02S01",
    "name": "Interpretar potencias",
    "subject_id": "math",
    "unit_id": "M02",
    "goal": "Distinguir base, exponente y valor",
    "prerequisites": [
      "M01S04"
    ],
    "common_errors": [
      "multiplicar base por exponente"
    ],
    "generator_key": "powers_meaning",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M02S02",
    "name": "Calcular potencias naturales",
    "subject_id": "math",
    "unit_id": "M02",
    "goal": "Calcular potencias sencillas",
    "prerequisites": [
      "M02S01"
    ],
    "common_errors": [
      "sumar la base repetidamente"
    ],
    "generator_key": "powers_compute",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M02S03",
    "name": "Potencias de base 10",
    "subject_id": "math",
    "unit_id": "M02",
    "goal": "Usar potencias de 10",
    "prerequisites": [
      "M02S02"
    ],
    "common_errors": [
      "contar mal los ceros"
    ],
    "generator_key": "powers_ten",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M02S04",
    "name": "Propiedades elementales de potencias",
    "subject_id": "math",
    "unit_id": "M02",
    "goal": "Aplicar producto y cociente de igual base",
    "prerequisites": [
      "M02S02"
    ],
    "common_errors": [
      "sumar exponentes con bases distintas"
    ],
    "generator_key": "powers_properties",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M02S05",
    "name": "Raíz cuadrada exacta",
    "subject_id": "math",
    "unit_id": "M02",
    "goal": "Calcular raíces exactas",
    "prerequisites": [
      "M02S02"
    ],
    "common_errors": [
      "dividir el número entre dos"
    ],
    "generator_key": "sqrt_exact",
    "sort_order": 5,
    "critical": false,
    "active": true
  },
  {
    "id": "M03S01",
    "name": "Múltiplos",
    "subject_id": "math",
    "unit_id": "M03",
    "goal": "Identificar y generar múltiplos",
    "prerequisites": [
      "M01S04"
    ],
    "common_errors": [
      "confundir múltiplo y divisor"
    ],
    "generator_key": "multiples",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M03S02",
    "name": "Divisores",
    "subject_id": "math",
    "unit_id": "M03",
    "goal": "Identificar divisores",
    "prerequisites": [
      "M03S01"
    ],
    "common_errors": [
      "confundir divisor y múltiplo"
    ],
    "generator_key": "divisors",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M03S03",
    "name": "Criterios de divisibilidad",
    "subject_id": "math",
    "unit_id": "M03",
    "goal": "Aplicar criterios de 2,3,5,9,10 y 11",
    "prerequisites": [
      "M03S02"
    ],
    "common_errors": [
      "aplicar criterio a cifra equivocada"
    ],
    "generator_key": "divisibility_rules",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M03S04",
    "name": "Números primos y compuestos",
    "subject_id": "math",
    "unit_id": "M03",
    "goal": "Reconocer primos y compuestos",
    "prerequisites": [
      "M03S02"
    ],
    "common_errors": [
      "considerar 1 como primo",
      "creer que todo impar es primo"
    ],
    "generator_key": "prime_numbers",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M03S05",
    "name": "Descomposición factorial",
    "subject_id": "math",
    "unit_id": "M03",
    "goal": "Descomponer en factores primos",
    "prerequisites": [
      "M03S03",
      "M03S04"
    ],
    "common_errors": [
      "detener antes de tiempo"
    ],
    "generator_key": "prime_factorization",
    "sort_order": 5,
    "critical": false,
    "active": true
  },
  {
    "id": "M03S06",
    "name": "Máximo común divisor",
    "subject_id": "math",
    "unit_id": "M03",
    "goal": "Calcular MCD y aplicarlo",
    "prerequisites": [
      "M03S05"
    ],
    "common_errors": [
      "confundir MCD con mcm"
    ],
    "generator_key": "gcd",
    "sort_order": 6,
    "critical": false,
    "active": true
  },
  {
    "id": "M03S07",
    "name": "Mínimo común múltiplo",
    "subject_id": "math",
    "unit_id": "M03",
    "goal": "Calcular mcm y aplicarlo",
    "prerequisites": [
      "M03S05"
    ],
    "common_errors": [
      "confundir mcm con MCD"
    ],
    "generator_key": "lcm",
    "sort_order": 7,
    "critical": false,
    "active": true
  },
  {
    "id": "M04S01",
    "name": "Interpretar enteros",
    "subject_id": "math",
    "unit_id": "M04",
    "goal": "Relacionar enteros con contextos reales",
    "prerequisites": [
      "M01S02"
    ],
    "common_errors": [
      "tratar negativos como naturales"
    ],
    "generator_key": "integers_context",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M04S02",
    "name": "Recta numérica y orden",
    "subject_id": "math",
    "unit_id": "M04",
    "goal": "Representar y ordenar enteros",
    "prerequisites": [
      "M04S01"
    ],
    "common_errors": [
      "creer que -8 > -3"
    ],
    "generator_key": "integers_order",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M04S03",
    "name": "Valor absoluto y opuesto",
    "subject_id": "math",
    "unit_id": "M04",
    "goal": "Calcular valor absoluto y opuesto",
    "prerequisites": [
      "M04S02"
    ],
    "common_errors": [
      "confundir valor absoluto con opuesto"
    ],
    "generator_key": "absolute_opposite",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M04S04",
    "name": "Suma de enteros",
    "subject_id": "math",
    "unit_id": "M04",
    "goal": "Sumar enteros con signos",
    "prerequisites": [
      "M04S03"
    ],
    "common_errors": [
      "sumar valores absolutos siempre"
    ],
    "generator_key": "integers_add",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M04S05",
    "name": "Resta de enteros",
    "subject_id": "math",
    "unit_id": "M04",
    "goal": "Restar enteros",
    "prerequisites": [
      "M04S04"
    ],
    "common_errors": [
      "no sumar el opuesto"
    ],
    "generator_key": "integers_sub",
    "sort_order": 5,
    "critical": false,
    "active": true
  },
  {
    "id": "M04S06",
    "name": "Producto y cociente de enteros",
    "subject_id": "math",
    "unit_id": "M04",
    "goal": "Aplicar regla de signos",
    "prerequisites": [
      "M04S04"
    ],
    "common_errors": [
      "regla de signos incorrecta"
    ],
    "generator_key": "integers_mult_div",
    "sort_order": 6,
    "critical": false,
    "active": true
  },
  {
    "id": "M04S07",
    "name": "Operaciones combinadas con enteros",
    "subject_id": "math",
    "unit_id": "M04",
    "goal": "Resolver expresiones con jerarquía",
    "prerequisites": [
      "M01S05",
      "M04S05",
      "M04S06"
    ],
    "common_errors": [
      "ignorar prioridad"
    ],
    "generator_key": "integers_mixed",
    "sort_order": 7,
    "critical": true,
    "active": true
  },
  {
    "id": "M05S01",
    "name": "Valor posicional decimal",
    "subject_id": "math",
    "unit_id": "M05",
    "goal": "Leer y descomponer decimales",
    "prerequisites": [
      "M01S01"
    ],
    "common_errors": [
      "confundir décimas y centésimas"
    ],
    "generator_key": "decimal_place_value",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M05S02",
    "name": "Comparar y ordenar decimales",
    "subject_id": "math",
    "unit_id": "M05",
    "goal": "Comparar y ordenar decimales",
    "prerequisites": [
      "M05S01"
    ],
    "common_errors": [
      "comparar por número de cifras"
    ],
    "generator_key": "decimal_compare",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M05S03",
    "name": "Suma y resta de decimales",
    "subject_id": "math",
    "unit_id": "M05",
    "goal": "Operar alineando la coma",
    "prerequisites": [
      "M05S01",
      "M01S03"
    ],
    "common_errors": [
      "no alinear comas"
    ],
    "generator_key": "decimal_add_sub",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M05S04",
    "name": "Multiplicar y dividir decimales",
    "subject_id": "math",
    "unit_id": "M05",
    "goal": "Operar con productos y cocientes decimales",
    "prerequisites": [
      "M05S03",
      "M01S04"
    ],
    "common_errors": [
      "colocar coma por intuición"
    ],
    "generator_key": "decimal_mult_div",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M05S05",
    "name": "Aproximación y redondeo",
    "subject_id": "math",
    "unit_id": "M05",
    "goal": "Redondear a unidades, décimas y centésimas",
    "prerequisites": [
      "M05S01"
    ],
    "common_errors": [
      "truncar en vez de redondear"
    ],
    "generator_key": "decimal_round",
    "sort_order": 5,
    "critical": false,
    "active": true
  },
  {
    "id": "M06S01",
    "name": "Longitud",
    "subject_id": "math",
    "unit_id": "M06",
    "goal": "Convertir unidades de longitud",
    "prerequisites": [
      "M05S04"
    ],
    "common_errors": [
      "mover coma al lado incorrecto"
    ],
    "generator_key": "metric_length",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M06S02",
    "name": "Masa",
    "subject_id": "math",
    "unit_id": "M06",
    "goal": "Convertir unidades de masa",
    "prerequisites": [
      "M06S01"
    ],
    "common_errors": [
      "confundir kg y g"
    ],
    "generator_key": "metric_mass",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M06S03",
    "name": "Capacidad",
    "subject_id": "math",
    "unit_id": "M06",
    "goal": "Convertir unidades de capacidad",
    "prerequisites": [
      "M06S01"
    ],
    "common_errors": [
      "confundir L y mL"
    ],
    "generator_key": "metric_capacity",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M06S04",
    "name": "Superficie",
    "subject_id": "math",
    "unit_id": "M06",
    "goal": "Convertir unidades de superficie",
    "prerequisites": [
      "M06S01"
    ],
    "common_errors": [
      "usar factor 10 en vez de 100"
    ],
    "generator_key": "metric_area_units",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M06S05",
    "name": "Tiempo y sistema sexagesimal",
    "subject_id": "math",
    "unit_id": "M06",
    "goal": "Operar con horas, minutos y segundos",
    "prerequisites": [
      "M01S03"
    ],
    "common_errors": [
      "tratar 60 como base 10"
    ],
    "generator_key": "sexagesimal_time",
    "sort_order": 5,
    "critical": false,
    "active": true
  },
  {
    "id": "M07S01",
    "name": "Interpretar fracciones",
    "subject_id": "math",
    "unit_id": "M07",
    "goal": "Interpretar numerador, denominador y fracción como operador",
    "prerequisites": [
      "M01S04"
    ],
    "common_errors": [
      "invertir numerador y denominador"
    ],
    "generator_key": "fraction_meaning",
    "sort_order": 1,
    "critical": true,
    "active": true
  },
  {
    "id": "M07S02",
    "name": "Fracciones equivalentes",
    "subject_id": "math",
    "unit_id": "M07",
    "goal": "Reconocer y ampliar equivalentes",
    "prerequisites": [
      "M07S01"
    ],
    "common_errors": [
      "cambiar solo un término"
    ],
    "generator_key": "fraction_equivalent",
    "sort_order": 2,
    "critical": true,
    "active": true
  },
  {
    "id": "M07S03",
    "name": "Simplificar fracciones",
    "subject_id": "math",
    "unit_id": "M07",
    "goal": "Reducir a irreducible",
    "prerequisites": [
      "M03S02",
      "M07S02"
    ],
    "common_errors": [
      "dividir por números distintos"
    ],
    "generator_key": "fraction_simplify",
    "sort_order": 3,
    "critical": true,
    "active": true
  },
  {
    "id": "M07S04",
    "name": "Comparar y ordenar fracciones",
    "subject_id": "math",
    "unit_id": "M07",
    "goal": "Comparar con igual o distinto denominador",
    "prerequisites": [
      "M07S02"
    ],
    "common_errors": [
      "comparar solo numeradores"
    ],
    "generator_key": "fraction_compare",
    "sort_order": 4,
    "critical": true,
    "active": true
  },
  {
    "id": "M07S05",
    "name": "Suma y resta de fracciones",
    "subject_id": "math",
    "unit_id": "M07",
    "goal": "Operar con denominador común",
    "prerequisites": [
      "M07S03",
      "M03S07"
    ],
    "common_errors": [
      "sumar denominadores"
    ],
    "generator_key": "fraction_add_sub",
    "sort_order": 5,
    "critical": true,
    "active": true
  },
  {
    "id": "M07S06",
    "name": "Multiplicar fracciones",
    "subject_id": "math",
    "unit_id": "M07",
    "goal": "Multiplicar y simplificar",
    "prerequisites": [
      "M07S03"
    ],
    "common_errors": [
      "multiplicar en cruz"
    ],
    "generator_key": "fraction_multiply",
    "sort_order": 6,
    "critical": true,
    "active": true
  },
  {
    "id": "M07S07",
    "name": "Dividir fracciones",
    "subject_id": "math",
    "unit_id": "M07",
    "goal": "Dividir usando la inversa de la segunda",
    "prerequisites": [
      "M07S06"
    ],
    "common_errors": [
      "invertir la primera"
    ],
    "generator_key": "fraction_divide",
    "sort_order": 7,
    "critical": true,
    "active": true
  },
  {
    "id": "M07S08",
    "name": "Problemas con fracciones",
    "subject_id": "math",
    "unit_id": "M07",
    "goal": "Modelizar situaciones con fracciones",
    "prerequisites": [
      "M07S05",
      "M07S06",
      "M07S07"
    ],
    "common_errors": [
      "elegir operación por palabra clave"
    ],
    "generator_key": "fraction_word_problem",
    "sort_order": 8,
    "critical": true,
    "active": true
  },
  {
    "id": "M08S01",
    "name": "Razón",
    "subject_id": "math",
    "unit_id": "M08",
    "goal": "Interpretar razón como comparación multiplicativa",
    "prerequisites": [
      "M07S01"
    ],
    "common_errors": [
      "confundir razón con diferencia"
    ],
    "generator_key": "ratio",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M08S02",
    "name": "Reconocer proporcionalidad directa",
    "subject_id": "math",
    "unit_id": "M08",
    "goal": "Distinguir situaciones proporcionales",
    "prerequisites": [
      "M08S01"
    ],
    "common_errors": [
      "suponer proporcionalidad siempre"
    ],
    "generator_key": "direct_proportion_recognize",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M08S03",
    "name": "Tablas proporcionales",
    "subject_id": "math",
    "unit_id": "M08",
    "goal": "Completar tablas de proporcionalidad",
    "prerequisites": [
      "M08S02"
    ],
    "common_errors": [
      "sumar cantidad fija"
    ],
    "generator_key": "direct_proportion_table",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M08S04",
    "name": "Regla de tres directa",
    "subject_id": "math",
    "unit_id": "M08",
    "goal": "Resolver problemas de proporcionalidad",
    "prerequisites": [
      "M08S03"
    ],
    "common_errors": [
      "colocar magnitudes incompatibles"
    ],
    "generator_key": "rule_of_three",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M08S05",
    "name": "Porcentaje de una cantidad",
    "subject_id": "math",
    "unit_id": "M08",
    "goal": "Calcular porcentajes",
    "prerequisites": [
      "M08S03",
      "M07S06"
    ],
    "common_errors": [
      "confundir porcentaje con cantidad final"
    ],
    "generator_key": "percentage_of",
    "sort_order": 5,
    "critical": true,
    "active": true
  },
  {
    "id": "M08S06",
    "name": "Aumentos y descuentos",
    "subject_id": "math",
    "unit_id": "M08",
    "goal": "Calcular valores finales",
    "prerequisites": [
      "M08S05"
    ],
    "common_errors": [
      "usar base incorrecta"
    ],
    "generator_key": "percentage_change",
    "sort_order": 6,
    "critical": false,
    "active": true
  },
  {
    "id": "M08S07",
    "name": "Problemas de proporcionalidad",
    "subject_id": "math",
    "unit_id": "M08",
    "goal": "Elegir y justificar estrategia",
    "prerequisites": [
      "M08S04",
      "M08S06"
    ],
    "common_errors": [
      "usar regla de tres sin proporcionalidad"
    ],
    "generator_key": "proportion_word_problem",
    "sort_order": 7,
    "critical": true,
    "active": true
  },
  {
    "id": "M09S01",
    "name": "Lenguaje algebraico",
    "subject_id": "math",
    "unit_id": "M09",
    "goal": "Traducir frases a expresiones",
    "prerequisites": [
      "M01S05"
    ],
    "common_errors": [
      "omitir paréntesis"
    ],
    "generator_key": "algebra_translate",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M09S02",
    "name": "Valor numérico",
    "subject_id": "math",
    "unit_id": "M09",
    "goal": "Sustituir variables y calcular",
    "prerequisites": [
      "M09S01",
      "M04S07"
    ],
    "common_errors": [
      "ignorar signos"
    ],
    "generator_key": "algebra_evaluate",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M09S03",
    "name": "Términos semejantes",
    "subject_id": "math",
    "unit_id": "M09",
    "goal": "Reducir términos semejantes",
    "prerequisites": [
      "M09S01"
    ],
    "common_errors": [
      "sumar no semejantes"
    ],
    "generator_key": "like_terms",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M09S04",
    "name": "Ecuaciones de un paso",
    "subject_id": "math",
    "unit_id": "M09",
    "goal": "Resolver x+a=b y ax=b",
    "prerequisites": [
      "M09S02"
    ],
    "common_errors": [
      "romper equivalencia"
    ],
    "generator_key": "equation_one_step",
    "sort_order": 4,
    "critical": true,
    "active": true
  },
  {
    "id": "M09S05",
    "name": "Ecuaciones de varios pasos sencillas",
    "subject_id": "math",
    "unit_id": "M09",
    "goal": "Resolver ecuaciones lineales elementales",
    "prerequisites": [
      "M09S04",
      "M09S03"
    ],
    "common_errors": [
      "distribuir mal"
    ],
    "generator_key": "equation_multi_step",
    "sort_order": 5,
    "critical": true,
    "active": true
  },
  {
    "id": "M09S06",
    "name": "Comprobar soluciones",
    "subject_id": "math",
    "unit_id": "M09",
    "goal": "Verificar sustituyendo",
    "prerequisites": [
      "M09S04"
    ],
    "common_errors": [
      "comprobar solo un miembro"
    ],
    "generator_key": "equation_check",
    "sort_order": 6,
    "critical": false,
    "active": true
  },
  {
    "id": "M09S07",
    "name": "Problemas con ecuaciones",
    "subject_id": "math",
    "unit_id": "M09",
    "goal": "Definir incógnita, plantear y resolver",
    "prerequisites": [
      "M09S05"
    ],
    "common_errors": [
      "traducir mal relaciones"
    ],
    "generator_key": "equation_word_problem",
    "sort_order": 7,
    "critical": true,
    "active": true
  },
  {
    "id": "M10S01",
    "name": "Puntos, rectas y segmentos",
    "subject_id": "math",
    "unit_id": "M10",
    "goal": "Distinguir elementos básicos del plano",
    "prerequisites": [],
    "common_errors": [
      "confundir recta y segmento"
    ],
    "generator_key": "geometry_lines",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M10S02",
    "name": "Tipos de ángulos",
    "subject_id": "math",
    "unit_id": "M10",
    "goal": "Reconocer tipos de ángulos",
    "prerequisites": [
      "M10S01"
    ],
    "common_errors": [
      "clasificar por apariencia"
    ],
    "generator_key": "angle_types",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M10S03",
    "name": "Medida de ángulos",
    "subject_id": "math",
    "unit_id": "M10",
    "goal": "Medir y expresar grados",
    "prerequisites": [
      "M10S02",
      "M06S05"
    ],
    "common_errors": [
      "leer escala equivocada"
    ],
    "generator_key": "angle_measure",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M10S04",
    "name": "Complementarios y suplementarios",
    "subject_id": "math",
    "unit_id": "M10",
    "goal": "Calcular ángulos relacionados",
    "prerequisites": [
      "M10S03"
    ],
    "common_errors": [
      "confundir 90 y 180"
    ],
    "generator_key": "angle_relations",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M10S05",
    "name": "Ángulos en paralelas",
    "subject_id": "math",
    "unit_id": "M10",
    "goal": "Reconocer relaciones básicas",
    "prerequisites": [
      "M10S04"
    ],
    "common_errors": [
      "confundir correspondientes y alternos"
    ],
    "generator_key": "parallel_angles",
    "sort_order": 5,
    "critical": false,
    "active": true
  },
  {
    "id": "M11S01",
    "name": "Clasificar triángulos por lados",
    "subject_id": "math",
    "unit_id": "M11",
    "goal": "Reconocer equilátero, isósceles y escaleno",
    "prerequisites": [
      "M10S01"
    ],
    "common_errors": [
      "clasificar por apariencia"
    ],
    "generator_key": "triangle_sides",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M11S02",
    "name": "Clasificar triángulos por ángulos",
    "subject_id": "math",
    "unit_id": "M11",
    "goal": "Reconocer acutángulo, rectángulo y obtusángulo",
    "prerequisites": [
      "M10S02"
    ],
    "common_errors": [
      "mezclar clasificaciones"
    ],
    "generator_key": "triangle_angles",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M11S03",
    "name": "Suma de ángulos de triángulo",
    "subject_id": "math",
    "unit_id": "M11",
    "goal": "Calcular ángulos usando 180°",
    "prerequisites": [
      "M10S04",
      "M11S02"
    ],
    "common_errors": [
      "usar 360"
    ],
    "generator_key": "triangle_angle_sum",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M11S04",
    "name": "Cuadriláteros",
    "subject_id": "math",
    "unit_id": "M11",
    "goal": "Clasificar por propiedades",
    "prerequisites": [
      "M10S01"
    ],
    "common_errors": [
      "confundir rombo y cuadrado"
    ],
    "generator_key": "quadrilaterals",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M11S05",
    "name": "Polígonos regulares",
    "subject_id": "math",
    "unit_id": "M11",
    "goal": "Reconocer elementos y propiedades",
    "prerequisites": [
      "M11S04"
    ],
    "common_errors": [
      "confundir regular con convexo"
    ],
    "generator_key": "regular_polygons",
    "sort_order": 5,
    "critical": false,
    "active": true
  },
  {
    "id": "M11S06",
    "name": "Circunferencia y círculo",
    "subject_id": "math",
    "unit_id": "M11",
    "goal": "Distinguir radio, diámetro, cuerda y arco",
    "prerequisites": [
      "M10S01"
    ],
    "common_errors": [
      "confundir círculo y circunferencia"
    ],
    "generator_key": "circle_elements",
    "sort_order": 6,
    "critical": false,
    "active": true
  },
  {
    "id": "M11S07",
    "name": "Simetría",
    "subject_id": "math",
    "unit_id": "M11",
    "goal": "Identificar ejes de simetría",
    "prerequisites": [
      "M11S05"
    ],
    "common_errors": [
      "contar diagonales como ejes"
    ],
    "generator_key": "symmetry",
    "sort_order": 7,
    "critical": false,
    "active": true
  },
  {
    "id": "M11S08",
    "name": "Clasificación geométrica razonada",
    "subject_id": "math",
    "unit_id": "M11",
    "goal": "Justificar clasificaciones usando propiedades",
    "prerequisites": [
      "M11S01",
      "M11S04",
      "M11S06"
    ],
    "common_errors": [
      "responder por apariencia"
    ],
    "generator_key": "geometry_classification",
    "sort_order": 8,
    "critical": false,
    "active": true
  },
  {
    "id": "M12S01",
    "name": "Perímetro de polígonos",
    "subject_id": "math",
    "unit_id": "M12",
    "goal": "Calcular perímetros",
    "prerequisites": [
      "M11S04"
    ],
    "common_errors": [
      "confundir perímetro y área"
    ],
    "generator_key": "perimeter",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M12S02",
    "name": "Área de rectángulo y cuadrado",
    "subject_id": "math",
    "unit_id": "M12",
    "goal": "Calcular áreas",
    "prerequisites": [
      "M06S04"
    ],
    "common_errors": [
      "sumar lados"
    ],
    "generator_key": "rectangle_square_area",
    "sort_order": 2,
    "critical": true,
    "active": true
  },
  {
    "id": "M12S03",
    "name": "Área de triángulo",
    "subject_id": "math",
    "unit_id": "M12",
    "goal": "Calcular base por altura entre dos",
    "prerequisites": [
      "M11S01",
      "M12S02"
    ],
    "common_errors": [
      "olvidar dividir entre dos"
    ],
    "generator_key": "triangle_area",
    "sort_order": 3,
    "critical": true,
    "active": true
  },
  {
    "id": "M12S04",
    "name": "Área de paralelogramo y trapecio",
    "subject_id": "math",
    "unit_id": "M12",
    "goal": "Aplicar fórmulas sencillas",
    "prerequisites": [
      "M12S02",
      "M12S03"
    ],
    "common_errors": [
      "usar lado como altura"
    ],
    "generator_key": "quadrilateral_area",
    "sort_order": 4,
    "critical": true,
    "active": true
  },
  {
    "id": "M12S05",
    "name": "Circunferencia y círculo",
    "subject_id": "math",
    "unit_id": "M12",
    "goal": "Calcular longitud y área con pi",
    "prerequisites": [
      "M11S06",
      "M12S02"
    ],
    "common_errors": [
      "confundir radio y diámetro"
    ],
    "generator_key": "circle_measure",
    "sort_order": 5,
    "critical": false,
    "active": true
  },
  {
    "id": "M12S06",
    "name": "Figuras compuestas",
    "subject_id": "math",
    "unit_id": "M12",
    "goal": "Descomponer figuras para calcular áreas y perímetros",
    "prerequisites": [
      "M12S01",
      "M12S02",
      "M12S03",
      "M12S04"
    ],
    "common_errors": [
      "sumar áreas solapadas"
    ],
    "generator_key": "composite_area",
    "sort_order": 6,
    "critical": false,
    "active": true
  },
  {
    "id": "M13S01",
    "name": "Coordenadas cartesianas",
    "subject_id": "math",
    "unit_id": "M13",
    "goal": "Representar puntos",
    "prerequisites": [
      "M04S02"
    ],
    "common_errors": [
      "intercambiar x e y"
    ],
    "generator_key": "coordinates",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M13S02",
    "name": "Leer tablas de valores",
    "subject_id": "math",
    "unit_id": "M13",
    "goal": "Interpretar relaciones en tablas",
    "prerequisites": [
      "M05S02"
    ],
    "common_errors": [
      "leer fila incorrecta"
    ],
    "generator_key": "value_tables",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M13S03",
    "name": "Representar datos en gráficas",
    "subject_id": "math",
    "unit_id": "M13",
    "goal": "Pasar de tabla a gráfica",
    "prerequisites": [
      "M13S01",
      "M13S02"
    ],
    "common_errors": [
      "intercambiar ejes"
    ],
    "generator_key": "plot_graph",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M13S04",
    "name": "Interpretar gráficas",
    "subject_id": "math",
    "unit_id": "M13",
    "goal": "Extraer tendencias, máximos y mínimos",
    "prerequisites": [
      "M13S03"
    ],
    "common_errors": [
      "ignorar escala"
    ],
    "generator_key": "graph_interpret",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M14S01",
    "name": "Población, muestra e individuo",
    "subject_id": "math",
    "unit_id": "M14",
    "goal": "Distinguir conceptos básicos",
    "prerequisites": [],
    "common_errors": [
      "confundir muestra con variable"
    ],
    "generator_key": "stats_population",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M14S02",
    "name": "Variables estadísticas",
    "subject_id": "math",
    "unit_id": "M14",
    "goal": "Distinguir cualitativas y cuantitativas",
    "prerequisites": [
      "M14S01"
    ],
    "common_errors": [
      "clasificar por respuesta"
    ],
    "generator_key": "stats_variables",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M14S03",
    "name": "Tabla de frecuencias",
    "subject_id": "math",
    "unit_id": "M14",
    "goal": "Organizar frecuencias absolutas",
    "prerequisites": [
      "M14S02"
    ],
    "common_errors": [
      "confundir valor y frecuencia"
    ],
    "generator_key": "frequency_table",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M14S04",
    "name": "Gráficos estadísticos",
    "subject_id": "math",
    "unit_id": "M14",
    "goal": "Leer y construir gráficos sencillos",
    "prerequisites": [
      "M14S03"
    ],
    "common_errors": [
      "ignorar escala"
    ],
    "generator_key": "stat_charts",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M14S05",
    "name": "Media aritmética",
    "subject_id": "math",
    "unit_id": "M14",
    "goal": "Calcular e interpretar media",
    "prerequisites": [
      "M14S03",
      "M07S01"
    ],
    "common_errors": [
      "dividir por número incorrecto"
    ],
    "generator_key": "mean",
    "sort_order": 5,
    "critical": false,
    "active": true
  },
  {
    "id": "M14S06",
    "name": "Mediana",
    "subject_id": "math",
    "unit_id": "M14",
    "goal": "Calcular mediana",
    "prerequisites": [
      "M14S03"
    ],
    "common_errors": [
      "no ordenar datos"
    ],
    "generator_key": "median",
    "sort_order": 6,
    "critical": false,
    "active": true
  },
  {
    "id": "M14S07",
    "name": "Moda",
    "subject_id": "math",
    "unit_id": "M14",
    "goal": "Identificar la moda",
    "prerequisites": [
      "M14S03"
    ],
    "common_errors": [
      "elegir el valor mayor"
    ],
    "generator_key": "mode",
    "sort_order": 7,
    "critical": false,
    "active": true
  },
  {
    "id": "M15S01",
    "name": "Experimentos aleatorios",
    "subject_id": "math",
    "unit_id": "M15",
    "goal": "Distinguir deterministas y aleatorios",
    "prerequisites": [],
    "common_errors": [
      "confundir desconocido con aleatorio"
    ],
    "generator_key": "random_experiments",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M15S02",
    "name": "Sucesos",
    "subject_id": "math",
    "unit_id": "M15",
    "goal": "Reconocer posible, seguro e imposible",
    "prerequisites": [
      "M15S01"
    ],
    "common_errors": [
      "confundir imposible con improbable"
    ],
    "generator_key": "events",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M15S03",
    "name": "Casos favorables y posibles",
    "subject_id": "math",
    "unit_id": "M15",
    "goal": "Contar casos equiprobables",
    "prerequisites": [
      "M15S02"
    ],
    "common_errors": [
      "contar casos repetidos"
    ],
    "generator_key": "favorable_possible",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M15S04",
    "name": "Probabilidad de Laplace básica",
    "subject_id": "math",
    "unit_id": "M15",
    "goal": "Calcular favorables/posibles",
    "prerequisites": [
      "M15S03",
      "M07S01"
    ],
    "common_errors": [
      "invertir la fracción"
    ],
    "generator_key": "laplace_basic",
    "sort_order": 4,
    "critical": false,
    "active": true
  }
]
$levelup_skills$::jsonb) as row(
    id text,
    name text,
    subject_id text,
    unit_id text,
    goal text,
    prerequisites text[],
    common_errors text[],
    generator_key text,
    sort_order integer,
    critical boolean,
    active boolean
  )
)
insert into public.skills(
  id, name, subject_id, unit_id, goal, prerequisites, common_errors,
  generator_key, sort_order, critical, active
)
select
  id, name, subject_id, unit_id, goal, prerequisites, common_errors,
  generator_key, sort_order, critical, active
from catalogue
on conflict (id) do update
set name = excluded.name,
    subject_id = excluded.subject_id,
    unit_id = excluded.unit_id,
    goal = excluded.goal,
    prerequisites = excluded.prerequisites,
    common_errors = excluded.common_errors,
    generator_key = excluded.generator_key,
    sort_order = excluded.sort_order,
    critical = excluded.critical,
    active = excluded.active;

-- Data API least privilege

revoke all privileges on all tables in schema public from anon, authenticated, service_role;
revoke all privileges on all sequences in schema public from anon, authenticated, service_role;
revoke execute on all functions in schema public from public, anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;

grant DELETE on table public.attempts to service_role;
grant DELETE on table public.curriculum_units to service_role;
grant DELETE on table public.exams to service_role;
grant DELETE on table public.families to service_role;
grant DELETE on table public.parent_profiles to service_role;
grant DELETE on table public.player_skill_state to service_role;
grant DELETE on table public.players to service_role;
grant DELETE on table public.skills to service_role;
grant DELETE on table public.study_sessions to service_role;
grant INSERT on table public.attempts to service_role;
grant INSERT on table public.curriculum_units to service_role;
grant INSERT on table public.exams to service_role;
grant INSERT on table public.families to service_role;
grant INSERT on table public.parent_profiles to service_role;
grant INSERT on table public.player_skill_state to service_role;
grant INSERT on table public.players to service_role;
grant INSERT on table public.skills to service_role;
grant INSERT on table public.study_sessions to service_role;
grant REFERENCES on table public.attempts to service_role;
grant REFERENCES on table public.curriculum_units to service_role;
grant REFERENCES on table public.exams to service_role;
grant REFERENCES on table public.families to service_role;
grant REFERENCES on table public.parent_profiles to service_role;
grant REFERENCES on table public.player_skill_state to service_role;
grant REFERENCES on table public.players to service_role;
grant REFERENCES on table public.skills to service_role;
grant REFERENCES on table public.study_sessions to service_role;
grant SELECT on table public.attempts to authenticated;
grant SELECT on table public.attempts to service_role;
grant SELECT on table public.curriculum_units to authenticated;
grant SELECT on table public.curriculum_units to service_role;
grant SELECT on table public.exams to service_role;
grant SELECT on table public.families to authenticated;
grant SELECT on table public.families to service_role;
grant SELECT on table public.game_items to authenticated;
grant SELECT on table public.parent_profiles to authenticated;
grant SELECT on table public.parent_profiles to service_role;
grant SELECT on table public.player_curriculum_plans to authenticated;
grant SELECT on table public.player_inventory to authenticated;
grant SELECT on table public.player_skill_state to authenticated;
grant SELECT on table public.player_skill_state to service_role;
grant SELECT on table public.players to authenticated;
grant SELECT on table public.players to service_role;
grant SELECT on table public.product_events to authenticated;
grant SELECT on table public.skills to authenticated;
grant SELECT on table public.skills to service_role;
grant SELECT on table public.study_sessions to authenticated;
grant SELECT on table public.study_sessions to service_role;
grant TRIGGER on table public.attempts to service_role;
grant TRIGGER on table public.curriculum_units to service_role;
grant TRIGGER on table public.exams to service_role;
grant TRIGGER on table public.families to service_role;
grant TRIGGER on table public.parent_profiles to service_role;
grant TRIGGER on table public.player_skill_state to service_role;
grant TRIGGER on table public.players to service_role;
grant TRIGGER on table public.skills to service_role;
grant TRIGGER on table public.study_sessions to service_role;
grant TRUNCATE on table public.attempts to service_role;
grant TRUNCATE on table public.curriculum_units to service_role;
grant TRUNCATE on table public.exams to service_role;
grant TRUNCATE on table public.families to service_role;
grant TRUNCATE on table public.parent_profiles to service_role;
grant TRUNCATE on table public.player_skill_state to service_role;
grant TRUNCATE on table public.players to service_role;
grant TRUNCATE on table public.skills to service_role;
grant TRUNCATE on table public.study_sessions to service_role;
grant UPDATE on table public.attempts to service_role;
grant UPDATE on table public.curriculum_units to service_role;
grant UPDATE on table public.exams to service_role;
grant UPDATE on table public.families to service_role;
grant UPDATE on table public.parent_profiles to service_role;
grant UPDATE on table public.player_skill_state to service_role;
grant UPDATE on table public.players to service_role;
grant UPDATE on table public.skills to service_role;
grant UPDATE on table public.study_sessions to service_role;

grant EXECUTE on function abandon_expired_levelup_sessions_on_insert() to service_role;
grant EXECUTE on function complete_levelup_onboarding(uuid) to authenticated;
grant EXECUTE on function complete_levelup_session(uuid) to authenticated;
grant EXECUTE on function complete_levelup_session(uuid) to service_role;
grant EXECUTE on function create_levelup_player(text,integer) to authenticated;
grant EXECUTE on function create_levelup_player(text,integer) to service_role;
grant EXECUTE on function equip_levelup_item(uuid,text) to authenticated;
grant EXECUTE on function get_levelup_game_summary(uuid) to authenticated;
grant EXECUTE on function open_levelup_session(uuid) to authenticated;
grant EXECUTE on function open_levelup_session(uuid) to service_role;
grant EXECUTE on function purchase_levelup_item(uuid,text) to authenticated;
grant EXECUTE on function recalculate_skill_priority() to service_role;
grant EXECUTE on function report_levelup_product_event(uuid,text,text) to authenticated;
grant EXECUTE on function set_levelup_avatar(uuid,text) to authenticated;
grant EXECUTE on function set_levelup_game_preferences(uuid,text,boolean) to authenticated;
grant EXECUTE on function set_player_curriculum_plan(uuid,text,integer,text,integer,text[]) to authenticated;
grant EXECUTE on function setup_parent_family(text,text) to authenticated;
grant EXECUTE on function setup_parent_family(text,text) to service_role;
grant EXECUTE on function submit_levelup_attempt(uuid,text,boolean,integer,integer,bigint,text,uuid,text[]) to authenticated;
grant EXECUTE on function submit_levelup_attempt(uuid,text,boolean,integer,integer,bigint,text,uuid,text[]) to service_role;

alter default privileges for role postgres in schema public revoke all privileges on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all privileges on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all privileges on functions from public, anon, authenticated, service_role;

-- Scheduled cleanup

select cron.schedule('levelup-expire-abandoned-sessions', '17 * * * *', $levelup_cron$update public.study_sessions
    set ended_at = now(),
        phase = 'abandoned'
    where completed = false
      and ended_at is null
      and started_at < now() - interval '24 hours';$levelup_cron$);

commit;
