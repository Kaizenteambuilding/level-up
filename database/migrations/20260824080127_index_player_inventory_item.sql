-- Recovered from the applied Supabase migration history.
-- Version: 20260824080127 · index_player_inventory_item

create index if not exists player_inventory_item_id_idx on public.player_inventory(item_id);

