export type AdaptiveSkill = {
  id: string
  unit_id: string
}

export type AdaptiveSkillState = {
  mastery: number
  confidence: number
  difficulty: number
  priority: number
  last_practiced_at?: string | null
}

export type AdaptiveSelectionInput<T extends AdaptiveSkill> = {
  skills: T[]
  states: Record<string, AdaptiveSkillState | undefined>
  focusUnitIds?: string[]
  reviewUnitIds?: string[]
  recentSkillIds: string[]
  recentUnitIds: string[]
  seed: number
  questionIndex: number
  nowMs?: number
}

function mixSelectionSeed(seed: number, questionIndex: number, salt: number) {
  let x = (seed ^ Math.imul(questionIndex + 1, 0x9e3779b9) ^ salt) >>> 0
  x ^= x >>> 16
  x = Math.imul(x, 0x7feb352d) >>> 0
  x ^= x >>> 15
  x = Math.imul(x, 0x846ca68b) >>> 0
  x ^= x >>> 16
  return x >>> 0
}

function skillSalt(skillId: string) {
  let hash = 2166136261
  for (let i = 0; i < skillId.length; i += 1) {
    hash ^= skillId.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Pure production selector, shared with the longitudinal audit. */
export function chooseAdaptiveSkill<T extends AdaptiveSkill>({
  skills,
  states,
  focusUnitIds = [],
  reviewUnitIds = [],
  recentSkillIds,
  recentUnitIds,
  seed,
  questionIndex,
  nowMs = Date.now(),
}: AdaptiveSelectionInput<T>): T | null {
  if (!skills.length) return null

  const recentSkills = new Set(recentSkillIds)
  const mixedSeed = (salt: number) => mixSelectionSeed(seed, questionIndex, salt)
  const pickFrom = (items: T[], salt: number) =>
    items.length ? items[mixedSeed(salt) % items.length] : null

  const scored = skills.map((skill) => {
    const state = states[skill.id]
    const mastery = state?.mastery ?? 50
    const confidence = state?.confidence ?? 35
    const priority = state?.priority ?? 60
    const lastPracticed = state?.last_practiced_at
      ? new Date(state.last_practiced_at).getTime()
      : 0
    const daysSincePractice = lastPracticed
      ? Math.max(0, (nowMs - lastPracticed) / 86_400_000)
      : 30
    const needScore =
      (100 - mastery) * 0.52 +
      (100 - confidence) * 0.23 +
      priority * 0.12
    const unseenBonus = state ? 0 : 12
    const recencyBonus = Math.min(14, daysSincePractice * 1.5)
    const recentUnitPenalty =
      recentUnitIds[0] === skill.unit_id
        ? 3
        : recentUnitIds.slice(0, 3).includes(skill.unit_id)
          ? 1
          : 0
    const recentSkillPenalty = recentSkills.has(skill.id) ? 1000 : 0
    const tieBreaker = mixedSeed(skillSalt(skill.id))
    return {
      skill,
      state,
      score:
        needScore +
        unseenBonus +
        recencyBonus -
        recentUnitPenalty -
        recentSkillPenalty,
      lastPracticed,
      mastery,
      tieBreaker,
    }
  })

  const byNeed = (a: typeof scored[number], b: typeof scored[number]) =>
    b.score - a.score || b.tieBreaker - a.tieBreaker
  const byOldest = (a: typeof scored[number], b: typeof scored[number]) =>
    a.lastPracticed !== b.lastPracticed
      ? a.lastPracticed - b.lastPracticed
      : byNeed(a, b)
  const mode = questionIndex % 10

  // With a curriculum plan, seven questions stay on the school focus and one
  // deliberately revisits earlier content. Adaptation still decides the skill
  // and difficulty inside each pedagogically valid pool.
  if (focusUnitIds.length && mode <= 6) {
    const focus = scored
      .filter((item) => focusUnitIds.includes(item.skill.unit_id))
      .sort(byNeed)
      .slice(0, 6)
      .map((item) => item.skill)
    if (focus.length) return pickFrom(focus, 0x31415926) ?? focus[0]
  }

  if (reviewUnitIds.length && mode === 7) {
    const review = scored
      .filter((item) => reviewUnitIds.includes(item.skill.unit_id))
      .sort(byOldest)
      .slice(0, 10)
      .map((item) => item.skill)
    if (review.length) return pickFrom(review, 0x27182818) ?? review[0]
  }

  if (mode <= 5) {
    return (
      pickFrom(
        [...scored]
          .sort(byNeed)
          .slice(0, Math.min(6, scored.length))
          .map((item) => item.skill),
        0x13579bdf
      ) ?? skills[0]
    )
  }
  if (mode <= 7) {
    return (
      pickFrom(
        [...scored]
          .sort(byOldest)
          .slice(0, Math.min(10, scored.length))
          .map((item) => item.skill),
        0x2468ace0
      ) ?? skills[0]
    )
  }
  if (mode === 8) {
    const maintenance = scored
      // Maintenance must never override the five-question anti-repeat window.
      // This matters when only one or two skills have reached mastery 70.
      .filter(
        (item) =>
          item.state &&
          item.mastery >= 70 &&
          !recentSkills.has(item.skill.id)
      )
      .sort(byOldest)
      .slice(0, 8)
      .map((item) => item.skill)
    if (maintenance.length) {
      return pickFrom(maintenance, 0x55aa55aa) ?? skills[0]
    }
  }
  return (
    pickFrom(
      [...scored]
        .sort(byNeed)
        .slice(0, Math.min(24, scored.length))
        .map((item) => item.skill),
      0xa5a5a5a5
    ) ?? skills[0]
  )
}

/** Mirrors submit_levelup_attempt for deterministic, database-free audits. */
export function evolveAdaptiveState(
  current: AdaptiveSkillState | undefined,
  correct: boolean,
  responseMs: number,
  practicedAt: string
): AdaptiveSkillState {
  let mastery = current?.mastery ?? 50
  let confidence = current?.confidence ?? 50
  let difficulty = Math.max(1, Math.min(5, current?.difficulty ?? 1))

  if (correct) {
    mastery = Math.min(100, mastery + (difficulty >= 3 ? 3 : 2))
    confidence = Math.min(100, confidence + 3)
    if (
      difficulty < 5 &&
      responseMs <= 20_000 &&
      mastery >= 45 + difficulty * 8 &&
      confidence >= 48 + difficulty * 7
    ) {
      difficulty += 1
    }
  } else {
    mastery = Math.max(0, mastery - 1)
    confidence = Math.max(0, confidence - 2)
    if (
      difficulty > 1 &&
      (mastery < 40 + difficulty * 7 ||
        confidence < 42 + difficulty * 6)
    ) {
      difficulty -= 1
    }
  }

  const priority = Math.max(
    1,
    Math.min(100, Math.round(50 + (50 - mastery) * 0.8 + (50 - confidence) * 0.4))
  )
  return {
    mastery,
    confidence,
    difficulty,
    priority,
    last_practiced_at: practicedAt,
  }
}
