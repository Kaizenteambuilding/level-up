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
import { generateMathIntegerInterpretationDepth } from './mathIntegerInterpretationDepth'
import { generateMathGraphRepresentationDepth } from './mathGraphRepresentationDepth'
import { generateMathRandomExperimentsDepth } from './mathRandomExperimentsDepth'
import { generateMathEventsContentDepth } from './mathEventsContentDepth'
import { generateMathLaplaceContentDepth } from './mathLaplaceContentDepth'
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

  const integerInterpretationDepth = generateMathIntegerInterpretationDepth(skill, difficulty, seed)
  if (integerInterpretationDepth) return integerInterpretationDepth

  const graphRepresentationDepth = generateMathGraphRepresentationDepth(skill, difficulty, seed)
  if (graphRepresentationDepth) return graphRepresentationDepth

  const randomExperimentsDepth = generateMathRandomExperimentsDepth(skill, difficulty, seed)
  if (randomExperimentsDepth) return randomExperimentsDepth

  const eventsContentDepth = generateMathEventsContentDepth(skill, difficulty, seed)
  if (eventsContentDepth) return eventsContentDepth

  const laplaceContentDepth = generateMathLaplaceContentDepth(skill, difficulty, seed)
  if (laplaceContentDepth) return laplaceContentDepth

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
    const strongerDistractors = generateKnowledgeDistractorVariant(skill, difficulty, seed)
    if (strongerDistractors) return strongerDistractors
    if (skill.id.startsWith('G01')) return generateCartographyQuestion(skill, difficulty, seed)
    if (skill.id.startsWith('G02') || skill.id.startsWith('G03')) return generateGeographyPhysicalQuestion(skill, difficulty, seed)
    return generateHistoryAncientQuestion(skill, difficulty, seed)
  }

  if (skill.id.startsWith('B')) {
    const cleanedScience = generateScienceDistractorCleanup(skill, difficulty, seed)
    if (cleanedScience) return cleanedScience
    const strongerDistractors = generateKnowledgeDistractorVariant(skill, difficulty, seed)
    if (strongerDistractors) return strongerDistractors
    if (skill.id.startsWith('B01')) return generateScienceInvestigationQuestion(skill, difficulty, seed)
    if (skill.id.startsWith('B02')) return generateGeologyLongTermVariant(skill, difficulty, seed) ?? generateKnowledgeQuestionWithCriticalVariants(skill, difficulty, seed)
    if (skill.id.startsWith('B03') || skill.id.startsWith('B04') || skill.id.startsWith('B05')) return generateScienceLifeLongTermVariant(skill, difficulty, seed) ?? generateKnowledgeQuestionWithCriticalVariants(skill, difficulty, seed)
    if (skill.id.startsWith('B06')) return generateScienceHealthLongTermVariant(skill, difficulty, seed) ?? generateKnowledgeQuestionWithCriticalVariants(skill, difficulty, seed)
  }

  return generateKnowledgeQuestionWithCriticalVariants(skill, difficulty, seed)
}

export function generateCurriculumQuestion(
  skill: SkillMeta,
  difficulty: number,
  seed: number
): GeneratedQuestion {
  let currentSeed = seed >>> 0
  let question = generateRawCurriculumQuestion(skill, difficulty, currentSeed)
  const maxAttempts = 8

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const assessment = assessDistractorQuality(question)
    if (acceptableDistractorScore(assessment, difficulty)) return question
    currentSeed = (currentSeed + 2654435761) >>> 0
    question = generateRawCurriculumQuestion(skill, difficulty, currentSeed)
  }

  return question
}
