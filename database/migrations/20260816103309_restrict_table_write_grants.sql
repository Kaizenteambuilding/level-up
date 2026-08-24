-- Recovered from the applied Supabase migration history.
-- Version: 20260816103309 · restrict_table_write_grants

revoke insert, update, delete, truncate, references, trigger
on table
  public.attempts,
  public.player_skill_state,
  public.study_sessions,
  public.families,
  public.parent_profiles
from anon, authenticated;

revoke update, delete, truncate, references, trigger
on table public.players
from anon, authenticated;

