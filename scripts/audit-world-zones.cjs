const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

let source = fs.readFileSync('lib/worldZones.ts', 'utf8')
source = source.replace(/export type[\s\S]*?\n\nexport const/, 'const').replace(/: WorldZone\[\]/, '').replace(/export function/g, 'function').replace(/value: string/, 'value') + '\nmodule.exports={WORLD_ZONES,worldZoneById}'
const box = { module: { exports: {} } }
vm.runInNewContext(source, box)
const { WORLD_ZONES, worldZoneById } = box.module.exports
assert.deepEqual(Array.from(WORLD_ZONES, (zone) => zone.id), ['language', 'english', 'science', 'creative'])
for (const zone of WORLD_ZONES) {
  assert.equal(zone.districts.length, 3, `${zone.id} must have three districts`)
  assert.equal(worldZoneById(zone.id).name, zone.name)
}
assert.equal(worldZoneById('unknown'), undefined)
const preview = fs.readFileSync('components/ZonePreview.tsx', 'utf8')
assert.ok(preview.includes('No ganarás XP aquí'), 'Preview must not imply active academic progression')
assert.ok(preview.includes('contenido curricular esté validado'), 'Preview must explain activation criteria')
console.log('World zones audit passed.')
