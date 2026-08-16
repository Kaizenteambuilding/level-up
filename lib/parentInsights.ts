export type InsightSkill = {
  skill_id: string
  mastery: number
  confidence: number
  difficulty: number
  priority: number
  skills: { name: string; unit_id: string } | null
}

export type SkillEvidence = {
  attempts: Record<string, number>
  correct: Record<string, number>
}

export function evidenceCount(skill: InsightSkill, evidence: SkillEvidence) {
  return Number(evidence.attempts[skill.skill_id] ?? 0)
}

export function skillAccuracy(skill: InsightSkill, evidence: SkillEvidence) {
  const attempts = evidenceCount(skill, evidence)
  if (!attempts) return null
  return Math.round((Number(evidence.correct[skill.skill_id] ?? 0) / attempts) * 100)
}

export function strongestSkills(skills: InsightSkill[], evidence: SkillEvidence) {
  return [...skills]
    .filter(
      (skill) =>
        evidenceCount(skill, evidence) >= 3 &&
        Number(skill.mastery) >= 70 &&
        Number(skill.confidence) >= 60
    )
    .sort(
      (a, b) =>
        Number(b.mastery) - Number(a.mastery) ||
        Number(b.confidence) - Number(a.confidence) ||
        evidenceCount(b, evidence) - evidenceCount(a, evidence)
    )
    .slice(0, 3)
}

export function reinforcementSkills(skills: InsightSkill[], evidence: SkillEvidence) {
  return [...skills]
    .filter(
      (skill) =>
        evidenceCount(skill, evidence) >= 2 &&
        (Number(skill.mastery) < 70 || Number(skill.confidence) < 60)
    )
    .sort(
      (a, b) =>
        Number(b.priority) - Number(a.priority) ||
        Number(a.mastery) - Number(b.mastery) ||
        evidenceCount(b, evidence) - evidenceCount(a, evidence)
    )
    .slice(0, 3)
}

export function emergingSkills(skills: InsightSkill[], evidence: SkillEvidence) {
  return skills
    .filter((skill) => evidenceCount(skill, evidence) === 1)
    .sort((a, b) => Number(b.priority) - Number(a.priority))
}

export function weightedMastery(skills: InsightSkill[], evidence: SkillEvidence) {
  const totalEvidence = skills.reduce(
    (sum, skill) => sum + evidenceCount(skill, evidence),
    0
  )
  if (!totalEvidence) return { value: 0, evidence: 0 }
  const value = Math.round(
    skills.reduce(
      (sum, skill) => sum + Number(skill.mastery) * evidenceCount(skill, evidence),
      0
    ) / totalEvidence
  )
  return { value, evidence: totalEvidence }
}

export function weeklyRecommendation(input: {
  completedSessions: number
  evaluatedSkills: number
  totalSkills: number
  recentAccuracy: number
  accuracyDelta: number | null
  focusName?: string
}) {
  if (input.completedSessions === 0) {
    return {
      title: 'Construir una primera referencia',
      detail: 'Completar 3 misiones en días distintos permitirá empezar a distinguir refuerzo, consolidación y puntos fuertes.',
    }
  }
  if (input.completedSessions < 3 || input.evaluatedSkills < 12) {
    return {
      title: 'Ampliar la muestra antes de sacar conclusiones',
      detail: `Hay ${input.evaluatedSkills} de ${input.totalSkills} habilidades con práctica válida. Conviene mantener misiones variadas y evitar entrenar manualmente una sola habilidad.`,
    }
  }
  if (input.accuracyDelta !== null && input.accuracyDelta <= -15) {
    return {
      title: 'Priorizar estabilidad, no subir dificultad',
      detail: `${input.focusName ? `El foco actual es ${input.focusName}. ` : ''}La precisión reciente ha bajado de forma apreciable; conviene completar 2 o 3 misiones normales antes de interpretar la caída como una dificultad persistente.`,
    }
  }
  if (input.recentAccuracy < 55) {
    return {
      title: 'Consolidar la base',
      detail: `${input.focusName ? `El motor está reforzando ${input.focusName}. ` : ''}Es preferible mantener sesiones breves y regulares; el sistema reducirá dificultad cuando la evidencia lo justifique.`,
    }
  }
  if (input.recentAccuracy >= 80 && (input.accuracyDelta ?? 0) >= 0) {
    return {
      title: 'Mantener el ritmo y ampliar cobertura',
      detail: 'La precisión reciente es sólida. El mejor siguiente paso es continuar con misiones normales para incorporar habilidades nuevas sin abandonar el mantenimiento.',
    }
  }
  return {
    title: 'Continuar con práctica variada',
    detail: `${input.focusName ? `El foco principal es ${input.focusName}. ` : ''}La evolución está dentro de una zona de consolidación; 3 misiones repartidas durante la semana darán una lectura más estable.`,
  }
}
