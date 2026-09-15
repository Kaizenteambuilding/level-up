const fs = require('node:fs')

const generated = fs.readFileSync('lib/scienceHealthLongTermVariants.ts', 'utf8')
const router = fs.readFileSync('lib/curriculumQuestionGenerator.ts', 'utf8')

const skillIds = ['B06S01','B06S02','B06S03','B06S04']
const failures = []

for (const skillId of skillIds) {
  const marker = `${skillId}: [`
  const start = generated.indexOf(marker)
  if (start < 0) { failures.push(`${skillId}:missing-bank`); continue }
  const nextStarts = skillIds.map((id) => generated.indexOf(`${id}: [`, start + marker.length)).filter((index) => index > start)
  const end = nextStarts.length ? Math.min(...nextStarts) : generated.indexOf('\n}\n\nconst FRAMES', start)
  const section = generated.slice(start, end)
  const cards = (section.match(/\{ level:/g) || []).length
  if (cards < 8) failures.push(`${skillId}:only-${cards}-conceptual-cards`)
  for (const level of [1,2,3,4]) if (!section.includes(`level:${level}`)) failures.push(`${skillId}:missing-level-${level}`)
}

const totalCards = (generated.match(/\{ level:/g) || []).length
if (totalCards < 32) failures.push(`total-conceptual-cards:${totalCards}`)
if (!generated.includes('scienceHealthVariantCount')) failures.push('variant-count-helper-missing')
if (!router.includes("import { generateScienceHealthLongTermVariant } from './scienceHealthLongTermVariants'")) failures.push('router-import-missing')
if (!router.includes("skill.id.startsWith('B06')")) failures.push('router-scope-missing')
if (!router.includes('generateScienceHealthLongTermVariant(skill, difficulty, seed)')) failures.push('router-call-missing')

if (failures.length) {
  console.error('Science health course depth audit failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(JSON.stringify({ skills: skillIds.length, conceptualCards: totalCards, framedVariants: totalCards * 4, levels: [1,2,3,4] }, null, 2))
