const assert = require('node:assert/strict')
const fs = require('node:fs')

const expected = [
  '20260816075245_harden_attempts_and_abandon_sessions.sql',
  '20260816080034_harden_legacy_functions.sql',
  '20260816084409_optimize_rls_and_foreign_keys.sql',
  '20260816085312_preserve_player_level_in_attempt_rpc.sql',
  '20260816085834_harden_setup_parent_family_rpc.sql',
  '20260816094047_validate_attempt_rpc_inputs.sql',
  '20260816094425_server_control_session_completion.sql',
  '20260816094644_mark_unverified_legacy_sessions.sql',
  '20260816095058_prevent_duplicate_session_attempts.sql',
  '20260816095856_require_family_setup_rpc.sql',
  '20260816101058_open_mission_atomically.sql',
  '20260816103309_restrict_table_write_grants.sql',
  '20260816103723_create_player_atomically.sql',
  '20260816103816_unique_player_alias_per_family.sql',
  '20260816104406_bound_attempt_payloads.sql',
  '20260816104452_complete_data_api_least_privilege.sql',
  '20260816111031_expire_abandoned_sessions.sql',
  '20260816141558_secure_future_data_api_defaults.sql',
  '20260816141652_revoke_all_future_public_defaults.sql',
  '20260824072609_add_player_curriculum_plans.sql',
  '20260824080031_persist_game_progression.sql',
  '20260824080127_index_player_inventory_item.sql',
  '20260824082216_add_account_onboarding.sql',
  '20260824093331_persist_game_preferences.sql',
  '20260824095609_add_game_summary_rpc.sql',
  '20260824101316_add_privacy_safe_product_events.sql',
]

const actual = fs.readdirSync('database/migrations').filter((name) => name.endsWith('.sql')).sort()
assert.deepEqual(actual, expected, 'Migration files differ from the applied production history')
assert.equal(new Set(actual.map((name) => name.slice(0, 14))).size, actual.length, 'Migration versions must be unique')

for (const name of actual) {
  assert.match(name, /^\d{14}_[a-z0-9_]+\.sql$/, `Invalid migration filename: ${name}`)
  const source = fs.readFileSync(`database/migrations/${name}`, 'utf8')
  assert.ok(source.includes(`Version: ${name.slice(0, 14)}`), `Migration provenance missing: ${name}`)
  assert.ok(source.trim().length > 100, `Migration unexpectedly empty: ${name}`)
}

console.log(`Migration history audit passed (${actual.length} ordered migrations).`)
