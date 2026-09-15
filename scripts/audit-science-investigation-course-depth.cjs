const fs = require('node:fs')
const ts = require('typescript')

function load(path, extras = {}) {
  const source = fs.readFileSync(path, 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const mod = { exports: {} }
  new Function('exports','module','require',compiled)(mod.exports, mod, (id) => extras[id] ?? require(id))
  return mod.exports
}

const first = load('lib/firstEvaluationGenerators.ts')
const supplement = load('lib/scienceInvestigationCourseDepth.ts')
const bankSource = fs.readFileSync('lib/scienceInvestigationQuestions.ts', 'utf8')
const counts = supplement.scienceInvestigationCourseDepthCounts()
const skills = ['B01S01','B01S02','B01S03','B01S04']
const failures = []

for (const id of skills) {
  if (counts[id] !== 16) failures.push(`${id}:expected_16_supplemental_cards_got_${counts[id] ?? 0}`)
}
if (!bankSource.includes("import { getScienceInvestigationCourseDepth } from './scienceInvestigationCourseDepth'")) failures.push('generator_missing_course_depth_import')
if (!bankSource.includes('...(BANK[skill.id] ?? []), ...getScienceInvestigationCourseDepth(skill.id)')) failures.push('generator_not_combining_course_depth')

const supplementSource = fs.readFileSync('lib/scienceInvestigationCourseDepth.ts', 'utf8')
const prompts = [...supplementSource.matchAll(/prompt:'([^']+)'/g)].map((match) => match[1].trim().toLowerCase())
if (prompts.length !== 64) failures.push(`expected_64_supplemental_prompts_got_${prompts.length}`)
if (new Set(prompts).size !== prompts.length) failures.push('duplicate_supplemental_prompt')

const session = fs.readFileSync('components/ScienceInvestigationSession.tsx', 'utf8')
if (/sin repetir preguntas recientes/i.test(session)) failures.push('recent_history_can_block_play')

console.log(JSON.stringify({ skills: skills.length, originalPerSkill: 8, supplementalPerSkill: 16, totalPerSkill: 24, totalSpecificPrompts: 96, failures }, null, 2))
if (failures.length) process.exitCode = 1
