create extension if not exists pg_cron with schema pg_catalog;

-- Keep historical session state truthful even when a player never returns to
-- open another mission. Reusing the job name makes the migration idempotent.
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
