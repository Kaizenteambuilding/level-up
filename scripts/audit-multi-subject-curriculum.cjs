const fs = require('node:fs')
const ts = require('typescript')

function loadTypescriptModule(path, extra = {}) {
  const source = fs.readFileSync(path, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const loaded = { exports: {} }
  const localRequire = (id) => extra[id] ?? require(id)
  new Function('exports', 'module', 'require', compiled)(loaded.exports, loaded, localRequire)
  return loaded.exports
}

const subjects = loadTypescriptModule('lib/subjects.ts')
const curricula = loadTypescriptModule('lib/subjectCurricula.ts', { './subjects': subjects })
const expectedSubjects = ['spanish', 'english', 'geography_history', 'biology_geology']
const ids = new Set()
const failures = []

for (const subjectId of expectedSubjects) {
  const units = curricula.SUBJECT_CURRICULA[subjectId] ?? []
  if (units.length !== 6) failures.push(`${subjectId}:unit_count`)
  let skillCount = 0
  for (const unit of units) {
    if (unit.subjectId !== subjectId) failures.push(`${unit.id}:subject_mismatch`)
    if (ids.has(unit.id)) failures.push(`${unit.id}:duplicate`)
    ids.add(unit.id)
    if (!Array.isArray(unit.skills) || unit.skills.length !== 4) failures.push(`${unit.id}:skill_count`)
    for (const skill of unit.skills ?? []) {
      skillCount += 1
      if (ids.has(skill.id)) failures.push(`${skill.id}:duplicate`)
      ids.add(skill.id)
      if (!skill.generatorKey) failures.push(`${skill.id}:generator_key`)
      if (!skill.goal) failures.push(`${skill.id}:goal`)
    }
  }
  if (skillCount !== 24) failures.push(`${subjectId}:total_skills`)
}

const knownSkillIds = new Set(
  expectedSubjects.flatMap((subjectId) => curricula.SUBJECT_CURRICULA[subjectId])
    .flatMap((unit) => unit.skills)
    .map((skill) => skill.id)
)
for (const subjectId of expectedSubjects) {
  for (const unit of curricula.SUBJECT_CURRICULA[subjectId]) {
    for (const skill of unit.skills) {
      for (const prereq of skill.prerequisites ?? []) {
        if (!knownSkillIds.has(prereq)) failures.push(`${skill.id}:unknown_prerequisite:${prereq}`)
        if (prereq[0] !== skill.id[0]) failures.push(`${skill.id}:cross_subject_prerequisite:${prereq}`)
      }
    }
  }
}

console.log(JSON.stringify({
  subjects: expectedSubjects.map((subjectId) => ({
    subjectId,
    units: curricula.SUBJECT_CURRICULA[subjectId].length,
    skills: curricula.curriculumSkillCount(subjectId),
  })),
  failures,
}, null, 2))
if (failures.length) process.exitCode = 1
