const fs = require('node:fs')

const generated = fs.readFileSync('lib/spanishWordsGenerated.ts', 'utf8')
const session = fs.readFileSync('components/SpanishWordsSession.tsx', 'utf8')

const groups = {
  L02S01: 'WORD_CLASS_CASES',
  L02S02: 'SUBJECT_CASES',
  L02S03: 'HEAD_CASES',
  L02S04: 'AGREEMENT_CASES',
  L03S01: 'SYN_ANT_CASES',
  L03S02: 'POLYSEMY_CASES',
  L03S03: 'FAMILY_CASES',
  L03S04: 'FORMATION_CASES',
}

let totalCases = 0
for (const [skillId, name] of Object.entries(groups)) {
  const start = generated.indexOf(`const ${name}: Case[] = [`)
  if (start < 0) throw new Error(`Missing ${name}`)
  const end = generated.indexOf('\n]\n', start)
  if (end < 0) throw new Error(`Could not read ${name}`)
  const block = generated.slice(start, end)
  const cases = (block.match(/\{ stem:/g) || []).length
  totalCases += cases
  const formulations = cases * 4
  if (formulations < 48) throw new Error(`${skillId} only has ${formulations} formulations`)
}

if (totalCases < 100) throw new Error(`Expected at least 100 authored grammar/vocabulary cases, got ${totalCases}`)
if (!generated.includes('const PROMPT_FRAMES = [') || !generated.includes('spanishWordsVariantCount')) throw new Error('Variant framing/count helpers missing')
if (!session.includes("import { generateSpanishWordsVariant } from '@/lib/spanishWordsGenerated'")) throw new Error('Spanish Words session is not wired to the course-depth bank')
if (!session.includes('const courseQuestion = generateSpanishWordsVariant(candidate, difficulty, seed)')) throw new Error('Course-depth questions are not prioritized')
if (session.includes('generated = generateSpanishWordsVariant(fallbackSkill')) throw new Error('Repeat-permitting fallback must not bypass recent-history protection')
if (!session.includes("No quedan retos nuevos disponibles sin repetir contenido reciente.")) throw new Error('Spanish Words must fail closed when fresh content is exhausted')
if (session.includes('No se encontró') && session.includes('sin repetir')) throw new Error('Novelty must not be a hard blocker')

console.log(`Spanish words depth OK: ${totalCases} authored cases, ${totalCases * 4} prompt formulations across 8 skills.`)
