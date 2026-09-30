const PREFIXES = [
  'reto geografico:',
  'analiza el mapa o la situacion:',
  'aplica tus conocimientos de geografia:',
  'reto matematico:',
  'razona y elige la respuesta correcta:',
  'aplica la idea matematica adecuada:',
  'lee:',
  'listen:',
]

export function normalizeQuestionTemplate(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\d+(?:[.,]\d+)?/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
}

export function semanticQuestionSignature(value: string) {
  let normalized = normalizeQuestionTemplate(value)
  for (const prefix of PREFIXES) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length).trim()
      break
    }
  }
  return normalized
    .replace(/[«»“”"'.,;:!?¿¡()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function uniqueRecentSignatures(prompts: string[], limit: number) {
  return Array.from(new Set(prompts.map(semanticQuestionSignature).filter(Boolean))).slice(0, limit)
}

export function isRecentQuestion(prompt: string, templates: string[], signatures: string[]) {
  const template = normalizeQuestionTemplate(prompt)
  const signature = semanticQuestionSignature(prompt)
  return templates.includes(template) || signatures.includes(signature)
}
