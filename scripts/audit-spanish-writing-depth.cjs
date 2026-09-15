const fs = require('node:fs')
const ts = require('typescript')

const source = fs.readFileSync('lib/spanishWritingTasks.ts', 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
const mod = { exports: {} }
new Function('exports','module','require',compiled)(mod.exports, mod, require)

const skillIds = mod.exports.spanishWritingSkillIds()
const taskCount = mod.exports.spanishWritingTaskCount()
const failures = []
let minimumUniquePrompts = Infinity
let totalUniquePrompts = 0

if (skillIds.length < 12) failures.push(`only_${skillIds.length}_writing_skills`)
if (taskCount < 48) failures.push(`only_${taskCount}_base_tasks`)

for (const skillId of skillIds) {
  const prompts = new Set()
  const ids = new Set()
  for (let seed = 0; seed < 96; seed += 1) {
    const task = mod.exports.generateSpanishWritingTask(skillId, seed)
    prompts.add(task.prompt.trim())
    ids.add(task.id)
    if (task.skillId !== skillId) failures.push(`${skillId}:wrong_skill_${task.skillId}`)
    if (!task.criteria?.length) failures.push(`${skillId}:missing_criteria`)
  }
  minimumUniquePrompts = Math.min(minimumUniquePrompts, prompts.size)
  totalUniquePrompts += prompts.size
  if (prompts.size < 48) failures.push(`${skillId}:only_${prompts.size}_unique_prompts`)
  if (ids.size < 48) failures.push(`${skillId}:only_${ids.size}_unique_ids`)
}

console.log(JSON.stringify({ skillCount: skillIds.length, baseTaskCount: taskCount, minimumUniquePrompts, totalUniquePrompts, failures }, null, 2))
if (failures.length) process.exit(1)
