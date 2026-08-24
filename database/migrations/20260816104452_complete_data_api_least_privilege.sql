-- Recovered from the applied Supabase migration history.
-- Version: 20260816104452 · complete_data_api_least_privilege

revoke all privileges
on table
  public.attempts,
  public.curriculum_units,
  public.exams,
  public.families,
  public.parent_profiles,
  public.player_skill_state,
  public.players,
  public.skills,
  public.study_sessions
from anon;

revoke insert, update, delete, truncate, references, trigger
on table public.curriculum_units, public.skills
from authenticated;

revoke all privileges on table public.exams from authenticated;

