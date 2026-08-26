const fs = require('node:fs')

const source = fs.readFileSync('components/ParentDashboard.tsx', 'utf8')
const failures = []

const required = [
  "skills!inner(name,unit_id,subject_id)",
  "select('id,name,unit_id,subject_id')",
  "select('id,name,subject_id,sort_order')",
  'ACTIVE_SUBJECT_IDS.map',
  'buildUnitInsights',
  'subjectDefinition',
  "p_subject_id: 'math'",
  'MATH_CURRICULUM_UNITS',
]

for (const marker of required) {
  if (!source.includes(marker)) failures.push(`missing:${marker}`)
}

const forbidden = [
  ".in('skills.unit_id', ACTIVE_CURRICULUM_UNITS)",
  ".in('unit_id', ACTIVE_CURRICULUM_UNITS)",
  'const ACTIVE_CURRICULUM_UNITS = [...MATH_CURRICULUM_UNITS]',
]

for (const marker of forbidden) {
  if (source.includes(marker)) failures.push(`math_only_filter:${marker}`)
}

console.log(JSON.stringify({
  dashboard: 'components/ParentDashboard.tsx',
  subjects: 5,
  failures,
}, null, 2))

if (failures.length) process.exitCode = 1
