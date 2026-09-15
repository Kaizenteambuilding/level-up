const fs = require('node:fs')

const generated = fs.readFileSync('lib/historyLongTermVariants.ts', 'utf8')
const router = fs.readFileSync('lib/curriculumQuestionGenerator.ts', 'utf8')
const session = fs.readFileSync('components/HistoryAncientSession.tsx', 'utf8')

const skillIds = [
  'G04S01','G04S02','G04S03','G04S04',
  'G05S01','G05S02','G05S03','G05S04',
  'G06S01','G06S02','G06S03','G06S04',
]

const failures = []
for (const skillId of skillIds) {
  const marker = `${skillId}: [`
  const start = generated.indexOf(marker)
  if (start < 0) { failures.push(`${skillId}:missing-bank`); continue }
  const nextSkillStarts = skillIds
    .map((id) => generated.indexOf(`${id}: [`, start + marker.length))
    .filter((index) => index > start)
  const end = nextSkillStarts.length ? Math.min(...nextSkillStarts) : generated.indexOf('\n}\n\nconst FRAMES', start)
  const section = generated.slice(start, end)
  const cards = (section.match(/\{ level:/g) || []).length
  if (cards < 8) failures.push(`${skillId}:only-${cards}-conceptual-cards`)
  for (const level of [1,2,3,4]) {
    if (!section.includes(`level:${level}`)) failures.push(`${skillId}:missing-level-${level}`)
  }
}

const totalCards = (generated.match(/\{ level:/g) || []).length
if (totalCards < 96) failures.push(`total-conceptual-cards:${totalCards}`)
if (!generated.includes('historyLongTermVariantCount')) failures.push('variant-count-helper-missing')
if (!router.includes("import { generateHistoryLongTermVariant } from './historyLongTermVariants'")) failures.push('router-import-missing')
if (!router.includes("skill.id.startsWith('G04') || skill.id.startsWith('G05') || skill.id.startsWith('G06')")) failures.push('router-scope-missing')
if (!router.includes('generateHistoryLongTermVariant(skill, difficulty, seed)')) failures.push('router-call-missing')
if (/sin repetir preguntas recientes|prueba de nuevo más tarde/i.test(session)) failures.push('history-session-can-block-on-recent-history')

if (failures.length) {
  console.error('History course depth audit failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(JSON.stringify({ skills: skillIds.length, conceptualCards: totalCards, framedVariants: totalCards * 4, levels: [1,2,3,4], continuity: 'nonblocking' }, null, 2))
