-- Recovered from the applied Supabase migration history.
-- Version: 20260816111031 · expire_abandoned_sessions

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'levelup-expire-abandoned-sessions',
  '17 * * * *',
  $cron$
    update public.study_sessions
    set ended_at = now(),
        phase = 'abandoned'
    where completed = false
      and ended_at is null
      and started_at < now() - interval '24 hours';
  $cron$
);

