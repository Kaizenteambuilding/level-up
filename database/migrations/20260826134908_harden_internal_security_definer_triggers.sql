-- Harden internal trigger-only SECURITY DEFINER functions.
-- These functions are invoked by PostgreSQL triggers, not through the Data API.
-- Keep their execution context deterministic and remove direct EXECUTE from API roles.

alter function public.abandon_expired_levelup_sessions_on_insert() set search_path = '';

revoke execute on function public.abandon_expired_levelup_sessions_on_insert()
  from public, anon, authenticated, service_role;
revoke execute on function public.prevent_repeat_daily_completion()
  from public, anon, authenticated, service_role;

comment on function public.abandon_expired_levelup_sessions_on_insert() is
  'Internal trigger only. SECURITY DEFINER with empty search_path; direct EXECUTE revoked from API roles.';
comment on function public.prevent_repeat_daily_completion() is
  'Internal trigger only. SECURITY DEFINER with empty search_path; direct EXECUTE revoked from API roles.';
