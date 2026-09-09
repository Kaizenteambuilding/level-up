import type { GeneratedQuestion } from './firstEvaluationGenerators'

export type DistractorAssessment = {
  score: number
  reasons: string[]
}

const GENERIC_FILLER = /^(otra opción|otra respuesta|ninguna de las anteriores|todas las anteriores)(?:\s+\d+)?$/i
const ABSOLUTE_GIVEAWAY = /\b(siempre|nunca|jamás|únicamente|solamente|imposible|obviamente|todos|todas|ninguno|ninguna|cualquier)\b/i
const NEGATIVE_GIVEAWAY = /\b(no|nunca|jamás|sin|ninguno|ninguna|imposible)\b/i
const SUBJECTIVE_GIVEAWAY = /\b(bonit[oa]s?|me gusta|prefiero|mejor porque sí|interesante|divertid[oa]s?|perfect[oa]s?|estupend[oa]s?|más colores?|suene más|parezca más)\b/i
const META_GIVEAWAY = /\b(número de la página|nombre de la planta|nombre de las semillas|conclusión del informe|hipótesis escrita|resultado esperado|orden en que se encontraron|día exacto en que fueron fotografiad[oa]s?)\b/i
const NUMERIC = /^[-+]?\d+(?:[.,]\d+)?(?:\s*[a-zA-Z%°²³/]+)?$/

function normalized(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function kind(value: string) {
  const clean = value.trim()
  if (NUMERIC.test(clean)) return 'numeric'
  if (/^(sí|si|no|true|false)$/i.test(clean)) return 'boolean'
  if (/^[<>=≤≥≠]+$/.test(clean)) return 'symbol'
  return 'text'
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  return (sorted[1] + sorted[2]) / 2
}

/**
 * Heuristic detector for answer sets that can be solved by visual, linguistic
 * or elementary semantic elimination instead of subject knowledge. A higher
 * score means weaker distractors. The rules are intentionally conservative:
 * they target recurring giveaway patterns rather than trying to judge truth.
 */
export function assessDistractorQuality(question: Pick<GeneratedQuestion, 'options' | 'answerIndex'>): DistractorAssessment {
  const reasons: string[] = []
  let score = 0
  const options = question.options.map((option) => String(option).trim())
  const answer = options[question.answerIndex] ?? ''
  const distractors = options.filter((_, index) => index !== question.answerIndex)

  if (options.length !== 4 || new Set(options.map(normalized)).size !== 4) {
    score += 10
    reasons.push('invalid_or_duplicate_options')
  }

  if (distractors.some((option) => GENERIC_FILLER.test(option))) {
    score += 10
    reasons.push('generic_filler')
  }

  const kinds = options.map(kind)
  const answerKind = kinds[question.answerIndex]
  if (answerKind && kinds.filter((value) => value === answerKind).length === 1) {
    score += 3
    reasons.push('answer_is_only_option_of_its_type')
  }

  const answerHasAbsolute = ABSOLUTE_GIVEAWAY.test(answer)
  const distractorAbsolutes = distractors.filter((option) => ABSOLUTE_GIVEAWAY.test(option)).length
  if (!answerHasAbsolute && distractorAbsolutes >= 2) {
    score += 3
    reasons.push('distractors_use_obvious_absolutes')
  }

  const answerHasNegative = NEGATIVE_GIVEAWAY.test(answer)
  const distractorNegatives = distractors.filter((option) => NEGATIVE_GIVEAWAY.test(option)).length
  if (!answerHasNegative && distractorNegatives === 3) {
    score += 3
    reasons.push('all_distractors_are_negative')
  }

  const answerHasSubjectiveCue = SUBJECTIVE_GIVEAWAY.test(answer)
  const subjectiveDistractors = distractors.filter((option) => SUBJECTIVE_GIVEAWAY.test(option)).length
  if (!answerHasSubjectiveCue && subjectiveDistractors >= 2) {
    score += 2
    reasons.push('distractors_are_subjective_giveaways')
  }

  const answerHasMetaCue = META_GIVEAWAY.test(answer)
  const metaDistractors = distractors.filter((option) => META_GIVEAWAY.test(option)).length
  if (!answerHasMetaCue && metaDistractors >= 2) {
    score += 2
    reasons.push('distractors_are_meta_or_irrelevant')
  }

  if (kinds.every((value) => value === 'text')) {
    const lengths = options.map((option) => option.replace(/[^\p{L}\p{N}]+/gu, '').length)
    const typical = Math.max(1, median(lengths))
    const answerLength = lengths[question.answerIndex] ?? 0
    if (answerLength > typical * 2.75 || (answerLength >= 3 && answerLength < typical * 0.36)) {
      score += 2
      reasons.push('answer_length_is_visual_giveaway')
    }
  }

  return { score, reasons }
}

export function acceptableDistractorScore(difficulty: number) {
  const d = Math.max(1, Math.min(5, Math.round(difficulty)))
  if (d === 1) return 5
  if (d === 2) return 3
  return 1
}
