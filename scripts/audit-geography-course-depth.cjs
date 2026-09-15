const fs = require('node:fs')

const generated = fs.readFileSync('lib/geographyLongTermVariants.ts', 'utf8')
const router = fs.readFileSync('lib/curriculumQuestionGenerator.ts', 'utf8')
const mapsSession = fs.readFileSync('components/GeographyMapsSession.tsx', 'utf8')
const physicalSession = fs.readFileSync('components/GeographyPhysicalSession.tsx', 'utf8')

const skillIds = [
  'G01S01','G01S02','G01S03','G01S04',
  'G02S01','G02S02','G02S03','G02S04',
  'G03S01','G03S02','G03S03','G03S04',
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
  const cards = (section.match(/\{level:/g) || []).length
  if (cards < 8) failures.push(`${skillId}:only-${cards}-conceptual-cards`)
  for (const level of [1,2,3,4]) {
    if (!section.includes(`level:${level}`)) failures.push(`${skillId}:missing-level-${level}`)
  }
}

const totalCards = (generated.match(/\{level:/g) || []).length
if (totalCards < 96) failures.push(`total-conceptual-cards:${totalCards}`)
if (!generated.includes('const FRAMES = [') || !generated.includes('geographyLongTermVariantCount')) failures.push('variant-framing-or-count-helper-missing')
if (!router.includes("import { generateGeographyLongTermVariant } from './geographyLongTermVariants'")) failures.push('router-import-missing')
if (!router.includes("skill.id.startsWith('G01') || skill.id.startsWith('G02') || skill.id.startsWith('G03')")) failures.push('router-scope-missing')
if (!router.includes('generateGeographyLongTermVariant(skill, difficulty, seed)')) failures.push('router-call-missing')
for (const [name, source] of [['maps', mapsSession], ['physical', physicalSession]]) {
  if (/sin repetir preguntas recientes|prueba de nuevo más tarde|no se encontró un reto nuevo/i.test(source)) failures.push(`${name}-session-can-block-on-recent-history`)
}

if (failures.length) {
  console.error('Geography course depth audit failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(JSON.stringify({ skills: skillIds.length, conceptualCards: totalCards, framedVariants: totalCards * 4, levels: [1,2,3,4], continuity: 'nonblocking' }, null, 2))
