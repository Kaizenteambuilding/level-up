-- Recovered from the applied Supabase migration history.
-- Version: 20260816141652 · revoke_all_future_public_defaults

alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all privileges on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all privileges on functions from public, anon, authenticated, service_role;

