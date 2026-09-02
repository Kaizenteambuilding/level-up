const assert = require('node:assert/strict')
const fs = require('node:fs')

const sql = fs.readFileSync('database/migrations/20260902085000_null_safe_session_modes.sql', 'utf8')

assert.ok(sql.includes('if p_mode is null or p_mode not in ('), 'Practice RPC must reject a NULL mode explicitly')
assert.ok(sql.includes('mode is distinct from p_mode'), 'Practice switching must abandon NULL/other open modes safely')
assert.ok(sql.includes("mode is distinct from 'daily'"), 'Daily switching must abandon NULL/other open modes safely')
assert.equal((sql.match(/pg_advisory_xact_lock/g) || []).length, 2, 'Both session openers must preserve the per-player advisory lock')
assert.equal((sql.match(/security definer/g) || []).length, 2, 'Both session openers must remain SECURITY DEFINER')
assert.equal((sql.match(/set search_path = ''/g) || []).length, 2, 'Both session openers must retain an empty search_path')

console.log('Null-safe session mode audit passed.')
