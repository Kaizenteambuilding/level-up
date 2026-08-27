const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

let source = fs.readFileSync('lib/worldZones.ts', 'utf8')
source = source
  .replace(/export type[\s\S]*?\n\nconst comingSoon/, 'const comingSoon')
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
  }
}
assert.equal(worldZoneById('unknown'), undefined)
const preview = fs.readFileSync('components/ZonePreview.tsx', 'utf8')
assert.ok(preview.includes('DISPONIBLE PRÓXIMAMENTE'), 'Preview must use the agreed upcoming label')
assert.ok(preview.includes("district.availability === 'playable'"), 'Preview must render district availability from data')
assert.ok(preview.includes('misión diaria'), 'Preview must distinguish active daily curriculum from future district campaigns')
assert.ok(!preview.includes('EN PREPARACIÓN'), 'Legacy preparation label must not return')
console.log('World zones audit passed.')
