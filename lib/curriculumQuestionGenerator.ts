import {
  generateFirstEvaluationQuestion,
  type GeneratedQuestion,
} from './firstEvaluationGenerators'
import { generateLanguageSubjectQuestion } from './languageSubjectGenerators'

type SkillMeta = {
  id: string
  name: string
  generator_key: string
  unit_id?: string
}

/**
 * Single entry point for curriculum questions.
 * Mathematics keeps the proven production generator. New subjects are added
 * behind this dispatcher and can be activated independently after audits.
 */
export function generateCurriculumQuestion(
  skill: SkillMeta,
  difficulty: number,
  seed: number
): GeneratedQuestion {
  if (skill.id.startsWith('M')) {
    return generateFirstEvaluationQuestion(skill, difficulty, seed)
  }

  if (skill.id.startsWith('L') || skill.id.startsWith('E')) {
    const question = generateLanguageSubjectQuestion(skill, difficulty, seed)
    if (question) return question
  }

  throw new Error(`No audited question generator for skill ${skill.id} (${skill.generator_key})`)
}
