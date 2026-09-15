const fs = require('node:fs')

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

const permissiveFallbacks = [
  /if\s*\(!generated\)\s*generated\s*=\s*generateCurriculumQuestion/,
  /if\s*\(!generated\)\s*\{[^}]*generated\s*=\s*generateCurriculumQuestion/s,
  /generated\s*\?\?=\s*generateCurriculumQuestion/,
  /ranked\.length\s*\?\s*ranked\s*:\s*BANK/,
]

const failures = []
for (const file of sessions) {
  if (!fs.existsSync(file)) {
    failures.push(`${file}:missing`)
    continue
  }
  const source = fs.readFileSync(file, 'utf8')

  if (file === 'components/ScienceObservatorySession.tsx') {
    if (/No se encontró una observación geológica nueva sin repetir preguntas recientes/i.test(source)) {
      failures.push(`${file}:still_blocks_when_recent_pool_is_exhausted`)
    }
    if (!/if\s*\(!generated\)\s*\{[^}]*generated\s*=\s*generateCurriculumQuestion/s.test(source)) {
      failures.push(`${file}:missing_playability_fallback`)
    }
  } else {
    for (const pattern of permissiveFallbacks) {
      if (pattern.test(source)) failures.push(`${file}:permits_duplicate_fallback`)
    }
  }

  const historyMatch = source.match(/(?:RECENT_PROMPT_WINDOW|HISTORY)\s*=\s*(\d+)/)
  if (!historyMatch) failures.push(`${file}:missing_recent_history_window`)
  else if (Number(historyMatch[1]) < 120) failures.push(`${file}:history_window_${historyMatch[1]}_below_120`)
  if (!source.includes('prompt_snapshot')) failures.push(`${file}:recent_history_not_backed_by_attempts`)
  if (file !== 'components/EnglishListeningSession.tsx' && source.includes('generateCurriculumQuestion') && !/attempt\s*<\s*64/.test(source)) {
    failures.push(`${file}:insufficient_generation_retries`)
  }
}

const geologyBank = 'lib/geologyLongTermVariants.ts'
if (!fs.existsSync(geologyBank)) failures.push(`${geologyBank}:missing`)
else {
  const source = fs.readFileSync(geologyBank, 'utf8')
  for (const skill of ['B02S01', 'B02S02', 'B02S03', 'B02S04']) {
    if (!source.includes(`${skill}: [`)) failures.push(`${geologyBank}:missing_${skill}`)
  }
  const cardCount = (source.match(/\{ level: [1-5], prompt:/g) ?? []).length
  if (cardCount < 48) failures.push(`${geologyBank}:only_${cardCount}_cards`)
}

if (failures.length) {
  console.error('Practice anti-repeat audit failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Practice anti-repeat audit passed for ${sessions.length} practice sections, with a nonblocking geology fallback and ${48}+ authored geology variants.`)
