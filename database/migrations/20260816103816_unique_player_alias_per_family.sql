-- Recovered from the applied Supabase migration history.
-- Version: 20260816103816 · unique_player_alias_per_family

create unique index if not exists players_family_alias_unique_idx
on public.players (family_id, lower(btrim(alias)))
where family_id is not null;

