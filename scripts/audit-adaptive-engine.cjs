const fs = require('node:fs')
const ts = require('typescript')

function loadTypescriptModule(path) {
  const source = fs.readFileSync(path, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText
  const loaded = { exports: {} }
  new Function('exports', 'module', 'require', compiled)(loaded.exports, loaded, require)
  return loaded.exports
}

const catalogueSql = fs.readFileSync('database/catalog/active_curriculum.sql', 'utf8')
const catalogueMatch = catalogueSql.match(/\$levelup_skills\$\n([\s\S]*?)\n\$levelup_skills\$/)
if (!catalogueMatch) throw new Error('No se pudo leer el catálogo versionado de habilidades.')

const skills = JSON.parse(catalogueMatch[1])
const { chooseAdaptiveSkill, evolveAdaptiveState } = loadTypescriptModule('lib/adaptiveEngine.ts')
const DAY_MS = 86_400_000
const SESSION_LENGTH = 10
const SESSIONS = 120

function random(seed) {
  let state = seed >>> 0
  return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296)
}

const profiles = [
  { name: 'solid', seed: 0x12345678, probability: ({ difficulty }) => 0.96 - difficulty * 0.035 },
  { name: 'struggling', seed: 0x87654321, probability: ({ difficulty }) => 0.46 - difficulty * 0.045 },
  {
    name: 'improving',
    seed: 0x10293847,
    probability: ({ difficulty, session }) =>
      Math.min(0.91, 0.42 + session * 0.0045) - difficulty * 0.025,
  },
  {
    name: 'uneven',
    seed: 0xabcdef01,
    probability: ({ difficulty, skillIndex }) =>
      (skillIndex < 15 ? 0.34 : skillIndex < 30 ? 0.92 : 0.7) - difficulty * 0.025,
  },
]

function simulate(profile) {
  const rng = random(profile.seed)
  const states = {}
  const counts = Object.fromEntries(skills.map((skill) => [skill.id, 0]))
  const unitCounts = Object.fromEntries([...new Set(skills.map((skill) => skill.unit_id))].map((id) => [id, 0]))
  const history = []
  let recentSkillIds = []
  let recentUnitIds = []
  let seed = profile.seed
  let correct = 0

  for (let session = 0; session < SESSIONS; session += 1) {
    const sessionTime = Date.UTC(2026, 0, 1) + session * DAY_MS
    for (let index = 0; index < SESSION_LENGTH; index += 1) {
      const skill = chooseAdaptiveSkill({
        skills,
        states,
        recentSkillIds,
        recentUnitIds,
        seed,
        questionIndex: index,
        nowMs: sessionTime,
      })
      if (!skill) throw new Error('El selector no devolvió una habilidad.')

      const state = states[skill.id]
      const difficulty = state?.difficulty ?? 1
      const skillIndex = skills.findIndex((item) => item.id === skill.id)
      const probability = Math.max(
        0.04,
        Math.min(0.98, profile.probability({ difficulty, session, skillIndex }))
      )
      const wasCorrect = rng() < probability
      const responseMs = wasCorrect ? 7_000 + Math.floor(rng() * 12_000) : 12_000 + Math.floor(rng() * 20_000)
      const practicedAt = new Date(sessionTime + index * 60_000).toISOString()
      states[skill.id] = evolveAdaptiveState(state, wasCorrect, responseMs, practicedAt)
      correct += Number(wasCorrect)
      counts[skill.id] += 1
      unitCounts[skill.unit_id] += 1
      history.push(skill.id)
      recentSkillIds = [skill.id, ...recentSkillIds.filter((id) => id !== skill.id)].slice(0, 5)
      recentUnitIds = [skill.unit_id, ...recentUnitIds.filter((id) => id !== skill.unit_id)].slice(0, 4)
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    }
  }

  const stateValues = Object.values(states)
  const countValues = Object.values(counts)
  const unitValues = Object.values(unitCounts)
  let shortestRepeatGap = Infinity
  const lastSeen = new Map()
  history.forEach((skillId, index) => {
    if (lastSeen.has(skillId)) shortestRepeatGap = Math.min(shortestRepeatGap, index - lastSeen.get(skillId))
    lastSeen.set(skillId, index)
  })

  return {
    profile: profile.name,
    attempts: history.length,
    accuracy: Number((correct / history.length).toFixed(3)),
    skillsCovered: countValues.filter((value) => value > 0).length,
    minSkillAttempts: Math.min(...countValues),
    maxSkillAttempts: Math.max(...countValues),
    minUnitAttempts: Math.min(...unitValues),
    maxUnitAttempts: Math.max(...unitValues),
    shortestRepeatGap,
    averageMastery: Number((stateValues.reduce((sum, state) => sum + state.mastery, 0) / stateValues.length).toFixed(1)),
    averageConfidence: Number((stateValues.reduce((sum, state) => sum + state.confidence, 0) / stateValues.length).toFixed(1)),
    difficultyRange: [
      Math.min(...stateValues.map((state) => state.difficulty)),
      Math.max(...stateValues.map((state) => state.difficulty)),
    ],
    highDifficultySkills: stateValues.filter((state) => state.difficulty >= 4).length,
    lowPrioritySkills: stateValues.filter((state) => state.priority <= 30).length,
    highPrioritySkills: stateValues.filter((state) => state.priority >= 70).length,
    counts,
  }
}

const results = profiles.map(simulate)
const failures = []
for (const result of results) {
  if (result.skillsCovered !== skills.length) failures.push(`${result.profile}: incomplete_skill_coverage`)
  if (result.minSkillAttempts < 2) failures.push(`${result.profile}: skill_starvation`)
  if (result.minUnitAttempts < 35) failures.push(`${result.profile}: unit_starvation`)
  if (result.shortestRepeatGap < 6) failures.push(`${result.profile}: recent_skill_repeat`)
}

const solid = results.find((result) => result.profile === 'solid')
const struggling = results.find((result) => result.profile === 'struggling')
const improving = results.find((result) => result.profile === 'improving')
const uneven = results.find((result) => result.profile === 'uneven')
if (solid.averageMastery <= struggling.averageMastery + 20) failures.push('profiles_do_not_diverge')
if (solid.highDifficultySkills < 25) failures.push('solid_profile_does_not_progress')
if (struggling.highDifficultySkills > 5) failures.push('struggling_profile_progresses_too_fast')
if (improving.averageMastery <= struggling.averageMastery + 8) failures.push('improving_profile_not_detected')

const unevenWeakAttempts = skills.slice(0, 15).reduce((sum, skill) => sum + uneven.counts[skill.id], 0) / 15
const unevenStrongAttempts = skills.slice(15, 30).reduce((sum, skill) => sum + uneven.counts[skill.id], 0) / 15
if (unevenWeakAttempts <= unevenStrongAttempts * 1.25) failures.push('weak_skills_not_prioritized')

const publicResults = results.map(({ counts, ...result }) => result)
console.log(JSON.stringify({
  skills: skills.length,
  sessionsPerProfile: SESSIONS,
  simulatedAttempts: profiles.length * SESSIONS * SESSION_LENGTH,
  profiles: publicResults,
  unevenWeakToStrongPracticeRatio: Number((unevenWeakAttempts / unevenStrongAttempts).toFixed(2)),
  failures,
}, null, 2))

if (failures.length) process.exitCode = 1
