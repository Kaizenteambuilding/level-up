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

function parseCatalogueBlock(sql, tag) {
  const match = sql.match(new RegExp(`\\$${tag}\\$\\n([\\s\\S]*?)\\n\\$${tag}\\$`))
  if (!match) throw new Error(`No se pudo leer ${tag} del catálogo versionado.`)
  return JSON.parse(match[1])
}

function random(seed) {
  let state = seed >>> 0
  return () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296)
}

const catalogueSql = fs.readFileSync('database/catalog/active_curriculum.sql', 'utf8')
const units = parseCatalogueBlock(catalogueSql, 'levelup_units')
const skills = parseCatalogueBlock(catalogueSql, 'levelup_skills')
const { chooseAdaptiveSkill, evolveAdaptiveState } = loadTypescriptModule('lib/adaptiveEngine.ts')
const { effectiveCurriculumPlan } = loadTypescriptModule('lib/curriculumPlan.ts')

const NOW = new Date('2026-09-15T12:00:00Z')
const SESSION_LENGTH = 10
const SESSIONS = 20
const DAY_MS = 86_400_000
const playerId = 'fresh-player-audit'
const orderedUnitIds = units
  .filter((unit) => unit.subject_id === 'math' && unit.active !== false)
  .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
  .map((unit) => unit.id)
const plan = effectiveCurriculumPlan(playerId, null, NOW, 'math', orderedUnitIds)
const activeSkills = skills.filter((skill) => plan.availableUnitIds.includes(skill.unit_id))

if (!activeSkills.length) throw new Error('El plan inicial no contiene habilidades activas.')

const profiles = [
  {
    name: 'balanced_start',
    seed: 0x41a7c39d,
    probability: ({ difficulty }) => 0.78 - difficulty * 0.045,
  },
  {
    name: 'rough_start_then_recovers',
    seed: 0x5ac0ffee,
    probability: ({ difficulty, session }) =>
      (session < 2 ? 0.28 : Math.min(0.84, 0.62 + (session - 2) * 0.014)) - difficulty * 0.035,
  },
  {
    name: 'strong_start',
    seed: 0x7f4a7c15,
    probability: ({ difficulty }) => 0.96 - difficulty * 0.035,
  },
]

function simulate(profile) {
  const rng = random(profile.seed)
  const states = {}
  let shortestWithinSessionRepeatGap = Infinity
  const sessionSummaries = []
  const unitCounts = Object.fromEntries(plan.focusUnitIds.map((unitId) => [unitId, 0]))

  for (let session = 0; session < SESSIONS; session += 1) {
    const sessionTime = NOW.getTime() + session * DAY_MS
    // Production reconstructs these from the attempts in the currently open session.
    // A new mission therefore starts with fresh skill/unit recency and unit counts.
    const sessionUnitCounts = {}
    let recentSkillIds = []
    let recentUnitIds = []
    const lastSeenInSession = new Map()
    let sessionCorrect = 0
    let sessionMaxDifficulty = 1
    const sessionDifficulties = []

    for (let index = 0; index < SESSION_LENGTH; index += 1) {
      const skill = chooseAdaptiveSkill({
        skills: activeSkills,
        states,
        focusUnitIds: plan.focusUnitIds,
        reviewUnitIds: plan.reviewUnitIds,
        sessionUnitCounts,
        recentSkillIds,
        recentUnitIds,
        seed: (profile.seed + Math.imul(session + 1, 2654435761)) >>> 0,
        questionIndex: index,
        nowMs: sessionTime,
      })
      if (!skill) throw new Error(`${profile.name}: no se eligió habilidad`)

      const current = states[skill.id]
      const difficulty = current?.difficulty ?? 1
      sessionMaxDifficulty = Math.max(sessionMaxDifficulty, difficulty)
      sessionDifficulties.push(difficulty)
      const p = Math.max(0.05, Math.min(0.98, profile.probability({ difficulty, session, skill })))
      const correct = rng() < p
      sessionCorrect += Number(correct)
      const responseMs = correct
        ? 7_000 + Math.floor(rng() * 12_000)
        : 13_000 + Math.floor(rng() * 20_000)
      states[skill.id] = evolveAdaptiveState(
        current,
        correct,
        responseMs,
        new Date(sessionTime + index * 60_000).toISOString()
      )

      const previousIndex = lastSeenInSession.get(skill.id)
      if (previousIndex !== undefined) {
        shortestWithinSessionRepeatGap = Math.min(shortestWithinSessionRepeatGap, index - previousIndex)
      }
      lastSeenInSession.set(skill.id, index)
      recentSkillIds = [skill.id, ...recentSkillIds.filter((id) => id !== skill.id)].slice(0, 5)
      recentUnitIds = [skill.unit_id, ...recentUnitIds.filter((id) => id !== skill.unit_id)].slice(0, 3)
      sessionUnitCounts[skill.unit_id] = (sessionUnitCounts[skill.unit_id] ?? 0) + 1
      if (skill.unit_id in unitCounts) unitCounts[skill.unit_id] += 1
    }

    const stateValues = Object.values(states)
    sessionSummaries.push({
      session: session + 1,
      accuracy: Number((sessionCorrect / SESSION_LENGTH).toFixed(2)),
      maxDifficulty: sessionMaxDifficulty,
      averageDifficulty: Number((sessionDifficulties.reduce((sum, value) => sum + value, 0) / sessionDifficulties.length).toFixed(2)),
      averageMastery: stateValues.length
        ? Number((stateValues.reduce((sum, state) => sum + state.mastery, 0) / stateValues.length).toFixed(1))
        : 50,
    })
  }

  const stateValues = Object.values(states)
  return {
    profile: profile.name,
    shortestWithinSessionRepeatGap,
    skillsSeen: stateValues.length,
    focusUnitsCovered: Object.values(unitCounts).filter((count) => count > 0).length,
    focusUnitCount: plan.focusUnitIds.length,
    minFocusUnitAttempts: Math.min(...Object.values(unitCounts)),
    maxDifficulty: Math.max(...stateValues.map((state) => state.difficulty)),
    highDifficultySkills: stateValues.filter((state) => state.difficulty >= 4).length,
    sessionSummaries,
  }
}

