const assert = require('node:assert/strict')
const fs = require('node:fs')

const expectedCanonical = [
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
  '20260824163000_prevent_repeat_daily_missions.sql',
  '20260824164500_commit_xp_on_completion.sql',
  '20260824173000_count_distinct_daily_missions.sql',
  '20260824203000_add_inactive_multi_subject_units.sql',
  '20260826081500_generalize_multi_subject_rpcs.sql',
  '20260826081500_stage_multi_subject_skills.sql',
  '20260826090000_activate_spanish_curriculum.sql',
  '20260826091000_activate_english_curriculum.sql',
  '20260826092000_activate_geography_history_curriculum.sql',
  '20260826093000_activate_biology_geology_curriculum.sql',
  '20260826094000_make_attempt_submit_idempotent.sql',
]

// These are historical source snapshots kept for forensic comparison. They are
// intentionally not canonical Supabase migrations and must never be mistaken
// for 14-digit migration versions.
const expectedLegacySnapshots = [
  '20260816_harden_attempts_and_abandon_sessions.sql',
  '20260816_harden_legacy_functions.sql',
  '20260816_harden_setup_parent_family_rpc.sql',
  '20260816_preserve_player_level_in_attempt_rpc.sql',
]

// Some migrations were applied to production under Supabase-generated versions
// that differ from their immutable repository filenames. Recording the mapping
// here preserves production provenance without renaming already-shipped files.
const productionVersionByFile = new Map([
  ['20260824203000_add_inactive_multi_subject_units.sql', '20260825134449'],
  ['20260826081500_stage_multi_subject_skills.sql', '20260826061632'],
  ['20260826081500_generalize_multi_subject_rpcs.sql', '20260826061826'],
  ['20260826090000_activate_spanish_curriculum.sql', '20260826071038'],
  ['20260826091000_activate_english_curriculum.sql', '20260826074056'],
  ['20260826092000_activate_geography_history_curriculum.sql', '20260826080449'],
  ['20260826093000_activate_biology_geology_curriculum.sql', '20260826081136'],
  ['20260826094000_make_attempt_submit_idempotent.sql', '20260826094517'],
])

const allSql = fs.readdirSync('database/migrations').filter((name) => name.endsWith('.sql')).sort()
const canonical = allSql.filter((name) => /^\d{14}_[a-z0-9_]+\.sql$/.test(name))
const legacySnapshots = allSql.filter((name) => !/^\d{14}_[a-z0-9_]+\.sql$/.test(name))

assert.deepEqual(canonical, expectedCanonical, 'Canonical migration files differ from the recorded repository history')
assert.deepEqual(legacySnapshots, expectedLegacySnapshots, 'Legacy migration snapshots differ from the recorded history')

const productionVersions = canonical.map((name) => productionVersionByFile.get(name) ?? name.slice(0, 14))
assert.equal(new Set(productionVersions).size, canonical.length, 'Recorded production migration versions must be unique')

for (const name of canonical) {
  assert.match(name, /^\d{14}_[a-z0-9_]+\.sql$/, `Invalid canonical migration filename: ${name}`)
  const source = fs.readFileSync(`database/migrations/${name}`, 'utf8')
  assert.ok(source.trim().length > 100, `Migration unexpectedly empty: ${name}`)
}

// The original canonical baseline embedded its version in each SQL file. Keep
// enforcing that provenance for the immutable baseline without rewriting newer
// already-applied migrations merely to add comments.
for (const name of expectedCanonical.slice(0, 26)) {
  const source = fs.readFileSync(`database/migrations/${name}`, 'utf8')
  assert.ok(source.includes(`Version: ${name.slice(0, 14)}`), `Baseline migration provenance missing: ${name}`)
}

for (const name of legacySnapshots) {
  const source = fs.readFileSync(`database/migrations/${name}`, 'utf8')
  assert.ok(source.trim().length > 100, `Legacy migration snapshot unexpectedly empty: ${name}`)
}

console.log(`Migration history audit passed (${canonical.length} canonical migrations, ${legacySnapshots.length} legacy snapshots, ${productionVersionByFile.size} production version mappings).`)
