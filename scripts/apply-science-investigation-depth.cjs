const fs = require('node:fs')
const file = 'lib/scienceInvestigationQuestions.ts'
let source = fs.readFileSync(file, 'utf8')
const importNeedle = "import type { GeneratedQuestion } from './firstEvaluationGenerators'\n"
if (!source.includes(importNeedle)) throw new Error('science investigation import not found')
source = source.replace(importNeedle, importNeedle + "import { getScienceInvestigationCourseDepth } from './scienceInvestigationCourseDepth'\n")
const cardsNeedle = "  const cards = BANK[skill.id]\n  if (!cards?.length) return null"
const cardsReplacement = "  const cards = [...(BANK[skill.id] ?? []), ...getScienceInvestigationCourseDepth(skill.id)]\n  if (!cards.length) return null"
if (!source.includes(cardsNeedle)) throw new Error('science investigation cards selection not found')
source = source.replace(cardsNeedle, cardsReplacement)
fs.writeFileSync(file, source)
