-- Signed-out pages do not read application tables. Authentication itself uses
-- the Auth API, so the anonymous Data API role needs no table privileges.
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

-- Curriculum is read-only for the application. Exams are not part of the
-- current product and remain completely unavailable through the Data API.
revoke insert, update, delete, truncate, references, trigger
on table public.curriculum_units, public.skills
from authenticated;

revoke all privileges on table public.exams from authenticated;
