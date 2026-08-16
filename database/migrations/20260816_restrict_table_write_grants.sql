-- RLS remains the tenant boundary, but tables maintained by protected RPCs do
-- not also need generic Data API write privileges.
revoke insert, update, delete, truncate, references, trigger
on table
  public.attempts,
  public.player_skill_state,
  public.study_sessions,
  public.families,
  public.parent_profiles
from anon, authenticated;

-- Player creation is still an intentional client flow protected by its INSERT
-- policy. Progress fields remain server-controlled.
revoke update, delete, truncate, references, trigger
on table public.players
from anon, authenticated;
