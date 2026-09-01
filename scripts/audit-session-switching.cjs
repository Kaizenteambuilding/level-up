const assert = require('node:assert/strict')
const fs = require('node:fs')

const files = fs.readdirSync('database/migrations').sort()
const name = files.find((file) => file.includes('serialize_session_switching'))
assert.ok(name, 'Session switching migration must exist')
const sql = fs.readFileSync(`database/migrations/${name}`, 'utf8')

assert.ok(sql.includes('function public.open_levelup_session'), 'Daily open function must be redefined')
assert.ok(sql.includes('function public.open_levelup_practice_session'), 'Practice open function must be redefined')
assert.ok(sql.includes("pg_catalog.hashtextextended(p_player_id::text, 0)"), 'Open functions must lock by player')
assert.ok(sql.includes("mode <> 'daily'"), 'Daily open must abandon another active mode')
assert.ok(sql.includes('mode<>p_mode') || sql.includes('mode <> p_mode'), 'Practice open must abandon another active mode')
assert.ok(sql.includes("phase='abandoned'") || sql.includes("phase = 'abandoned'"), 'Switching must mark the old session abandoned')

console.log('Session switching audit passed.')
