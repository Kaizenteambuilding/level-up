const fs = require('node:fs')
const ts = require('typescript')

const source = fs.readFileSync('lib/parentInsights.ts', 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText
const loaded = { exports: {} }
new Function('exports', 'module', 'require', compiled)(loaded.exports, loaded, require)

const {
  emergingSkills,
  reinforcementSkills,
  strongestSkills,
  weeklyRecommendation,
  weightedMastery,
} = loaded.exports

const skill = (id, mastery, confidence, priority = 50) => ({
  skill_id: id,
  mastery,
  confidence,
  difficulty: 2,
  priority,
  skills: { name: id, unit_id: 'M01' },
})

const skills = [
  skill('strong', 82, 78, 15),
  skill('weak', 43, 39, 88),
  skill('single', 90, 90, 10),
  skill('none', 20, 20, 99),
]
const evidence = {
  attempts: { strong: 5, weak: 4, single: 1 },
  correct: { strong: 5, weak: 1, single: 1 },
}

const failures = []
const strongest = strongestSkills(skills, evidence)
const reinforcement = reinforcementSkills(skills, evidence)
const emerging = emergingSkills(skills, evidence)
const weighted = weightedMastery(skills, evidence)

if (strongest.map((item) => item.skill_id).join(',') !== 'strong') failures.push('strongest_requires_evidence')
if (reinforcement.map((item) => item.skill_id).join(',') !== 'weak') failures.push('reinforcement_requires_evidence')
if (emerging.map((item) => item.skill_id).join(',') !== 'single') failures.push('single_attempt_is_emerging')
if (weighted.value !== 67 || weighted.evidence !== 10) failures.push('weighted_mastery')

const noData = weeklyRecommendation({
  completedSessions: 0,
  evaluatedSkills: 0,
  totalSkills: 91,
  recentAccuracy: 0,
  accuracyDelta: null,
})
const falling = weeklyRecommendation({
  completedSessions: 7,
  evaluatedSkills: 20,
  totalSkills: 91,
  recentAccuracy: 60,
  accuracyDelta: -18,
  focusName: 'Fracciones',
})
const solid = weeklyRecommendation({
  completedSessions: 7,
  evaluatedSkills: 20,
  totalSkills: 91,
  recentAccuracy: 86,
  accuracyDelta: 5,
})

if (!noData.title.includes('primera referencia')) failures.push('no_data_guidance')
if (!falling.title.includes('estabilidad')) failures.push('falling_guidance')
if (!solid.title.includes('ampliar cobertura')) failures.push('solid_guidance')

console.log(JSON.stringify({
  scenarios: 7,
  strongest: strongest.map((item) => item.skill_id),
  reinforcement: reinforcement.map((item) => item.skill_id),
  emerging: emerging.map((item) => item.skill_id),
  weightedMastery: weighted,
  failures,
}, null, 2))

if (failures.length) process.exitCode = 1
