const assert = require('node:assert/strict')
const fs = require('node:fs')

const files = [
  'EnglishTerminalSession.tsx',
  'EnglishConversationSession.tsx',
  'EnglishListeningSession.tsx',
  'GeographyMapsSession.tsx',
  'GeographyPhysicalSession.tsx',
  'HistoryAncientSession.tsx',
  'MathDistrictSession.tsx',
  'ScienceInvestigationSession.tsx',
  'ScienceLifeSession.tsx',
  'ScienceObservatorySession.tsx',
  'SpanishReadingSession.tsx',
  'SpanishWordsSession.tsx',
  'SpanishWritingSession.tsx',
]

for (const filename of files) {
  const path = `components/${filename}`
  assert.ok(fs.existsSync(path), `${filename} is missing`)
  const source = fs.readFileSync(path, 'utf8')
  assert.match(source, /SESSION_LENGTH\s*=\s*10/, `${filename}: expected 10-attempt contract`)
  assert.ok(source.includes('open_levelup_practice_session'), `${filename}: server practice open missing`)
  assert.ok(source.includes('submit_levelup_attempt'), `${filename}: server attempt RPC missing`)
  assert.ok(source.includes('complete_levelup_session'), `${filename}: server completion RPC missing`)
  assert.match(source, /\.from\(['"]attempts['"]\)[\s\S]*?\.eq\(['"]session_id['"]/, `${filename}: persisted session recovery missing`)
  assert.match(source, /setIndex\([\s\S]{0,160}attempts\.length/, `${filename}: resume index must use persisted attempts`)
  assert.ok(source.toLowerCase().includes('practice already completed today'), `${filename}: completed-today guard missing`)
  assert.ok(/withTimeout|retryJwtFuture|AbortController/.test(source), `${filename}: network resilience helper missing`)
  assert.ok(!/\.from\(['"]study_sessions['"]\)\.(insert|update|delete)/.test(source), `${filename}: direct session mutation forbidden`)
  assert.ok(!/\.from\(['"]attempts['"]\)\.(insert|update|delete)/.test(source), `${filename}: direct attempt mutation forbidden`)
}

console.log(`Practice resilience audit passed (${files.length} persisted practice modes).`)
