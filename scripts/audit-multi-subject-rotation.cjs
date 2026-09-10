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

const { orderedActiveSubjects, subjectForQuestion } = loadTypescriptModule('lib/dailySubjectRotation.ts')

const subjectIds = ['math', 'spanish', 'english', 'geography_history', 'biology_geology']
const plan = (subjectId) => ({
  subjectId,
  availableUnitIds: [`${subjectId}:unit`],
  focusUnitIds: [],
  reviewUnitIds: [],
})

const failures = []
const fullPlans = subjectIds.map(plan)

if (orderedActiveSubjects(fullPlans).map((item) => item.subjectId).join(',') !== subjectIds.join(',')) {
  failures.push('canonical_subject_order')
}

const starts = new Set()
for (let seed = 0; seed < 100; seed++) {
  const sequence = Array.from({ length: 10 }, (_, index) => subjectForQuestion(fullPlans, index, seed)?.subjectId)
  const counts = Object.fromEntries(subjectIds.map((subjectId) => [subjectId, sequence.filter((id) => id === subjectId).length]))
  if (Object.values(counts).some((count) => count !== 2)) failures.push(`full_rotation_unbalanced:${seed}:${JSON.stringify(counts)}`)
  if (new Set(sequence).size !== 5) failures.push(`full_rotation_missing_subject:${seed}`)
  if (sequence.some((id) => !subjectIds.includes(id))) failures.push(`full_rotation_unknown_subject:${seed}`)
  starts.add(sequence[0])
}
if (starts.size !== 5) failures.push(`start_subject_diversity:${starts.size}`)

for (const activeCount of [2, 3, 4]) {
  const plans = fullPlans.slice(0, activeCount)
  for (let seed = 0; seed < 50; seed++) {
    const sequence = Array.from({ length: 10 }, (_, index) => subjectForQuestion(plans, index, seed)?.subjectId)
    const counts = plans.map(({ subjectId }) => sequence.filter((id) => id === subjectId).length)
    const min = Math.min(...counts)
    const max = Math.max(...counts)
    if (max - min > 1) failures.push(`partial_rotation_unbalanced:${activeCount}:${seed}:${counts.join(',')}`)
  }
}

const unavailable = fullPlans.map((item) => ({ ...item }))
unavailable[2].availableUnitIds = []
const filtered = orderedActiveSubjects(unavailable).map((item) => item.subjectId)
if (filtered.includes('english') || filtered.length !== 4) failures.push('unavailable_subject_not_filtered')

console.log(JSON.stringify({
  sessionLength: 10,
  activeSubjects: subjectIds.length,
  expectedPerSubject: 2,
  seedsChecked: 100,
  startSubjectsObserved: Array.from(starts).sort(),
  partialActiveCountsChecked: [2, 3, 4],
  failures,
}, null, 2))

if (failures.length) process.exitCode = 1
