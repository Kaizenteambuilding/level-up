const fs = require('node:fs')

const generated = fs.readFileSync('lib/scienceLifeLongTermVariants.ts', 'utf8')
const router = fs.readFileSync('lib/curriculumQuestionGenerator.ts', 'utf8')
const session = fs.readFileSync('components/ScienceLifeSession.tsx', 'utf8')

const skillIds = [
  'B03S01','B03S02','B03S03','B03S04',
  'B04S01','B04S02','B04S03','B04S04',
  'B05S01','B05S02','B05S03','B05S04',
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
if (!generated.includes("const FRAMES = [") || !generated.includes('scienceLifeVariantCount')) failures.push('variant-framing-or-count-helper-missing')
if (!router.includes("import { generateScienceLifeLongTermVariant } from './scienceLifeLongTermVariants'")) failures.push('router-import-missing')
if (!router.includes("skill.id.startsWith('B03') || skill.id.startsWith('B04') || skill.id.startsWith('B05')")) failures.push('router-scope-missing')
if (!router.includes('generateScienceLifeLongTermVariant(skill, difficulty, seed)')) failures.push('router-call-missing')
if (!session.includes("'B03S01','B03S02','B03S03','B03S04','B04S01','B04S02','B04S03','B04S04','B05S01','B05S02','B05S03','B05S04'")) failures.push('science-life-session-scope-drift')
if (/sin repetir preguntas recientes|prueba de nuevo más tarde/i.test(session)) failures.push('science-life-can-block-on-recent-history')

if (failures.length) {
  console.error('Science life course depth audit failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(JSON.stringify({ skills: skillIds.length, conceptualCards: totalCards, framedVariants: totalCards * 4, levels: [1,2,3,4], continuity: 'nonblocking' }, null, 2))
