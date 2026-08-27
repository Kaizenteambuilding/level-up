const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

let source = fs.readFileSync('lib/worldZones.ts', 'utf8')
source = source
  .replace(/export type[\s\S]*?\n\nconst comingSoon/, 'const comingSoon')
  .replace(/: WorldDistrict/g, '')
  .replace(/: WorldZone\[\]/, '')
  .replace(/export function/g, 'function')
  .replace(/value: string/, 'value') + '\nmodule.exports={WORLD_ZONES,worldZoneById}'
const box = { module: { exports: {} } }
vm.runInNewContext(source, box)
const { WORLD_ZONES, worldZoneById } = box.module.exports
assert.deepEqual(Array.from(WORLD_ZONES, (zone) => zone.id), ['language', 'english', 'science', 'creative'])
for (const zone of WORLD_ZONES) {
  assert.equal(zone.districts.length, 3, `${zone.id} must have three districts`)
  assert.equal(worldZoneById(zone.id).name, zone.name)
  for (const district of zone.districts) {
    assert.ok(['coming_soon', 'playable'].includes(district.availability), `${zone.id}/${district.name} must declare availability`)
    if (district.availability === 'playable') assert.ok(district.href?.startsWith('/'), `${zone.id}/${district.name} playable district must have an internal href`)
  }
}
assert.equal(worldZoneById('unknown'), undefined)
const english = worldZoneById('english')
assert.equal(english.districts[2].name, 'Terminal de palabras')
assert.equal(english.districts[2].availability, 'playable')
assert.equal(english.districts[2].href, '/zone/english/terminal')
assert.equal(english.districts.filter((district) => district.availability === 'playable').length, 1)

const preview = fs.readFileSync('components/ZonePreview.tsx', 'utf8')
assert.ok(preview.includes('DISPONIBLE PRÓXIMAMENTE'), 'Preview must use the agreed upcoming label')
assert.ok(preview.includes("district.availability === 'playable'"), 'Preview must render district availability from data')
assert.ok(preview.includes('ENTRAR AL DISTRITO'), 'Playable districts must expose an entry action')
assert.ok(!preview.includes('EN PREPARACIÓN'), 'Legacy preparation label must not return')
const terminal = fs.readFileSync('components/EnglishTerminalSession.tsx', 'utf8')
assert.ok(terminal.includes("const MODE = 'english_terminal'"), 'English terminal must use its bounded practice mode')
assert.ok(terminal.includes("p_diagnostic_tags: [...question.tags, 'english_terminal']"), 'English terminal attempts must be identifiable')
assert.ok(terminal.includes("p_session_id: sessionId"), 'English terminal attempts must persist in the opened practice session')
assert.ok(terminal.includes('complete_levelup_session'), 'English terminal must close through the authoritative completion RPC')
console.log('World zones audit passed.')
