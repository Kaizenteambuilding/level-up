const fs = require('node:fs')
const ts = require('typescript')

function loadTypescriptModule(path) {
  const source = fs.readFileSync(path, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const loaded = { exports: {} }
  new Function('exports', 'module', 'require', compiled)(loaded.exports, loaded, require)
  return loaded.exports
}

const plan = loadTypescriptModule('lib/curriculumPlan.ts')
const { chooseAdaptiveSkill } = loadTypescriptModule('lib/adaptiveEngine.ts')
const failures = []

const dateCases = [
  ['2026-09-15', 1],
  ['2026-08-24', 1],
  ['2027-01-15', 2],
  ['2027-04-15', 3],
]
for (const [date, expected] of dateCases) {
  if (plan.automaticTerm(new Date(`${date}T12:00:00Z`)) !== expected) failures.push(`term:${date}`)
}

const automatic = plan.effectiveCurriculumPlan('player', null, new Date('2026-10-10T12:00:00Z'))
if (automatic.availableUnitIds.join(',') !== 'M01,M02,M03,M04,M05') failures.push('first_term_gate')
if (automatic.focusUnitIds.length !== 5) failures.push('automatic_focus')

const manual = plan.effectiveCurriculumPlan('player', {
  player_id: 'player', subject_id: 'math', academic_year_start: 2026,
  pacing_mode: 'manual', current_term: 2, focus_unit_ids: ['M07'],
})
if (manual.availableUnitIds.includes('M10') || manual.availableUnitIds.includes('M11') || !manual.availableUnitIds.includes('M07')) failures.push('manual_gate')
if (manual.focusUnitIds.join(',') !== 'M07') failures.push('manual_focus')

const skills = plan.MATH_CURRICULUM_UNITS.map((unit_id, index) => ({ id: `S${index + 1}`, unit_id }))
const pickedUnits = []
for (let index = 0; index < 10; index += 1) {
  const picked = chooseAdaptiveSkill({
    skills: skills.slice(0, 10), states: {}, recentSkillIds: [], recentUnitIds: [],
    focusUnitIds: ['M06', 'M07', 'M08', 'M09', 'M10'],
    reviewUnitIds: ['M01', 'M02', 'M03', 'M04', 'M05'],
    seed: 12345, questionIndex: index, nowMs: Date.UTC(2026, 9, 10),
  })
  pickedUnits.push(picked?.unit_id)
}
if (pickedUnits.slice(0, 7).some((unit) => !['M06', 'M07', 'M08', 'M09', 'M10'].includes(unit))) failures.push('focus_ratio')
if (!['M01', 'M02', 'M03', 'M04', 'M05'].includes(pickedUnits[7])) failures.push('review_slot')
if (pickedUnits.some((unit) => Number(unit?.slice(1)) > 10)) failures.push('locked_content')

console.log(JSON.stringify({ dateCases, automatic, manual, pickedUnits, failures }, null, 2))
if (failures.length) process.exitCode = 1
