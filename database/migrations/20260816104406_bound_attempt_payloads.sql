-- Recovered from the applied Supabase migration history.
-- Version: 20260816104406 · bound_attempt_payloads

alter table public.attempts
  add constraint attempts_safe_question_seed
  check (question_seed between 0 and 9007199254740991),
  add constraint attempts_bounded_diagnostic_tags
  check (
    coalesce(cardinality(diagnostic_tags), 0) <= 20
    and octet_length(array_to_string(coalesce(diagnostic_tags, '{}'::text[]), '')) <= 6400
  );

