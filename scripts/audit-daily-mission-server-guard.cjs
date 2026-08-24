const assert = require('node:assert/strict')
const fs = require('node:fs')

const migration = fs.readFileSync('database/migrations/20260824163000_prevent_repeat_daily_missions.sql', 'utf8')

assert.ok(migration.includes("at time zone 'Europe/Madrid'"), 'daily boundary must use the product timezone')
assert.ok(migration.includes("raise exception 'Daily mission already completed'"), 'opening a second daily mission must fail server-side')
assert.ok(migration.includes('perform pg_catalog.pg_advisory_xact_lock'), 'mission opening must remain serialized per player')
assert.ok(migration.includes('create trigger prevent_repeat_daily_completion'), 'completion must have a database-level backstop')
assert.ok(migration.includes('before insert or update of completed, phase, completed_at, ended_at'), 'guard must run before completion is persisted')
assert.ok(migration.includes('ss.id <> new.id'), 'completion guard must exclude the current session')

console.log('Daily mission server guard audit passed.')
