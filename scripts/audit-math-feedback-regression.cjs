const fs = require('node:fs')

const source = fs.readFileSync('components/MathDistrictSession.tsx', 'utf8')
const failures = []

const required = [
  "const progress=Math.min(SESSION_LENGTH,index+(answered&&feedback?1:0))",
  "percent=Math.round((progress/SESSION_LENGTH)*100)",
  'aria-valuenow={progress}',
  '<b>Núcleo {percent}%</b>',
  '<div className="feedback-panel math-feedback">',
  '<button className="btn primary math-next"',
]

for (const marker of required) {
  if (!source.includes(marker)) failures.push(`missing:${marker}`)
}

const forbidden = [
  'Number(answered&&feedback)',
  'Number(answered && feedback)',
]

for (const marker of forbidden) {
  if (source.includes(marker)) failures.push(`forbidden:${marker}`)
}

const feedbackStart = source.indexOf('<div className="feedback-panel math-feedback">')
const feedbackEnd = feedbackStart >= 0 ? source.indexOf('</div>}', feedbackStart) : -1
const nextButton = source.indexOf('<button className="btn primary math-next"', feedbackStart)

if (feedbackStart < 0 || feedbackEnd < 0 || nextButton < feedbackStart || nextButton > feedbackEnd) {
  failures.push('math-next button must remain inside math feedback panel so successful saves are not styled as pending')
}

console.log(JSON.stringify({
  component: 'components/MathDistrictSession.tsx',
  checks: required.length + forbidden.length + 1,
  failures,
}, null, 2))

if (failures.length) process.exitCode = 1
