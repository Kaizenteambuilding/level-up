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
  '20260826134908_harden_internal_security_definer_triggers.sql',
  '20260826200500_restore_xp_commit_on_completion.sql',
  '20260827053500_open_english_terminal_practice.sql',
  '20260827072500_open_english_conversation_practice.sql',
  '20260827103500_open_english_listening_practice.sql',
  '20260827124200_open_spanish_reading_practice.sql',
  '20260827134300_open_spanish_words_practice.sql',
  '20260827185700_open_spanish_writing_practice.sql',
  '20260830072941_allow_math_practice_modes.sql',
  '20260901093000_enforce_practice_skill_scope.sql',
  '20260901123500_serialize_session_switching.sql',
  '20260901141000_fix_game_summary_metrics.sql',
  '20260902085000_null_safe_session_modes.sql',
  '20260902093000_restrict_practice_scope_helper.sql',
  '20260902123000_localize_geography_skill_names.sql',
]

const expectedLegacySnapshots = [
  '20260816_harden_attempts_and_abandon_sessions.sql',
  '20260816_harden_legacy_functions.sql',
  '20260816_harden_setup_parent_family_rpc.sql',
  '20260816_preserve_player_level_in_attempt_rpc.sql',
]

const manifest = JSON.parse(fs.readFileSync('database/production-migrations.json', 'utf8'))
const allSql = fs.readdirSync('database/migrations').filter((name) => name.endsWith('.sql')).sort()
const canonical = allSql.filter((name) => /^\d{14}_[a-z0-9_]+\.sql$/.test(name))
const legacySnapshots = allSql.filter((name) => !/^\d{14}_[a-z0-9_]+\.sql$/.test(name))

assert.deepEqual(canonical, expectedCanonical, 'Canonical migration files differ from the recorded repository history')
assert.deepEqual(legacySnapshots, expectedLegacySnapshots, 'Legacy migration snapshots differ from the recorded history')
assert.equal(manifest.projectRef, 'dtyqebdkgayxufffidef', 'Production migration manifest points to the wrong project')
assert.match(manifest.capturedAt, /^\d{4}-\d{2}-\d{2}$/, 'Production migration manifest capturedAt must be an ISO date')

const productionEntries = manifest.production
assert.ok(Array.isArray(productionEntries) && productionEntries.length > 0, 'Production migration manifest is empty')
const productionVersionToName = new Map(productionEntries)
assert.equal(productionVersionToName.size, productionEntries.length, 'Production migration versions must be unique')
for (const [version, name] of productionEntries) {
  assert.match(version, /^\d{14}$/, `Invalid production migration version: ${version}`)
  assert.match(name, /^[a-z0-9_]+$/, `Invalid production migration name: ${name}`)
}

const repositoryToProduction = manifest.repositoryToProduction ?? {}
assert.deepEqual(Object.keys(repositoryToProduction).sort(), canonical, 'Every canonical repository migration must have explicit production provenance')

const mappedProductionVersions = []
for (const name of canonical) {
  assert.match(name, /^\d{14}_[a-z0-9_]+\.sql$/, `Invalid canonical migration filename: ${name}`)
  const source = fs.readFileSync(`database/migrations/${name}`, 'utf8')
  assert.ok(source.trim().length > 100, `Migration unexpectedly empty: ${name}`)
  const productionVersion = repositoryToProduction[name]
  if (productionVersion === null) continue
  assert.match(productionVersion, /^\d{14}$/, `Invalid production mapping for ${name}`)
  assert.ok(productionVersionToName.has(productionVersion), `Production mapping for ${name} points to missing version ${productionVersion}`)
  mappedProductionVersions.push(productionVersion)
}

assert.equal(new Set(mappedProductionVersions).size, mappedProductionVersions.length, 'Repository migrations must not map to the same production migration twice')

const notDeployed = manifest.notDeployed ?? {}
for (const [name, details] of Object.entries(notDeployed)) {
  assert.ok(canonical.includes(name), `notDeployed references unknown migration ${name}`)
  assert.equal(repositoryToProduction[name], null, `notDeployed migration ${name} must map to null`)
  assert.ok(details && typeof details.reason === 'string' && details.reason.length > 10, `notDeployed migration ${name} needs a reason`)
}

console.log('Migration history audit passed.')
