import {
  generateFirstEvaluationQuestion,
  type GeneratedQuestion,
} from './firstEvaluationGenerators'
import { generateLanguageQuestionWithCriticalVariants } from './languageCriticalVariants'
import { generateLanguageDistractorVariant } from './languageDistractorVariants'
import { generateExtraLanguageDistractorVariant } from './languageDistractorVariantsExtra'
import { generateExtraLanguageDistractorVariant2 } from './languageDistractorVariantsExtra2'
import { generateExtraLanguageDistractorVariant3 } from './languageDistractorVariantsExtra3'
import { generateExtraLanguageDistractorVariant4 } from './languageDistractorVariantsExtra4'
import { generateExtraLanguageDistractorVariant5 } from './languageDistractorVariantsExtra5'
import { generateLanguageReadingDistractorVariant } from './languageDistractorVariantsReading'
import { generateLanguageDistractorCleanup } from './languageDistractorCleanup'
import { generateKnowledgeQuestionWithCriticalVariants } from './knowledgeCriticalVariants'
import { generateScienceInvestigationQuestion } from './scienceInvestigationQuestions'
import { generateScienceDistractorCleanup } from './scienceDistractorCleanup'
import { generateHistoryDistractorCleanup } from './historyDistractorCleanup'
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
    const cleanedLanguage = generateLanguageDistractorCleanup(skill, difficulty, seed)
    if (cleanedLanguage) return cleanedLanguage

    const strongerDistractors = generateLanguageDistractorVariant(skill, difficulty, seed)
      ?? generateExtraLanguageDistractorVariant(skill, difficulty, seed)
      ?? generateExtraLanguageDistractorVariant2(skill, difficulty, seed)
      ?? generateExtraLanguageDistractorVariant3(skill, difficulty, seed)
      ?? generateExtraLanguageDistractorVariant4(skill, difficulty, seed)
      ?? generateExtraLanguageDistractorVariant5(skill, difficulty, seed)
      ?? generateLanguageReadingDistractorVariant(skill, difficulty, seed)
    if (strongerDistractors) return strongerDistractors
    return generateLanguageQuestionWithCriticalVariants(skill, difficulty, seed)
  }

  if (skill.id.startsWith('G')) {
    const cleanedHistory = generateHistoryDistractorCleanup(skill, difficulty, seed)
    if (cleanedHistory) return cleanedHistory
  }

  if (skill.id.startsWith('B')) {
    const cleanedScience = generateScienceDistractorCleanup(skill, difficulty, seed)
    if (cleanedScience) return cleanedScience
  }

  if (skill.id.startsWith('G') || skill.id.startsWith('B')) {
    const strongerDistractors = generateKnowledgeDistractorVariant(skill, difficulty, seed)
    if (strongerDistractors) return strongerDistractors
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
    return generateKnowledgeQuestionWithCriticalVariants(skill, difficulty, seed)
  }
  throw new Error(`No audited question generator for skill ${skill.id} (${skill.generator_key})`)
}

function isDegenerateMathQuestion(question: GeneratedQuestion) {
  if (!question.skillId.startsWith('M')) return false

  const directRule = question.prompt.match(
    /^Si\s+(\d+)\s+unidades\s+cuestan\s+[^?]+¿cuánto\s+cuestan\s+(\d+)\s+unidades\?$/i,
  )

  return directRule ? Number(directRule[1]) === Number(directRule[2]) : false
}

function generatePlayableRawQuestion(
  skill: SkillMeta,
  difficulty: number,
  seed: number,
): GeneratedQuestion {
  let candidateSeed = seed >>> 0
  let candidate = generateRawCurriculumQuestion(skill, difficulty, candidateSeed)

  for (let attempt = 0; attempt < 8 && isDegenerateMathQuestion(candidate); attempt += 1) {
    candidateSeed = (candidateSeed + 2654435761) >>> 0
    candidate = generateRawCurriculumQuestion(skill, difficulty, candidateSeed)
  }

  return candidate
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
  let best = generatePlayableRawQuestion(skill, difficulty, candidateSeed)
  let bestAssessment = assessDistractorQuality(best)

  if (bestAssessment.score <= maxScore) return best

  const retries = difficulty >= 4 ? 12 : difficulty >= 2 ? 8 : 4
  for (let attempt = 1; attempt < retries; attempt += 1) {
    candidateSeed = (candidateSeed + 2654435761) >>> 0
    const next = generatePlayableRawQuestion(skill, difficulty, candidateSeed)
    const assessment = assessDistractorQuality(next)

    if (assessment.score < bestAssessment.score) {
      best = next
      bestAssessment = assessment
    }
    if (assessment.score <= maxScore) return next
  }

  return best
}
