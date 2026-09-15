const fs = require('node:fs')

const file = 'lib/geologyLongTermVariants.ts'
let source = fs.readFileSync(file, 'utf8')

const importNeedle = "import type { GeneratedQuestion } from './firstEvaluationGenerators'\n"
if (!source.includes(importNeedle)) throw new Error('Geology type import not found')
source = source.replace(importNeedle, importNeedle + "import { getGeologyCourseDepthSupplement } from './geologyCourseDepthSupplement'\n")

const cardsNeedle = `  const cards = CARDS[skill.id]\n  if (!cards?.length) return null`
const cardsReplacement = `  const cards = [...(CARDS[skill.id] ?? []), ...getGeologyCourseDepthSupplement(skill.id)]\n  if (!cards.length) return null`
if (!source.includes(cardsNeedle)) throw new Error('Geology card selection not found')
source = source.replace(cardsNeedle, cardsReplacement)
fs.writeFileSync(file, source)
