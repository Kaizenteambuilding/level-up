const fs = require('node:fs')

const generatedSessions = [
  'components/MathDistrictSession.tsx',
  'components/SpanishReadingSession.tsx',
  'components/SpanishWordsSession.tsx',
  'components/EnglishTerminalSession.tsx',
  'components/EnglishConversationSession.tsx',
  'components/GeographyMapsSession.tsx',
  'components/GeographyPhysicalSession.tsx',
  'components/HistoryAncientSession.tsx',
  'components/ScienceInvestigationSession.tsx',
  'components/ScienceLifeSession.tsx',
]

const fallback = `if (!generated) {
      // Course-long fallback: recent-history is a preference, never a stop condition.
      // After the fresh pool is exhausted, revisit a valid skill with a seed that keeps
      // numeric/contextual generators moving while allowing deliberate spaced review.
      const fallbackSkill = candidates[(index + recentTemplates.current.length) % candidates.length]
      const fallbackSeed = (baseSeed + Math.imul(recentTemplates.current.length + index + 1, 0x27d4eb2d)) >>> 0
      generated = generateCurriculumQuestion(fallbackSkill, states[fallbackSkill.id]?.difficulty ?? 1, fallbackSeed)
    }`

function replaceGeneratedBlock(source, file) {
  if (!source.includes('let generated') || !source.includes('candidates') || !source.includes('baseSeed')) return source
  if (source.includes('Course-long fallback: recent-history is a preference')) return source

  const patterns = [
    /if\s*\(!generated\)\s*\{\s*setError\((['"`])[^\n;]*?(?:sin repetir|nuevo|nueva|disponible)[^\n;]*?\1\)\s*;?\s*return\s*;?\s*\}/m,
    /if\s*\(!generated\)\s*\{?\s*setError\((['"`])[^\n;]*?(?:sin repetir|nuevo|nueva|disponible)[^\n;]*?\1\)\s*;?\s*return\s*;?\s*\}?/m,
  ]
  for (const pattern of patterns) {
    if (pattern.test(source)) return source.replace(pattern, fallback)
  }
  console.log(`No blocking generated-question branch found in ${file}; leaving it unchanged.`)
  return source
}

for (const file of generatedSessions) {
  if (!fs.existsSync(file)) continue
  const before = fs.readFileSync(file, 'utf8')
  const after = replaceGeneratedBlock(before, file)
  if (after !== before) fs.writeFileSync(file, after)
}

// Writing has its own task generator rather than GeneratedQuestion.
{
  const file = 'components/SpanishWritingSession.tsx'
  let source = fs.readFileSync(file, 'utf8')
  const blocker = /if\s*\(!selected\)\s*\{\s*setError\((['"`])[^\n;]*?sin repetir propuestas recientes[^\n;]*?\1\)\s*;?\s*return\s*;?\s*\}/m
  if (!source.includes('Course-long writing fallback') && blocker.test(source)) {
    source = source.replace(blocker, `if (!selected) {
        // Course-long writing fallback: recycle a valid writing objective with a new seed.
        const fallbackSkill = candidates[(index + recentTemplates.current.length) % candidates.length]
        const seed = (baseSeed + Math.imul(recentTemplates.current.length + index + 1, 0x27d4eb2d)) >>> 0
        const nextTask = generateSpanishWritingTask(fallbackSkill.id, seed)
        selected = { ...nextTask, difficulty: states[fallbackSkill.id]?.difficulty ?? 1, seed, label: fallbackSkill.name }
      }`)
    fs.writeFileSync(file, source)
  }
}

// Listening uses a finite authored bank: when everything is recent, perform spaced review
// instead of stopping the session.
{
  const file = 'components/EnglishListeningSession.tsx'
  let source = fs.readFileSync(file, 'utf8')
  source = source.replace(
    /if\s*\(!ranked\.length\)\s*\{\s*setError\((['"`])[^\n;]*?no quedan audios nuevos sin repetir[^\n;]*?\1\)\s*;?\s*return\s*;?\s*\}\s*const next = ranked\[/im,
    `const listeningPool = ranked.length ? ranked : BANK\n    const next = listeningPool[`,
  )
  source = source.replace(/%\s*Math\.min\(ranked\.length,\s*8\)/g, '% Math.min(listeningPool.length, 8)')
  fs.writeFileSync(file, source)
}

// Multi-subject daily practice has the same failure mode and is the most important path.
{
  const file = 'components/MultiSubjectDailySession.tsx'
  let source = fs.readFileSync(file, 'utf8')
  if (!source.includes('Course-long daily fallback')) {
    source = source.replace(
      /if\s*\(!generated\)\s*\{\s*setError\((['"`])[^\n;]*?sin repetir preguntas recientes[^\n;]*?\1\)\s*;?\s*return\s*;?\s*\}/m,
      `if (!generated) {
      // Course-long daily fallback: continue with spaced review rather than blocking.
      const fallbackSkill = candidates[(index + recentTemplates.current.length) % candidates.length]
      const fallbackSeed = (baseSeed + Math.imul(recentTemplates.current.length + index + 1, 0x27d4eb2d)) >>> 0
      generated = generateCurriculumQuestion(fallbackSkill, states[fallbackSkill.id]?.difficulty ?? 1, fallbackSeed)
    }`,
    )
  }
  fs.writeFileSync(file, source)
}

// Make the anti-repeat audit enforce the course-long policy globally.
fs.writeFileSync('scripts/audit-practice-antirepeat.cjs', `const fs = require('node:fs')

const sessions = [
  'components/MathDistrictSession.tsx',
  'components/SpanishReadingSession.tsx',
  'components/SpanishWordsSession.tsx',
  'components/SpanishWritingSession.tsx',
  'components/EnglishTerminalSession.tsx',
  'components/EnglishConversationSession.tsx',
  'components/EnglishListeningSession.tsx',
  'components/GeographyMapsSession.tsx',
  'components/GeographyPhysicalSession.tsx',
  'components/HistoryAncientSession.tsx',
  'components/ScienceInvestigationSession.tsx',
  'components/ScienceObservatorySession.tsx',
  'components/ScienceLifeSession.tsx',
]

const blockers = [
  /sin repetir preguntas recientes/i,
  /sin repetir propuestas recientes/i,
  /no quedan audios nuevos sin repetir/i,
  /vuelve .* prueba de nuevo más tarde/i,
]
const failures = []
for (const file of sessions) {
  if (!fs.existsSync(file)) { failures.push(\`\${file}:missing\`); continue }
  const source = fs.readFileSync(file, 'utf8')
  for (const blocker of blockers) if (blocker.test(source)) failures.push(\`\${file}:recent-history-can-block-play\`)
  const historyMatch = source.match(/(?:RECENT_PROMPT_WINDOW|HISTORY)\\s*=\\s*(\\d+)/)
  if (!historyMatch) failures.push(\`\${file}:missing_recent_history_window\`)
  if (!source.includes('prompt_snapshot')) failures.push(\`\${file}:recent_history_not_backed_by_attempts\`)
}

if (failures.length) {
  console.error('Course-long practice continuity audit failed:')
  for (const failure of failures) console.error(\`- \${failure}\`)
  process.exit(1)
}
console.log(\`Course-long continuity passed for \${sessions.length} practice modes: recent history never blocks play.\`)
`)

fs.writeFileSync('scripts/audit-course-long-continuity.cjs', `const fs = require('node:fs')
const files = [
  'components/MathDistrictSession.tsx','components/SpanishReadingSession.tsx','components/SpanishWordsSession.tsx',
  'components/SpanishWritingSession.tsx','components/EnglishTerminalSession.tsx','components/EnglishConversationSession.tsx',
  'components/EnglishListeningSession.tsx','components/GeographyMapsSession.tsx','components/GeographyPhysicalSession.tsx',
  'components/HistoryAncientSession.tsx','components/ScienceInvestigationSession.tsx','components/ScienceObservatorySession.tsx',
  'components/ScienceLifeSession.tsx','components/MultiSubjectDailySession.tsx'
]
const failures=[]
for (const file of files) {
  const source=fs.readFileSync(file,'utf8')
  if (/sin repetir (preguntas|propuestas) recientes|no quedan audios nuevos sin repetir|prueba de nuevo más tarde/i.test(source)) failures.push(file+':finite-pool-blocker')
}
const listening=fs.readFileSync('components/EnglishListeningSession.tsx','utf8')
if (!/ranked\.length\s*\?\s*ranked\s*:\s*BANK/.test(listening)) failures.push('EnglishListeningSession:missing-spaced-review-pool')
const daily=fs.readFileSync('components/MultiSubjectDailySession.tsx','utf8')
if (!daily.includes('Course-long daily fallback')) failures.push('MultiSubjectDailySession:missing-course-long-fallback')
const geology=fs.readFileSync('components/ScienceObservatorySession.tsx','utf8')
if (!/generated\s*=\s*generateCurriculumQuestion/.test(geology)) failures.push('ScienceObservatorySession:missing-fallback')
if (failures.length) { console.error('180-day continuity contract failed:'); for(const failure of failures) console.error('- '+failure); process.exit(1) }
console.log('180-day continuity contract passed: finite recent-history pools cannot terminate any course practice path.')
`)

// Wire the new course-long contract into the existing Quality workflow.
{
  const file = '.github/workflows/quality.yml'
  let source = fs.readFileSync(file, 'utf8')
  if (!source.includes('Audit course-long practice continuity')) {
    const marker = '      - name: Audit playability blockers\n        run: node scripts/audit-playability-blockers.cjs\n'
    const insert = marker + '\n      - name: Audit course-long practice continuity\n        run: node scripts/audit-course-long-continuity.cjs\n'
    if (source.includes(marker)) source = source.replace(marker, insert)
    else console.log('Quality marker not found; course-long audit remains available as a script.')
    fs.writeFileSync(file, source)
  }
}

// The transformer is only a one-shot maintenance tool; remove it and its workflow from the final commit.
for (const file of ['scripts/apply-course-continuity.cjs', '.github/workflows/course-continuity-fix.yml']) {
  if (fs.existsSync(file)) fs.unlinkSync(file)
}
