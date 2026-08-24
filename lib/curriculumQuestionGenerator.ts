import {
  generateFirstEvaluationQuestion,
  type GeneratedQuestion,
} from './firstEvaluationGenerators'
import { generateLanguageSubjectQuestion } from './languageSubjectGenerators'
import { generateKnowledgeQuestionWithCriticalVariants } from './knowledgeCriticalVariants'

type SkillMeta = {
  id: string
  name: string
  generator_key: string
  unit_id?: string
}

/** Single audited entry point for all curriculum questions. */
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
  if (skill.id.startsWith('G') || skill.id.startsWith('B')) {
    return generateKnowledgeQuestionWithCriticalVariants(skill, difficulty, seed)
  }
  throw new Error(`No audited question generator for skill ${skill.id} (${skill.generator_key})`)
}
