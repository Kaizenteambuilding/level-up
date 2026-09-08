import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = { prompt: string; answer: string; distractors: [string, string, string]; solution: string }

const CARDS: Record<string, Card[]> = {
  L02S01: [
    {
      prompt: 'En «Mis amigos llegaron bastante cansados», ¿qué clase de palabra es «bastante»?',
      answer: 'Adverbio',
      distractors: ['Determinante', 'Adjetivo', 'Pronombre'],
      solution: 'Aquí «bastante» modifica al adjetivo «cansados» e indica grado, por eso funciona como adverbio.',
    },
    {
      prompt: 'En «Aquella casa parece muy antigua», ¿qué clase de palabra es «aquella»?',
      answer: 'Determinante',
      distractors: ['Pronombre', 'Adjetivo', 'Adverbio'],
      solution: '«Aquella» acompaña al sustantivo «casa» y lo determina.',
    },
    {
      prompt: 'En «Nosotros llegamos antes que ellos», ¿qué clase de palabra es «ellos»?',
      answer: 'Pronombre',
      distractors: ['Determinante', 'Sustantivo', 'Adverbio'],
      solution: '«Ellos» sustituye a un grupo nominal y funciona como pronombre personal.',
    },
  ],
  L04S01: [
    {
      prompt: '¿Qué palabra está correctamente acentuada?',
      answer: 'música',
      distractors: ['musíca', 'músicá', 'musica'],
      solution: '«Música» es esdrújula y lleva tilde en la antepenúltima sílaba.',
    },
    {
      prompt: '¿Qué palabra lleva tilde por contener un hiato con vocal cerrada tónica?',
      answer: 'país',
      distractors: ['aire', 'causa', 'cuidado'],
      solution: 'En «país», la í tónica rompe el diptongo y forma hiato.',
    },
    {
      prompt: '¿Cuál de estas palabras debe llevar tilde por ser llana terminada en consonante distinta de n o s?',
      answer: 'árbol',
      distractors: ['joven', 'imagen', 'lunes'],
      solution: '«Árbol» es llana y termina en l; las llanas con esa terminación llevan tilde.',
    },
  ],
  E04S02: [
    {
      prompt: 'Choose the correct sentence about a completed action yesterday.',
      answer: 'Yesterday we played football after school.',
      distractors: ['Yesterday we play football after school.', 'Yesterday we were playing football every day.', 'Yesterday we have played football after school.'],
      solution: 'A completed action at a finished past time uses past simple: “played”.',
    },
    {
      prompt: 'Choose the correct negative sentence in the past.',
      answer: 'She didn’t visit the museum.',
      distractors: ['She doesn’t visit the museum yesterday.', 'She didn’t visited the museum.', 'She wasn’t visit the museum.'],
      solution: 'Past simple negative uses “didn’t” plus the base form “visit”.',
    },
    {
      prompt: 'Choose the correct question about last weekend.',
      answer: 'Did they finish the project?',
      distractors: ['Have they finished the project last weekend?', 'Did they finished the project?', 'Do they finish the project last weekend?'],
      solution: 'A question about a finished past time uses “Did + subject + base verb”.',
    },
  ],
  E05S03: [
    {
      prompt: 'Choose the sentence that expresses a planned future arrangement.',
      answer: 'I’m going to visit my cousins next weekend.',
      distractors: ['I visit my cousins every weekend.', 'I visited my cousins last weekend.', 'I’m visiting my cousins right now.'],
      solution: '“Be going to” expresses a future intention or plan.',
    },
    {
      prompt: 'Complete: “They ___ travel by train tomorrow.”',
      answer: 'are going to',
      distractors: ['were going to', 'are travelling now to', 'go to'],
      solution: 'With “they”, the future-plan structure is “are going to + base verb”.',
    },
    {
      prompt: 'Choose the correct question about a future plan.',
      answer: 'Are you going to study tonight?',
      distractors: ['Do you study tonight?', 'Did you study tonight?', 'Are you studying every night?'],
      solution: 'The question asks about an intention, so “Are you going to…?” is the appropriate form.',
    },
  ],
}

function hash(seed: number) {
  let x = seed >>> 0
  x ^= x >>> 16
  x = Math.imul(x, 0x7feb352d) >>> 0
  x ^= x >>> 15
  x = Math.imul(x, 0x846ca68b) >>> 0
  x ^= x >>> 16
  return x >>> 0
}

function rotate<T>(items: T[], shift: number) {
  const n = ((shift % items.length) + items.length) % items.length
  return items.slice(n).concat(items.slice(0, n))
}

export function generateExtraLanguageDistractorVariant(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  if (difficulty < 3) return null
  const cards = CARDS[skill.id]
  if (!cards?.length) return null

  const index = hash(seed + difficulty * 257) % cards.length
  const card = cards[index]
  const options = rotate([card.answer, ...card.distractors], seed + difficulty)

  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: card.prompt,
    options,
    answerIndex: options.indexOf(card.answer),
    solution: card.solution,
    tags: [skill.generator_key, 'plausible_distractors', `family:language-distractor-extra:${skill.id}:d${difficulty}:f${index}`],
  }
}
