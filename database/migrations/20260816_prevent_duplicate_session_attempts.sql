create unique index if not exists attempts_session_question_seed_unique
  on public.attempts(session_id, question_seed)
  where session_id is not null;

alter table public.attempts
  drop constraint if exists attempts_new_rows_require_session,
  add constraint attempts_new_rows_require_session
    check (session_id is not null) not valid;

alter table public.attempts
  drop constraint if exists attempts_valid_difficulty,
  add constraint attempts_valid_difficulty
    check (difficulty between 1 and 5) not valid;

alter table public.attempts
  drop constraint if exists attempts_valid_response_time,
  add constraint attempts_valid_response_time
    check (response_ms between 1 and 3600000) not valid;

alter table public.attempts
  drop constraint if exists attempts_required_result,
  add constraint attempts_required_result
    check (
      player_id is not null
      and skill_id is not null
      and question_seed is not null
      and correct is not null
      and prompt_snapshot is not null
      and btrim(prompt_snapshot) <> ''
      and char_length(prompt_snapshot) <= 2000
      and coalesce(xp_awarded, 0) >= 0
    ) not valid;