const results = profiles.map(simulate)
const failures = []

for (const result of results) {
  if (result.shortestWithinSessionRepeatGap < 6) failures.push(`${result.profile}: recent_skill_repeat`)
  if (result.focusUnitsCovered !== result.focusUnitCount) failures.push(`${result.profile}: incomplete_focus_unit_coverage`)
  if (result.minFocusUnitAttempts < 10) failures.push(`${result.profile}: focus_unit_starvation`)
  if (result.sessionSummaries[0].maxDifficulty > 2) failures.push(`${result.profile}: first_session_escalates_too_fast`)
}

const balanced = results.find((result) => result.profile === 'balanced_start')
const rough = results.find((result) => result.profile === 'rough_start_then_recovers')
const strong = results.find((result) => result.profile === 'strong_start')

if (rough.sessionSummaries.slice(0, 3).some((session) => session.maxDifficulty > 2)) {
  failures.push('rough_start_escalates_before_recovery')
}
if (rough.highDifficultySkills > 3) failures.push('rough_start_over_promoted')
if (rough.sessionSummaries.at(-1).averageMastery <= rough.sessionSummaries[1].averageMastery + 4) {
  failures.push('rough_start_does_not_recover')
}
if (strong.maxDifficulty < 3) failures.push('strong_start_does_not_progress')
if (balanced.maxDifficulty < 2) failures.push('balanced_start_never_progresses')

const publicResults = results.map((result) => ({
  profile: result.profile,
  shortestWithinSessionRepeatGap: Number.isFinite(result.shortestWithinSessionRepeatGap)
    ? result.shortestWithinSessionRepeatGap
    : null,
  skillsSeen: result.skillsSeen,
  focusUnitsCovered: `${result.focusUnitsCovered}/${result.focusUnitCount}`,
  minFocusUnitAttempts: result.minFocusUnitAttempts,
  maxDifficulty: result.maxDifficulty,
  highDifficultySkills: result.highDifficultySkills,
  firstThreeSessions: result.sessionSummaries.slice(0, 3),
  finalSession: result.sessionSummaries.at(-1),
}))

console.log(JSON.stringify({
  date: NOW.toISOString(),
  currentTerm: plan.currentTerm,
  availableUnitIds: plan.availableUnitIds,
  focusUnitIds: plan.focusUnitIds,
  reviewUnitIds: plan.reviewUnitIds,
  activeSkills: activeSkills.length,
  sessionsPerProfile: SESSIONS,
  attemptsPerProfile: SESSIONS * SESSION_LENGTH,
  profiles: publicResults,
  failures,
}, null, 2))

if (failures.length) process.exitCode = 1
