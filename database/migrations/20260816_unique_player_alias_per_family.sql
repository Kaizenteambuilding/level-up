-- Two visually identical aliases make player selection ambiguous. Normalize
-- surrounding whitespace and case while keeping the displayed alias intact.
create unique index if not exists players_family_alias_unique_idx
on public.players (family_id, lower(btrim(alias)))
where family_id is not null;
