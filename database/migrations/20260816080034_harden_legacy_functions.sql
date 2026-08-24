-- Recovered from the applied Supabase migration history.
-- Version: 20260816080034 · harden_legacy_functions

begin;

-- These legacy RPCs are no longer called by the application. Keeping them
-- exposed would preserve a second, weaker session lifecycle and would allow
-- client-supplied completion totals.
drop function if exists public.start_daily_session(uuid, integer);
drop function if exists public.finish_daily_session(uuid, integer, integer);

-- Family setup remains a public API operation for signed-in parents only.
revoke all on function public.setup_parent_family(text, text)
  from public, anon;
grant execute on function public.setup_parent_family(text, text)
  to authenticated, service_role;

-- This function is an internal trigger helper, not an API endpoint.
alter function public.recalculate_skill_priority()
  set search_path = public;
revoke all on function public.recalculate_skill_priority()
  from public, anon, authenticated;
grant execute on function public.recalculate_skill_priority()
  to service_role;

commit;

