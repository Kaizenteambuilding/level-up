import type { SubjectId } from './subjects'

export type ActiveSubjectPlan = {
  subjectId: SubjectId
  availableUnitIds: string[]
  focusUnitIds: string[]
  reviewUnitIds: string[]
}

const SUBJECT_ORDER: SubjectId[] = [
  'math',
  'spanish',
  'english',
  'geography_history',
  'biology_geology',
]

export function orderedActiveSubjects(plans: readonly ActiveSubjectPlan[]) {
  const byId = new Map(plans.map((plan) => [plan.subjectId, plan]))
  return SUBJECT_ORDER
    .map((subjectId) => byId.get(subjectId))
    .filter((plan): plan is ActiveSubjectPlan => Boolean(plan && plan.availableUnitIds.length))
}

export function subjectForQuestion(
  plans: readonly ActiveSubjectPlan[],
  questionIndex: number,
  seed = 0
) {
  const active = orderedActiveSubjects(plans)
  if (!active.length) return null
  // Rotate the starting subject per session while preserving even coverage.
  const start = Math.abs(seed >>> 0) % active.length
  return active[(start + Math.max(0, questionIndex)) % active.length]
}

export function unitsForActiveSubjects(plans: readonly ActiveSubjectPlan[]) {
  return Array.from(new Set(orderedActiveSubjects(plans).flatMap((plan) => plan.availableUnitIds)))
}
