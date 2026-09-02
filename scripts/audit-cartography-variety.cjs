const assert = require('node:assert/strict')
const fs = require('node:fs')

const generator = fs.readFileSync('lib/cartographyQuestionGenerators.ts', 'utf8')
const router = fs.readFileSync('lib/curriculumQuestionGenerator.ts', 'utf8')
const session = fs.readFileSync('components/GeographyMapsSession.tsx', 'utf8')

for (const skillId of ['G01S01', 'G01S02', 'G01S03', 'G01S04']) {
  const block = generator.match(new RegExp(`${skillId}: \\[([\\s\\S]*?)\\n  \\],`))
  assert.ok(block, `Missing cartography bank for ${skillId}`)
  const promptCount = (block[1].match(/prompt:/g) || []).length
  assert.ok(promptCount >= 8, `${skillId} needs at least 8 distinct question structures; found ${promptCount}`)
}

assert.match(router, /skill\.id\.startsWith\('G01'\)/, 'G01 must route through the dedicated cartography generator')
assert.match(router, /generateCartographyQuestion/, 'Curriculum router must call the cartography generator')
assert.match(session, /recentTemplates\.current/, 'Cartography session must retain recent prompt templates')
assert.match(session, /attempt < 20/, 'Cartography session must retry generation when a recent template repeats')
assert.match(session, /HISTORY = 80/, 'Cartography repeat protection must include cross-session history')

console.log('Cartography variety audit passed: 4 skills × >=8 structures plus recent-history deduplication.')
