-- New application objects are private by default. Any Data API access must be
-- granted explicitly in the same reviewed migration that creates the object.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete, truncate, references, trigger
  on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke usage, select, update
  on sequences from anon, authenticated, service_role;

-- PostgreSQL otherwise gives PUBLIC execution rights on every new function.
-- Protected RPCs must opt authenticated users in with an explicit GRANT.
alter default privileges for role postgres in schema public
  revoke execute on functions from public;

