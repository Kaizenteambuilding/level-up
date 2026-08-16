const fs = require('node:fs')
const ts = require('typescript')

const source = fs.readFileSync('lib/curriculumInsights.ts', 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
const loaded = { exports: {} }
new Function('exports', 'module', 'require', compiled)(loaded.exports, loaded, require)
const { buildUnitInsights } = loaded.exports

const curriculumSkills = [
  { id: 'A1', name: 'A1', unit_id: 'A' },
  { id: 'A2', name: 'A2', unit_id: 'A' },
  { id: 'A3', name: 'A3', unit_id: 'A' },
  { id: 'B1', name: 'B1', unit_id: 'B' },
  { id: 'C1', name: 'C1', unit_id: 'C' },
]
const states = [
  { skill_id: 'A1', mastery: 80, confidence: 80, difficulty: 3, priority: 20, skills: null },
  { skill_id: 'A2', mastery: 70, confidence: 70, difficulty: 2, priority: 30, skills: null },
  { skill_id: 'A3', mastery: 75, confidence: 75, difficulty: 2, priority: 25, skills: null },
  { skill_id: 'B1', mastery: 40, confidence: 40, difficulty: 1, priority: 90, skills: null },
]
const evidence = {
  attempts: { A1: 4, A2: 4, A3: 4, B1: 2 },
  correct: { A1: 4, A2: 3, A3: 3, B1: 0 },
}
const insights = buildUnitInsights({
  curriculumSkills,
  states,
  evidence,
  unitNames: { A: 'Unidad A', B: 'Unidad B', C: 'Unidad C' },
  unitOrder: ['A', 'B', 'C'],
})
const failures = []
if (insights[0].status !== 'solid' || insights[0].accuracy !== 83 || insights[0].practicedSkills !== 3) failures.push('solid_unit')
if (insights[1].status !== 'initial' || insights[1].accuracy !== 0) failures.push('initial_precedes_diagnosis')
if (insights[2].status !== 'unexplored' || insights[2].accuracy !== null) failures.push('unexplored_unit')
if (insights.length !== 3) failures.push('unit_coverage')

console.log(JSON.stringify({
  scenarios: insights.map(({ unitId, status, accuracy }) => ({ unitId, status, accuracy })),
  failures,
}, null, 2))
if (failures.length) process.exitCode = 1
