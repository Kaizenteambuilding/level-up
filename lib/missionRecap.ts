export type MissionSkillResult = {
  attempts: number
  correct: number
}

export type MissionRecapItem = {
  skillId: string
  label: string
  attempts: number
  correct: number
}

export function buildMissionRecap(
  results: Record<string, MissionSkillResult>,
  labels: Record<string, string>
) {
  const items: MissionRecapItem[] = Object.entries(results).map(
    ([skillId, result]) => ({
      skillId,
      label: labels[skillId] ?? skillId,
      attempts: result.attempts,
      correct: result.correct,
    })
  )

  const review = items
    .filter((item) => item.correct < item.attempts)
    .sort(
      (a, b) =>
        b.attempts - b.correct - (a.attempts - a.correct) ||
        b.attempts - a.attempts ||
        a.label.localeCompare(b.label, 'es')
    )
    .slice(0, 2)

  const reviewIds = new Set(review.map((item) => item.skillId))
  const resolved = items
    .filter(
      (item) =>
        !reviewIds.has(item.skillId) &&
        item.attempts > 0 &&
        item.correct === item.attempts
    )
    .sort(
      (a, b) =>
        b.correct - a.correct || a.label.localeCompare(b.label, 'es')
    )
    .slice(0, 2)

  return { review, resolved }
}
