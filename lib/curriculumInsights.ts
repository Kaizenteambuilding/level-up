import type { InsightSkill, SkillEvidence } from './parentInsights'

export type CurriculumSkill = {
  id: string
  name: string
  unit_id: string
}

export type UnitInsight = {
  unitId: string
  unitName: string
  totalSkills: number
  practicedSkills: number
  attempts: number
  correct: number
  accuracy: number | null
  averageMastery: number | null
  status: 'unexplored' | 'initial' | 'reinforce' | 'progressing' | 'solid'
}

export function buildUnitInsights(input: {
  curriculumSkills: CurriculumSkill[]
  states: InsightSkill[]
  evidence: SkillEvidence
  unitNames: Record<string, string>
  unitOrder: string[]
}): UnitInsight[] {
  const stateBySkill = new Map(input.states.map((state) => [state.skill_id, state]))

  return input.unitOrder.map((unitId) => {
    const unitSkills = input.curriculumSkills.filter((skill) => skill.unit_id === unitId)
    const practiced = unitSkills.filter(
      (skill) => Number(input.evidence.attempts[skill.id] ?? 0) > 0
    )
    const attempts = practiced.reduce(
      (sum, skill) => sum + Number(input.evidence.attempts[skill.id] ?? 0),
      0
    )
    const correct = practiced.reduce(
      (sum, skill) => sum + Number(input.evidence.correct[skill.id] ?? 0),
      0
    )
    const weightedMasteryTotal = practiced.reduce((sum, skill) => {
      const state = stateBySkill.get(skill.id)
      const count = Number(input.evidence.attempts[skill.id] ?? 0)
      return sum + (state ? Number(state.mastery) * count : 0)
    }, 0)
    const stateEvidence = practiced.reduce(
      (sum, skill) => sum + (stateBySkill.has(skill.id) ? Number(input.evidence.attempts[skill.id] ?? 0) : 0),
      0
    )
    const accuracy = attempts ? Math.round((correct / attempts) * 100) : null
    const averageMastery = stateEvidence
      ? Math.round(weightedMasteryTotal / stateEvidence)
      : null

    let status: UnitInsight['status'] = 'unexplored'
    if (attempts > 0 && (attempts < 10 || practiced.length < Math.min(3, unitSkills.length))) status = 'initial'
    else if (attempts > 0 && ((accuracy ?? 0) < 55 || (averageMastery ?? 0) < 55)) status = 'reinforce'
    else if (attempts > 0 && ((accuracy ?? 0) < 75 || (averageMastery ?? 0) < 70)) status = 'progressing'
    else if (attempts > 0) status = 'solid'

    return {
      unitId,
      unitName: input.unitNames[unitId] ?? unitId,
      totalSkills: unitSkills.length,
      practicedSkills: practiced.length,
      attempts,
      correct,
      accuracy,
      averageMastery,
      status,
    }
  })
}

export function unitStatusLabel(status: UnitInsight['status']) {
  if (status === 'unexplored') return 'Sin práctica todavía'
  if (status === 'initial') return 'Evidencia inicial'
  if (status === 'reinforce') return 'Necesita refuerzo'
  if (status === 'progressing') return 'En progreso'
  return 'Evolución sólida'
}
