-- Keep foreign-key joins and cascades efficient as practice history grows.
create index if not exists attempts_player_id_idx on public.attempts (player_id);
create index if not exists attempts_session_id_idx on public.attempts (session_id);
create index if not exists attempts_skill_id_idx on public.attempts (skill_id);
create index if not exists exams_player_id_idx on public.exams (player_id);
create index if not exists parent_profiles_family_id_idx on public.parent_profiles (family_id);
create index if not exists player_skill_state_skill_id_idx on public.player_skill_state (skill_id);
create index if not exists players_family_id_idx on public.players (family_id);

-- Cache auth.uid() once per statement and restrict application policies
-- explicitly to signed-in users.
alter policy "parent can read family attempts" on public.attempts to authenticated
using (player_id in (select p.id from public.players p join public.parent_profiles pp on pp.family_id = p.family_id where pp.id = (select auth.uid())));

alter policy "parent can create family" on public.families to authenticated
with check ((select auth.uid()) is not null);

alter policy "parent can read own family" on public.families to authenticated
using (id in (select pp.family_id from public.parent_profiles pp where pp.id = (select auth.uid())));

alter policy "parent can insert own profile" on public.parent_profiles to authenticated
with check (id = (select auth.uid()));

alter policy "parent can read own profile" on public.parent_profiles to authenticated
using (id = (select auth.uid()));

alter policy "parent can update own profile" on public.parent_profiles to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

alter policy "parent can read family skill state" on public.player_skill_state to authenticated
using (player_id in (select p.id from public.players p join public.parent_profiles pp on pp.family_id = p.family_id where pp.id = (select auth.uid())));

alter policy "parent can create family players" on public.players to authenticated
with check (family_id in (select pp.family_id from public.parent_profiles pp where pp.id = (select auth.uid())));

alter policy "parent can read family players" on public.players to authenticated
using (family_id in (select pp.family_id from public.parent_profiles pp where pp.id = (select auth.uid())));

alter policy "parent can update family players" on public.players to authenticated
using (family_id in (select pp.family_id from public.parent_profiles pp where pp.id = (select auth.uid())))
with check (family_id in (select pp.family_id from public.parent_profiles pp where pp.id = (select auth.uid())));

alter policy "parent can create family sessions" on public.study_sessions to authenticated
with check (player_id in (select p.id from public.players p join public.parent_profiles pp on pp.family_id = p.family_id where pp.id = (select auth.uid())));

alter policy "parent can read family sessions" on public.study_sessions to authenticated
using (player_id in (select p.id from public.players p join public.parent_profiles pp on pp.family_id = p.family_id where pp.id = (select auth.uid())));

alter policy "parent can update family sessions" on public.study_sessions to authenticated
using (player_id in (select p.id from public.players p join public.parent_profiles pp on pp.family_id = p.family_id where pp.id = (select auth.uid())))
with check (player_id in (select p.id from public.players p join public.parent_profiles pp on pp.family_id = p.family_id where pp.id = (select auth.uid())));

-- The legacy exams table is not part of the current product. Keep its
-- existing deny-by-default behavior explicit so future grants stay safe.
create policy "exams are intentionally unavailable" on public.exams
for all to anon, authenticated using (false) with check (false);
