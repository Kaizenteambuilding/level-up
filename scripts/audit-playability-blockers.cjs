const assert = require('node:assert/strict')
const fs = require('node:fs')

const generator = fs.readFileSync('lib/curriculumQuestionGenerator.ts', 'utf8')
const migration = fs.readFileSync('database/migrations/20260910154900_relax_attempt_integrity_for_playability.sql', 'utf8')

assert.match(generator, /isDegenerateMathQuestion/, 'Math generator needs a degenerate-question guard')
assert.match(generator, /Number\(directRule\[1\]\) === Number\(directRule\[2\]\)/, 'Direct rule-of-three questions must reject identical source and target quantities')
assert.match(generator, /generatePlayableRawQuestion/, 'Curriculum generation must pass through the playability guard')

assert.match(migration, /auth\.uid\(\) is null/, 'Attempt submission must still require authentication')
assert.match(migration, /ss\.player_id = p_player_id/, 'Attempt submission must still enforce session ownership')
assert.doesNotMatch(migration, /Difficulty does not match current skill state/, 'Difficulty heuristics must not block legitimate play')
assert.doesNotMatch(migration, /Answer submitted unrealistically quickly/, 'Timing heuristics must not block legitimate play')
assert.doesNotMatch(migration, /Exact recent prompt reuse is not allowed/, 'Prompt reuse heuristics must not block legitimate play')

console.log('Playability blocker audit passed.')
