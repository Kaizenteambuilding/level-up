const assert = require('node:assert/strict')
const fs = require('node:fs')

const migration = fs.readFileSync(
  'database/migrations/20260826134908_harden_internal_security_definer_triggers.sql',
  'utf8',
)

assert.match(
  migration,
  /alter function public\.abandon_expired_levelup_sessions_on_insert\(\) set search_path = '';/,
  'Internal abandon trigger must use an empty search_path',
)

for (const fn of [
  'abandon_expired_levelup_sessions_on_insert',
  'prevent_repeat_daily_completion',
]) {
  assert.match(
    migration,
    new RegExp(`revoke execute on function public\\.${fn}\\(\\)\\s+from public, anon, authenticated, service_role;`),
    `${fn} must not be directly executable by API roles`,
  )
}

console.log('SECURITY DEFINER trigger hardening audit passed.')
