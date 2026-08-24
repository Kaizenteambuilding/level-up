create table if not exists public.product_events (
  id bigint generated always as identity primary key,
  parent_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  event_name text not null check (event_name in ('onboarding_opened','onboarding_avatar_saved','onboarding_mission_opened','onboarding_completed','world_opened','mission_started','mission_completed','client_error')),
  route text not null check (route ~ '^/[a-z0-9/?=&_-]{0,120}$'),
  created_at timestamptz not null default now()
);
alter table public.product_events enable row level security;
create index if not exists product_events_parent_created_idx on public.product_events(parent_id, created_at desc);
create index if not exists product_events_player_created_idx on public.product_events(player_id, created_at desc);
create policy "parents can read own product events" on public.product_events for select to authenticated using (parent_id = (select auth.uid()));
grant select on table public.product_events to authenticated;
revoke all privileges on table public.product_events from anon;
revoke insert, update, delete, truncate, references, trigger on table public.product_events from authenticated;

create or replace function public.report_levelup_product_event(p_player_id uuid, p_event_name text, p_route text)
returns void language plpgsql security definer set search_path = ''
as $function$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_event_name not in ('onboarding_opened','onboarding_avatar_saved','onboarding_mission_opened','onboarding_completed','world_opened','mission_started','mission_completed','client_error') then raise exception 'Event not available'; end if;
  if p_route is null or p_route !~ '^/[a-z0-9/?=&_-]{0,120}$' then raise exception 'Route not available'; end if;
  if not exists (select 1 from public.players p join public.parent_profiles pp on pp.family_id = p.family_id where p.id = p_player_id and pp.id = auth.uid()) then raise exception 'Player not available'; end if;
  delete from public.product_events where parent_id = auth.uid() and created_at < now() - interval '180 days';
  insert into public.product_events(parent_id, player_id, event_name, route) values (auth.uid(), p_player_id, p_event_name, p_route);
end;
$function$;
revoke execute on function public.report_levelup_product_event(uuid, text, text) from public, anon;
grant execute on function public.report_levelup_product_event(uuid, text, text) to authenticated;
