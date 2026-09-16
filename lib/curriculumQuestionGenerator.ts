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
import { generateSpanishUpperLongTermVariant } from './spanishUpperLongTermVariants'
import { generateCourseDepthDistractorPolish } from './courseDepthDistractorPolish'
import { generateKnowledgeQuestionWithCriticalVariants } from './knowledgeCriticalVariants'
import { generateScienceInvestigationQuestion } from './scienceInvestigationQuestions'
import { generateScienceDistractorCleanup } from './scienceDistractorCleanup'
import { generateGeologyLongTermVariant } from './geologyLongTermVariants'
import { generateScienceLifeLongTermVariant } from './scienceLifeLongTermVariants'
import { generateScienceHealthLongTermVariant } from './scienceHealthLongTermVariants'
import { generateGeographyLongTermVariant } from './geographyLongTermVariants'
import { generateHistoryLongTermVariant } from './historyLongTermVariants'
import { generateHistoryDistractorCleanup } from './historyDistractorCleanup'
import { generateCartographyQuestion } from './cartographyQuestionGenerators'
import { generateGeographyPhysicalQuestion } from './geographyPhysicalQuestionGenerators'
import { generateHistoryAncientQuestion } from './historyAncientQuestionGenerators'
import { generateMathStatsProbabilityLongTermVariant } from './mathStatsProbabilityLongTermVariants'
import { generateMathStatsDeepVariant } from './mathStatsDeepVariants'
import { generateMathStatsSamplingMedianSupplement } from './mathStatsSamplingMedianSupplement'
import { generateMathStatsDepthSupplement } from './mathStatsDepthSupplement'
import { generateMathStatsVariableDepth } from './mathStatsVariableDepth'
import { generateMathGeometryDepthVariant } from './mathGeometryDepthVariants'
import { generateMathPrimeDepthVariant } from './mathPrimeDepthVariants'
import { generateMathNaturalOperationsDepthVariant } from './mathNaturalOperationsDepthVariants'
import { generateMathFrequencyOrderDepth } from './mathFrequencyOrderDepth'
import { generateMathRecurrenceHotspotDepth } from './mathRecurrenceHotspotDepth'
import { generateMathSamplingLaplaceRecurrenceDepth } from './mathSamplingLaplaceRecurrenceDepth'
import { generateMathProportionalityEventsDepth } from './mathProportionalityEventsDepth'
import { generateMathPowerNotationDepth } from './mathPowerNotationDepth'
import { generateMathCoreLongTermVariant } from './mathCoreLongTermVariants'
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
  const polishedCourseDepth = generateCourseDepthDistractorPolish(skill, difficulty, seed)
  if (polishedCourseDepth) return polishedCourseDepth

  const powerNotationDepth = generateMathPowerNotationDepth(skill, difficulty, seed)
  if (powerNotationDepth) return powerNotationDepth

  const recurrenceHotspotDepth = generateMathRecurrenceHotspotDepth(skill, difficulty, seed)
  if (recurrenceHotspotDepth) return recurrenceHotspotDepth

  const samplingLaplaceDepth = generateMathSamplingLaplaceRecurrenceDepth(skill, difficulty, seed)
  if (samplingLaplaceDepth) return samplingLaplaceDepth

  const proportionalityEventsDepth = generateMathProportionalityEventsDepth(skill, difficulty, seed)
  if (proportionalityEventsDepth) return proportionalityEventsDepth

  const samplingMedianDepth = generateMathStatsSamplingMedianSupplement(skill, difficulty, seed)
  if (samplingMedianDepth) return samplingMedianDepth

  const variableDepth = generateMathStatsVariableDepth(skill, difficulty, seed)
  if (variableDepth) return variableDepth

  const frequencyOrderDepth = generateMathFrequencyOrderDepth(skill, difficulty, seed)
  if (frequencyOrderDepth) return frequencyOrderDepth

  const statsSupplement = generateMathStatsDepthSupplement(skill, difficulty, seed)
  if (statsSupplement) return statsSupplement

  const deepStats = generateMathStatsDeepVariant(skill, difficulty, seed)
  if (deepStats) return deepStats

  const geometryDepth = generateMathGeometryDepthVariant(skill, difficulty, seed)
  if (geometryDepth) return geometryDepth

  const primeDepth = generateMathPrimeDepthVariant(skill, difficulty, seed)
  if (primeDepth) return primeDepth

  const naturalOperationsDepth = generateMathNaturalOperationsDepthVariant(skill, difficulty, seed)
  if (naturalOperationsDepth) return naturalOperationsDepth

  if (skill.id.startsWith('M14') || skill.id.startsWith('M15')) {
    const statsProbability = generateMathStatsProbabilityLongTermVariant(skill, difficulty, seed)
    if (statsProbability) return statsProbability
  }

  if (skill.id.startsWith('M')) {
    const coreMath = generateMathCoreLongTermVariant(skill, difficulty, seed)
    if (coreMath) return coreMath
    const strongerDistractors = generateMathDistractorVariant(skill, difficulty, seed)
    if (strongerDistractors) return strongerDistractors
    return generateFirstEvaluationQuestion(skill, difficulty, seed)
  }

  if (skill.id.startsWith('L04') || skill.id.startsWith('L05') || skill.id.startsWith('L06')) {
    const upperSpanish = generateSpanishUpperLongTermVariant(skill, difficulty, seed)
    if (upperSpanish) return upperSpanish
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

  if (skill.id.startsWith('G01') || skill.id.startsWith('G02') || skill.id.startsWith('G03')) {
    const geography = generateGeographyLongTermVariant(skill, difficulty, seed)
    if (geography) return geography
  }

  if (skill.id.startsWith('G04') || skill.id.startsWith('G05') || skill.id.startsWith('G06')) {
    const history = generateHistoryLongTermVariant(skill, difficulty, seed)
    if (history) return history
  }

  if (skill.id.startsWith('G')) {
    const cleanedHistory = generateHistoryDistractorCleanup(skill, difficulty, seed)
    if (cleanedHistory) return cleanedHistory
  }

  if (skill.id.startsWith('B02')) {
    const geology = generateGeologyLongTermVariant(skill, difficulty, seed)
    if (geology) return geology
  }

  if (skill.id.startsWith('B03') || skill.id.startsWith('B04') || skill.id.startsWith('B05')) {
    const life = generateScienceLifeLongTermVariant(skill, difficulty, seed)
    if (life) return life
  }

  if (skill.id.startsWith('B06')) {
    const health = generateScienceHealthLongTermVariant(skill, difficulty, seed)
    if (health) return health
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
