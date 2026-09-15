const fs = require('node:fs')
const ts = require('typescript')

function load(path) {
  const source = fs.readFileSync(path, 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
  const mod = { exports: {} }
  new Function('exports','module','require',compiled)(mod.exports, mod, require)
  return mod.exports
}

const generated = load('lib/spanishReadingGenerated.ts')
const expectedSkills = ['L01S01','L01S02','L01S03','L01S04','L06S04']
const failures = []
let uniquePrompts = 0

if (generated.spanishReadingGeneratedScenarioCount() < 60) failures.push(`only_${generated.spanishReadingGeneratedScenarioCount()}_scenarios`)
for (const skillId of expectedSkills) {
  if (!generated.spanishReadingGeneratedSkillIds().includes(skillId)) failures.push(`${skillId}:missing_skill`)
  if (generated.spanishReadingGeneratedPromptCount(skillId) < 48) failures.push(`${skillId}:only_${generated.spanishReadingGeneratedPromptCount(skillId)}_possible_prompts`)
  const prompts = new Set()
  for (let seed = 0; seed < 96; seed += 1) {
    const skill = { id: skillId, name: skillId, generator_key: 'reading' }
    const question = generated.generateSpanishReadingGenerated(skill, 3, seed)
    if (!question) { failures.push(`${skillId}:missing_question`); continue }
    prompts.add(question.prompt)
    if (question.options.length !== 4 || new Set(question.options).size !== 4) failures.push(`${skillId}:invalid_options_seed_${seed}`)
    if (question.answerIndex < 0 || question.answerIndex > 3) failures.push(`${skillId}:invalid_answer_seed_${seed}`)
    if (!question.solution?.trim()) failures.push(`${skillId}:missing_solution_seed_${seed}`)
  }
  uniquePrompts += prompts.size
  if (prompts.size < 48) failures.push(`${skillId}:only_${prompts.size}_sampled_unique_prompts`)
}

const session = fs.readFileSync('components/SpanishReadingSession.tsx', 'utf8')
if (!session.includes('generateSpanishReadingGenerated')) failures.push('session:not_wired_to_course_depth_generator')

console.log(JSON.stringify({ scenarios: generated.spanishReadingGeneratedScenarioCount(), skills: expectedSkills.length, uniquePrompts, minimumPromptsPerSkill: 48, failures }, null, 2))
if (failures.length) process.exit(1)
