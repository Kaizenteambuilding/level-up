import {
  generateFirstEvaluationQuestion,
  type GeneratedQuestion,
} from './firstEvaluationGenerators'
import { generateLanguageQuestionWithCriticalVariants } from './languageCriticalVariants'
import { generateKnowledgeQuestionWithCriticalVariants } from './knowledgeCriticalVariants'
import { generateScienceInvestigationQuestion } from './scienceInvestigationQuestions'
import { generateCartographyQuestion } from './cartographyQuestionGenerators'
import { generateGeographyPhysicalQuestion } from './geographyPhysicalQuestionGenerators'
import { generateHistoryAncientQuestion } from './historyAncientQuestionGenerators'
import { generateMathDistractorVariant } from './mathDistractorVariants'
import { generateKnowledgeDistractorVariant } from './knowledgeDistractorVariants'
import { acceptableDistractorScore, assessDistractorQuality } from './distractorQuality'

type SkillMeta = {
  id: string
  name: string
  generator_key: string
  unit_id?: string
}

function generateRawCurriculumQuestion(
  skill: SkillMeta,
  difficulty: number,
  seed: number
): GeneratedQuestion {
  if (skill.id.startsWith('M')) {
    const strongerDistractors = generateMathDistractorVariant(skill, difficulty, seed)
    if (strongerDistractors) return strongerDistractors
    return generateFirstEvaluationQuestion(skill, difficulty, seed)
  }
  if (skill.id.startsWith('L') || skill.id.startsWith('E')) {
    return generateLanguageQuestionWithCriticalVariants(skill, difficulty, seed)
  }
  if (skill.id.startsWith('B01')) {
    const investigation = generateScienceInvestigationQuestion(skill, difficulty, seed)
    if (investigation) return investigation
  }
  if (skill.id.startsWith('G01')) {
    const cartography = generateCartographyQuestion(skill, difficulty, seed)
    if (cartography) return cartography
  }
  if (skill.id.startsWith('G02') || skill.id.startsWith('G03')) {
    const physical = generateGeographyPhysicalQuestion(skill, difficulty, seed)
    if (physical) return physical
  }
  if (skill.id.startsWith('G04') || skill.id.startsWith('G05') || skill.id.startsWith('G06')) {
    const history = generateHistoryAncientQuestion(skill, difficulty, seed)
    if (history) return history
  }
  if (skill.id.startsWith('G') || skill.id.startsWith('B')) {
    const strongerDistractors = generateKnowledgeDistractorVariant(skill, difficulty, seed)
    if (strongerDistractors) return strongerDistractors
    return generateKnowledgeQuestionWithCriticalVariants(skill, difficulty, seed)
  }
  throw new Error(`No audited question generator for skill ${skill.id} (${skill.generator_key})`)
}

/**
 * Single audited entry point for all curriculum questions.
 *
 * Besides routing to the subject generator, this performs a small deterministic
 * search for a version whose distractors do not give the answer away through
 * obvious linguistic or visual clues. It never invents distractors here: it
 * chooses among real questions already authored by the subject generators.
 */
export function generateCurriculumQuestion(
  skill: SkillMeta,
  difficulty: number,
  seed: number
): GeneratedQuestion {
  const maxScore = acceptableDistractorScore(difficulty)
  let candidateSeed = seed >>> 0
  let best = generateRawCurriculumQuestion(skill, difficulty, candidateSeed)
  let bestAssessment = assessDistractorQuality(best)

  if (bestAssessment.score <= maxScore) return best

  // Higher levels deserve a wider search because eliminating implausible
  // distractors should not substitute for knowing the content.
  const retries = difficulty >= 4 ? 12 : difficulty >= 2 ? 8 : 4
  for (let attempt = 1; attempt < retries; attempt += 1) {
    candidateSeed = (candidateSeed + 2654435761) >>> 0
    const next = generateRawCurriculumQuestion(skill, difficulty, candidateSeed)
    const assessment = assessDistractorQuality(next)

    if (assessment.score < bestAssessment.score) {
      best = next
      bestAssessment = assessment
    }
    if (assessment.score <= maxScore) return next
  }

  // Never block a practice because an old bank has not yet been rewritten.
  // Returning the least weak candidate lets us improve content incrementally.
  return best
}
