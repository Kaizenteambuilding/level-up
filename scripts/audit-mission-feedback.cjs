const fs = require('node:fs')

const source = fs.readFileSync('components/MultiSubjectDailySession.tsx', 'utf8')
const failures = []

const required = [
  'const savedProgress = Math.min(SESSION_LENGTH, index + Number(Boolean(answered && feedback)))',
  'aria-valuenow={savedProgress}',
  'aria-valuetext={`${savedProgress} de ${SESSION_LENGTH} retos guardados`}',
  "position < savedProgress ? 'charged'",
  'Math.round((savedProgress / SESSION_LENGTH) * 100)',
  "role={answered ? 'status' : 'alert'}",
  "aria-live={answered ? 'polite' : 'assertive'}",
  'if (loading || error || question || !skills.length || !plans.length || !sessionId || index >= SESSION_LENGTH) return',
  '[loading, error, question, skills, plans, states, sessionId, sessionSeed, index]',
]

const unsafeProgress = /Number\(\s*answered\s*&&\s*feedback\s*\)/
for (const name of fs.readdirSync('components')) {
  if (!name.endsWith('Session.tsx')) continue
  const sessionSource = fs.readFileSync('components/' + name, 'utf8')
  if (unsafeProgress.test(sessionSource)) failures.push('unsafe-progress:' + name)
}

for (const marker of required) {
  if (!source.includes(marker)) failures.push(`missing:${marker}`)
}

console.log(JSON.stringify({
  component: 'components/MultiSubjectDailySession.tsx',
  checks: required.length,
  failures,
}, null, 2))

if (failures.length) process.exitCode = 1
