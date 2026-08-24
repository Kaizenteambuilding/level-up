const assert = require('node:assert/strict')
const fs = require('node:fs')

const migration = fs.readFileSync('database/migrations/20260824164500_commit_xp_on_completion.sql', 'utf8')

const attemptStart = migration.indexOf('create or replace function public.submit_levelup_attempt')
const completionStart = migration.indexOf('create or replace function public.complete_levelup_session')
const attempt = migration.slice(attemptStart, completionStart)
const completion = migration.slice(completionStart)

assert.ok(attempt.includes("'xp',v_current_xp"), 'attempt RPC must report persisted XP without committing provisional XP')
assert.ok(!attempt.includes('set xp = coalesce(xp, 0) + v_xp_awarded'), 'attempt RPC must not increment player XP')
assert.ok(attempt.includes('xp_awarded'), 'attempts must retain provisional XP for the mission total')
assert.ok(completion.includes('v_total_xp := v_total_xp + v_session_xp'), 'completion must commit the mission XP exactly once')
assert.ok(completion.includes('if coalesce(v_completed,false) then'), 'completion must remain idempotent')
assert.ok(completion.includes('if v_attempt_count <> 10'), 'XP commit must require exactly 10 attempts')
assert.ok(completion.includes('for update'), 'completion must lock authoritative rows while committing rewards')

console.log('Mission XP commit audit passed.')
