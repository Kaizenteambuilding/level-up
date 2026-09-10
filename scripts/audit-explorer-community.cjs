const assert = require('node:assert/strict')
const fs = require('node:fs')

const migration = fs.readFileSync('database/migrations/20260910032900_add_explorer_public_profiles.sql', 'utf8')
const component = fs.readFileSync('components/ExplorersDirectory.tsx', 'utf8')
const playerPage = fs.readFileSync('app/player/page.tsx', 'utf8')

assert.match(migration, /create table public\.player_public_profiles/i)
assert.match(migration, /alter table public\.player_public_profiles enable row level security/i)
assert.match(migration, /grant select on table public\.player_public_profiles to authenticated/i)
assert.doesNotMatch(migration, /grant\s+(insert|update|delete|all).*player_public_profiles.*authenticated/i)
assert.match(migration, /revoke all on function private\.refresh_player_public_profile\(uuid\) from public, anon, authenticated/i)
assert.match(migration, /set search_path = ''/i)

for (const forbidden of ['correct', 'mastery', 'confidence', 'daily_target_minutes', 'coins', 'family_id', 'parent_id', 'email']) {
  assert.doesNotMatch(component, new RegExp(`\\b${forbidden}\\b`, 'i'), `Explorer UI must not expose ${forbidden}`)
}

assert.match(component, /player_public_profiles/)
assert.match(component, /order\('alias'/)
assert.match(component, /No hay rankings, chat, retos entre jugadores ni datos académicos/)
assert.doesNotMatch(component, /\.order\('(level|level_progress_percent|completed_expeditions)'/)
assert.match(playerPage, /href="\/explorers"/)

console.log('Explorer community privacy audit passed.')
