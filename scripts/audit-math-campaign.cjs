const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
let source = fs.readFileSync('lib/mathCampaign.ts', 'utf8')
source = source.replace(/export type[^\n]+\n/g, '').replace(/export function/g, 'function').replace(/\(districts: DistrictCampaignInput\[\]\)/g, '(districts)').replace(/\(districts: DistrictCampaignState\[\]\)/g, '(districts)').replace(/: DistrictCampaignState\[\]/g, '') + '\nmodule.exports={buildMathCampaign,nextCampaignDistrict}'
const box = { module: { exports: {} }, Math }
vm.runInNewContext(source, box)
const { buildMathCampaign, nextCampaignDistrict } = box.module.exports
const states = buildMathCampaign([
  { id: 'new', name: 'Nuevo', totalAttempts: 0, practicedSkills: 0, totalSkills: 6, accuracy: null },
  { id: 'active', name: 'Activo', totalAttempts: 12, practicedSkills: 2, totalSkills: 6, accuracy: 60 },
  { id: 'secured', name: 'Seguro', totalAttempts: 30, practicedSkills: 4, totalSkills: 6, accuracy: 75 },
])
assert.deepEqual(Array.from(states, (state) => state.status), ['unexplored', 'active', 'secured'])
assert.equal(states[0].progress, 0)
assert.equal(states[2].progress, 100)
assert.equal(nextCampaignDistrict(states).id, 'active')
assert.ok(states.every((state) => state.progress >= 0 && state.progress <= 100))
console.log('Math campaign audit passed.')
