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

const TERM_UNITS: Record<CurriculumTerm, string[]> = {
  1: MATH_CURRICULUM_UNITS.slice(0, 5),
  2: MATH_CURRICULUM_UNITS.slice(5, 10),
  3: MATH_CURRICULUM_UNITS.slice(10, 15),
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

export function unitsForTerm(term: CurriculumTerm) {
  return [...TERM_UNITS[term]]
}

export function availableUnitsThroughTerm(term: CurriculumTerm) {
  return MATH_CURRICULUM_UNITS.slice(0, term * 5) as string[]
}

export function effectiveCurriculumPlan(
  playerId: string,
  stored: CurriculumPlan | null | undefined,
  now = new Date()
) {
  const term = stored?.pacing_mode === 'manual'
    ? stored.current_term
    : automaticTerm(now)
  const priorUnitIds = MATH_CURRICULUM_UNITS.slice(0, (term - 1) * 5) as string[]
  const termUnitIds = unitsForTerm(term)
  const requestedFocus = stored?.pacing_mode === 'manual'
    ? stored.focus_unit_ids
    : termUnitIds
  const focusUnitIds = requestedFocus.filter((id) => termUnitIds.includes(id))
  const safeFocusUnitIds = focusUnitIds.length ? focusUnitIds : termUnitIds
  const availableUnitIds = stored?.pacing_mode === 'manual'
    ? [...priorUnitIds, ...safeFocusUnitIds]
    : availableUnitsThroughTerm(term)

  return {
    playerId,
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
