-- Recovered from the applied Supabase migration history.
-- Version: 20260816141558 · secure_future_data_api_defaults

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete, truncate, references, trigger
  on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke usage, select, update
  on sequences from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from public;

