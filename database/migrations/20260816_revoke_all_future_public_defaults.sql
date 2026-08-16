-- PostgreSQL 17 adds MAINTAIN to table privileges, and older project defaults
-- may also contain direct grants in addition to PUBLIC membership. REVOKE ALL
-- keeps the deny-by-default rule complete across both cases.
alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all privileges on sequences from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all privileges on functions from public, anon, authenticated, service_role;

