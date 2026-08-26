import { effectiveCurriculumPlan, type CurriculumPlan } from './curriculumPlan'
import type { ActiveSubjectPlan } from './dailySubjectRotation'
import { ACTIVE_SUBJECT_IDS, type SubjectId } from './subjects'

export type ActiveCurriculumUnit = {
  id: string
  subject_id: string
  sort_order: number
}

export function buildActiveSubjectPlans(
  playerId: string,
  activeUnits: readonly ActiveCurriculumUnit[],
  storedPlans: readonly CurriculumPlan[],
  now = new Date()
): ActiveSubjectPlan[] {
  const storedBySubject = new Map(
    storedPlans.map((plan) => [plan.subject_id as SubjectId, plan])
  )

  return ACTIVE_SUBJECT_IDS.flatMap((subjectId) => {
    const unitIds = activeUnits
      .filter((unit) => unit.subject_id === subjectId)
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
      .map((unit) => unit.id)

    if (!unitIds.length) return []

    const plan = effectiveCurriculumPlan(
      playerId,
      storedBySubject.get(subjectId) ?? null,
      now,
      subjectId,
      unitIds
    )

    return [{
      subjectId,
      availableUnitIds: plan.availableUnitIds,
      focusUnitIds: plan.focusUnitIds,
      reviewUnitIds: plan.reviewUnitIds,
    }]
  })
}
