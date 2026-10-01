const READING_QUESTION_MARKERS = [
  ' cual es la idea principal', ' que resumen recoge mejor', ' que opcion sintetiza mejor', ' cual seria el mejor titulo-resumen',
  ' cual es la intencion principal', ' que pretende hacer principalmente', ' para que se ha emitido', ' que funcion cumple sobre todo',
  ' que podemos inferir', ' que conclusion esta mejor apoyada', ' que es lo mas probable', ' que deduccion encaja mejor',
  ' que conector completa mejor', ' elige la palabra o expresion', ' que enlace textual encaja', ' que conector mantiene la relacion',
  ' que efecto produce el recurso', ' que aporta esta imagen', ' como contribuye el lenguaje figurado', ' que interpretacion explica mejor',
]

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
  const isReading = normalized.startsWith('lee:')
  for (const prefix of PREFIXES) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length).trim()
      break
    }
  }
  if (isReading) {
    const folded = normalized.replace(/[¿?]/g, '')
    for (const marker of READING_QUESTION_MARKERS) {
      const index = folded.indexOf(marker)
      if (index >= 0) { normalized = folded.slice(0, index).trim(); break }
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
