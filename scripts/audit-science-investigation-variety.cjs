const fs = require('node:fs')

const bank = fs.readFileSync('lib/scienceInvestigationQuestions.ts', 'utf8')
const router = fs.readFileSync('lib/curriculumQuestionGenerator.ts', 'utf8')
const session = fs.readFileSync('components/ScienceInvestigationSession.tsx', 'utf8')
const failures = []
const skills = ['B01S01', 'B01S02', 'B01S03', 'B01S04']

for (const skill of skills) {
  const start = bank.indexOf(`${skill}: [`)
  if (start < 0) { failures.push(`missing_bank:${skill}`); continue }
  const nextStarts = skills.map((id) => bank.indexOf(`${id}: [`, start + 1)).filter((value) => value > start)
  const end = nextStarts.length ? Math.min(...nextStarts) : bank.indexOf('\n  ],\n}', start)
  const section = bank.slice(start, end > start ? end : bank.length)
  const prompts = [...section.matchAll(/prompt:\s*'([^']+)'/g)].map((match) => match[1])
  if (prompts.length < 8) failures.push(`too_few_prompts:${skill}:${prompts.length}`)
  if (new Set(prompts).size !== prompts.length) failures.push(`duplicate_prompt:${skill}`)
}

if (!router.includes("if (skill.id.startsWith('B01'))")) failures.push('b01_not_routed_to_specialized_generator')
if (!router.includes('generateScienceInvestigationQuestion')) failures.push('specialized_generator_not_imported')
if (!session.includes('const HISTORY = 80')) failures.push('history_window_missing')
if (!session.includes('recentTemplates.current.includes(template(next.prompt))')) failures.push('recent_template_guard_missing')
if (!session.includes('attempt < 20')) failures.push('seed_retry_guard_missing')

const totalPrompts = [...bank.matchAll(/prompt:\s*'([^']+)'/g)].map((match) => match[1])
if (totalPrompts.length < 32) failures.push(`bank_too_small:${totalPrompts.length}`)
if (new Set(totalPrompts).size !== totalPrompts.length) failures.push('duplicate_prompt_across_investigation_bank')

console.log(JSON.stringify({ skills: skills.length, minimumPromptsPerSkill: 8, totalPrompts: totalPrompts.length, uniquePrompts: new Set(totalPrompts).size, historyWindow: 80, failures }, null, 2))
if (failures.length) process.exitCode = 1
