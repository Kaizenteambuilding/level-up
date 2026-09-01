const assert = require('node:assert/strict')
const fs = require('node:fs')

const migrations = fs.readdirSync('database/migrations').sort()
const latest = migrations.filter((name) => name.includes('enforce_practice_skill_scope')).at(-1)
assert.ok(latest, 'Practice skill scope migration must exist')
const sql = fs.readFileSync(`database/migrations/${latest}`, 'utf8')

const modes = [
  'daily',
  'math_numbers','math_algebra','math_geometry_data',
  'spanish_reading','spanish_words','spanish_writing',
  'english_listening','english_conversation','english_terminal',
  'science_life','science_investigation','science_observatory',
  'geography_maps','geography_physical','history_ancient',
]
for (const mode of modes) assert.ok(sql.includes(`'${mode}'`), `Server scope must cover ${mode}`)
assert.match(sql, /before insert or update of session_id, skill_id on public\.attempts/i)
assert.match(sql, /levelup_practice_mode_allows_skill\(v_mode, new\.skill_id\)/i)
assert.match(sql, /s\.active = true/i)
assert.match(sql, /cu\.active = true/i)
assert.match(sql, /set search_path = ''/i)

console.log('Practice skill scope audit passed (all persisted modes covered by a server-side attempts guard).')
