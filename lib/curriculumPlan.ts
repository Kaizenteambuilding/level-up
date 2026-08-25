export const MATH_CURRICULUM_UNITS = [
  'M01', 'M02', 'M03', 'M04', 'M05',
  'M06', 'M07', 'M08', 'M09', 'M10',
  'M11', 'M12', 'M13', 'M14', 'M15',
] as const

export type CurriculumTerm = 1 | 2 | 3
export type CurriculumPacingMode = 'automatic' | 'manual'

export type CurriculumPlan = {
  player_id: string
  subject_id: string
  academic_year_start: number
  pacing_mode: CurriculumPacingMode
  current_term: CurriculumTerm
  focus_unit_ids: string[]
  updated_at?: string
}

function termWindow(unitIds: readonly string[], term: CurriculumTerm) {
  const size = Math.ceil(unitIds.length / 3)
  const start = (term - 1) * size
  const end = term === 3 ? unitIds.length : Math.min(unitIds.length, start + size)
  return { start, end }
}

export function schoolYearStart(date = new Date()) {
  return date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1
}

/** Generic Spanish school-year calendar. Manual mode is available for the real school pace. */
export function automaticTerm(date = new Date()): CurriculumTerm {
  const month = date.getMonth() + 1
  if (month >= 7) return 1
  if (month <= 3) return 2
  return 3
}

export function unitsForTerm(
  term: CurriculumTerm,
  unitIds: readonly string[] = MATH_CURRICULUM_UNITS
) {
  const { start, end } = termWindow(unitIds, term)
  return unitIds.slice(start, end) as string[]
}

export function availableUnitsThroughTerm(
  term: CurriculumTerm,
  unitIds: readonly string[] = MATH_CURRICULUM_UNITS
) {
  const { end } = termWindow(unitIds, term)
  return unitIds.slice(0, end) as string[]
}

export function effectiveCurriculumPlan(
  playerId: string,
  stored: CurriculumPlan | null | undefined,
  now = new Date(),
  subjectId = stored?.subject_id ?? 'math',
  subjectUnitIds: readonly string[] = MATH_CURRICULUM_UNITS
) {
  const term = stored?.pacing_mode === 'manual'
    ? stored.current_term
    : automaticTerm(now)
  const { start } = termWindow(subjectUnitIds, term)
  const priorUnitIds = subjectUnitIds.slice(0, start) as string[]
  const termUnitIds = unitsForTerm(term, subjectUnitIds)
  const requestedFocus = stored?.pacing_mode === 'manual'
    ? stored.focus_unit_ids
    : termUnitIds
  const focusUnitIds = requestedFocus.filter((id) => termUnitIds.includes(id))
  const safeFocusUnitIds = focusUnitIds.length ? focusUnitIds : termUnitIds
  const availableUnitIds = stored?.pacing_mode === 'manual'
    ? [...priorUnitIds, ...safeFocusUnitIds]
    : availableUnitsThroughTerm(term, subjectUnitIds)

  return {
    playerId,
    subjectId,
    academicYearStart: stored?.academic_year_start ?? schoolYearStart(now),
    pacingMode: stored?.pacing_mode ?? 'automatic' as CurriculumPacingMode,
    currentTerm: term,
    availableUnitIds,
    focusUnitIds: safeFocusUnitIds,
    reviewUnitIds: priorUnitIds,
  }
}

export function termLabel(term: CurriculumTerm) {
  return `${term}.º trimestre`
}
