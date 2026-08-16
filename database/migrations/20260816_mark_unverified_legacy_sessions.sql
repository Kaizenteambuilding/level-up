update public.study_sessions ss
set phase = 'legacy_unverified'
where ss.completed = true
  and not exists (
    select 1
    from public.attempts a
    where a.session_id = ss.id
  );
