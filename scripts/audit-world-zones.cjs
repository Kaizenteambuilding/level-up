const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

let source = fs.readFileSync('lib/worldZones.ts', 'utf8')
source = source
  .replace(/export type[\s\S]*?\n\nconst playable/, 'const playable')
  .replace(/: WorldDistrict/g, '')
  .replace(/: WorldZone\[\]/, '')
  .replace(/export function/g, 'function')
  .replace(/value: string/, 'value') + '\nmodule.exports={WORLD_ZONES,worldZoneById}'
const box = { module: { exports: {} } }
vm.runInNewContext(source, box)
const { WORLD_ZONES, worldZoneById } = box.module.exports

const expectedZones = ['math', 'language', 'english', 'science', 'geography']
const expectedModes = [
  'math_numbers', 'math_algebra', 'math_geometry_data',
  'spanish_reading', 'spanish_words', 'spanish_writing',
  'english_listening', 'english_conversation', 'english_terminal',
  'science_life', 'science_investigation', 'science_observatory',
  'geography_maps', 'geography_physical', 'history_ancient',
]

assert.deepEqual(Array.from(WORLD_ZONES, (zone) => zone.id), expectedZones)
assert.equal(WORLD_ZONES.length, 5, 'Level Up must expose five subject worlds')
assert.equal(WORLD_ZONES.flatMap((zone) => zone.districts).length, 15, 'Level Up must expose fifteen districts')

for (const zone of WORLD_ZONES) {
  assert.equal(zone.districts.length, 3, `${zone.id} must have three districts`)
  assert.equal(worldZoneById(zone.id).name, zone.name)
  for (const district of zone.districts) {
    assert.equal(district.availability, 'playable', `${zone.id}/${district.name} must be playable`)
    assert.ok(district.href?.startsWith(`/zone/${zone.id}/`), `${zone.id}/${district.name} must have a route inside its world`)
    assert.ok(district.mode, `${zone.id}/${district.name} must declare its persisted practice mode`)
  }
}
assert.equal(worldZoneById('unknown'), undefined)
assert.deepEqual(Array.from(WORLD_ZONES.flatMap((zone) => zone.districts), (district) => district.mode), expectedModes)
assert.equal(new Set(WORLD_ZONES.flatMap((zone) => zone.districts).map((district) => district.mode)).size, 15, 'District modes must be unique')
assert.equal(new Set(WORLD_ZONES.flatMap((zone) => zone.districts).map((district) => district.href)).size, 15, 'District routes must be unique')

const guard = fs.readFileSync('components/MissionGuard.tsx', 'utf8')
for (const mode of expectedModes) assert.ok(guard.includes(`mode === '${mode}'`), `Mission guard must route ${mode}`)

const migrations = fs.readdirSync('database/migrations').sort().map((file) => fs.readFileSync(`database/migrations/${file}`, 'utf8')).join('\n')
for (const mode of expectedModes) assert.ok(migrations.includes(`'${mode}'`), `Database migrations must allow practice mode ${mode}`)

console.log('World zones audit passed (5 worlds, 15 playable districts, routes and persisted modes aligned).')
