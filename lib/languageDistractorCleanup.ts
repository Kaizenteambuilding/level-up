import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = { prompt: string; answer: string; distractors: [string, string, string]; solution: string }

const CARDS: Record<string, Card[]> = {
  L04S01: [
    {
      prompt: '¿Qué palabra debe llevar tilde por ser esdrújula?',
      answer: 'música',
      distractors: ['pared', 'reloj', 'camino'],
      solution: '«Música» es esdrújula porque la sílaba tónica es la antepenúltima; todas las esdrújulas llevan tilde.',
    },
    {
      prompt: '¿Qué palabra lleva tilde por contener un hiato con vocal cerrada tónica?',
      answer: 'país',
      distractors: ['aire', 'causa', 'cuidado'],
      solution: 'En «país», la í tónica rompe el diptongo y forma hiato.',
    },
    {
      prompt: '¿Qué palabra necesita tilde por ser llana terminada en consonante distinta de n o s?',
      answer: 'árbol',
      distractors: ['joven', 'imagen', 'lunes'],
      solution: '«Árbol» es llana y termina en l; por esa regla lleva tilde.',
    },
  ],
  E05S03: [
    {
      prompt: 'Which sentence clearly expresses a future intention already decided?',
      answer: 'I’m going to visit my cousins next weekend.',
      distractors: ['I visit my cousins most weekends.', 'I visited my cousins last weekend.', 'I’m visiting my cousins at the moment.'],
      solution: '“Be going to” expresses a future intention or plan that has already been decided.',
    },
    {
      prompt: 'Complete the planned future sentence: “They ___ travel by train tomorrow.”',
      answer: 'are going to',
      distractors: ['were going to', 'have to', 'used to'],
      solution: 'With “they”, the planned-future structure is “are going to + base verb”. The other forms express a past intention, obligation, or past habit.',
    },
    {
      prompt: 'Which question asks specifically about a future plan for tonight?',
      answer: 'Are you going to study tonight?',
      distractors: ['Do you usually study at night?', 'Did you study last night?', 'Are you studying right now?'],
      solution: '“Are you going to…?” asks about a future intention; the distractors ask about a routine, the past, or the present moment.',
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

export function generateLanguageDistractorCleanup(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  if (difficulty < 3) return null
  const cards = CARDS[skill.id]
  if (!cards?.length) return null

  const index = hash(seed + difficulty * 419) % cards.length
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
    tags: [skill.generator_key, 'plausible_distractors', `family:language-cleanup:${skill.id}:d${difficulty}:f${index}`],
  }
}
