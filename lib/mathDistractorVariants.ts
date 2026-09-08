import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }

type Card = {
  prompt: (n: number) => string
  answer: string
  distractors: [string, string, string]
  solution: (n: number) => string
}

const DIVISIBILITY_CARDS: Card[] = [
  {
    prompt: (n) => `Sabemos que ${n} es múltiplo de 15. ¿Qué afirmación es necesariamente cierta?`,
    answer: 'Es divisible entre 3 y entre 5',
    distractors: [
      'Es divisible entre 3 pero no entre 5',
      'Es divisible entre 5 pero no entre 3',
      'Es divisible entre 6 y entre 10',
    ],
    solution: () => 'Todo múltiplo de 15 contiene los factores 3 y 5, así que es divisible entre ambos.',
  },
  {
    prompt: (n) => `Si ${n} es divisible entre 15, ¿qué propiedad debe cumplir?`,
    answer: 'Ser divisible entre 3 y entre 5',
    distractors: [
      'Ser divisible entre 3 y no entre 5',
      'Ser divisible entre 5 y no entre 3',
      'Ser divisible entre 10 y entre 3',
    ],
    solution: () => 'Como 15 = 3 × 5 y 3 y 5 son coprimos, un múltiplo de 15 es divisible entre 3 y entre 5.',
  },
  {
    prompt: (n) => `El número ${n} es múltiplo de 15. ¿Qué pareja de divisores está garantizada?`,
    answer: '3 y 5',
    distractors: ['2 y 5', '3 y 10', '5 y 6'],
    solution: () => 'Los factores primos de 15 son 3 y 5; ambos dividen cualquier múltiplo de 15.',
  },
  {
    prompt: (n) => `Para justificar que ${n} puede ser múltiplo de 15, ¿qué combinación de criterios es la relevante?`,
    answer: 'Divisibilidad entre 3 y entre 5',
    distractors: [
      'Divisibilidad entre 2 y entre 5',
      'Divisibilidad entre 3 y entre 10',
      'Divisibilidad entre 5 y entre 6',
    ],
    solution: () => 'El criterio de 15 combina los criterios de 3 y de 5.',
  },
  {
    prompt: (n) => `Sabiendo que ${n} es divisible entre 15, completa la deducción correcta.`,
    answer: 'También es divisible entre 3 y entre 5',
    distractors: [
      'También es divisible entre 2 y entre 5',
      'También es divisible entre 3 y entre 10',
      'También es divisible entre 5 y entre 6',
    ],
    solution: () => 'Dividir entre 15 implica poder dividir exactamente entre sus factores 3 y 5.',
  },
  {
    prompt: (n) => `¿Qué comprobación basta para confirmar que ${n} cumple la divisibilidad asociada a 15?`,
    answer: 'Que cumpla a la vez los criterios de 3 y de 5',
    distractors: [
      'Que cumpla los criterios de 2 y de 5',
      'Que cumpla los criterios de 3 y de 10',
      'Que cumpla los criterios de 5 y de 6',
    ],
    solution: () => 'Al ser 15 = 3 × 5, hay que verificar simultáneamente divisibilidad entre 3 y entre 5.',
  },
  {
    prompt: (n) => `Un alumno sabe que ${n} es múltiplo de 15. ¿Qué conclusión puede escribir sin hacer más cálculos?`,
    answer: '3 y 5 son divisores de ese número',
    distractors: [
      '2 y 5 son divisores de ese número',
      '3 y 10 son divisores de ese número',
      '5 y 6 son divisores de ese número',
    ],
    solution: () => 'Los divisores 3 y 5 están contenidos necesariamente en cualquier múltiplo de 15.',
  },
  {
    prompt: (n) => `¿Qué afirmación encaja con que ${n} sea múltiplo de 15?`,
    answer: 'Al dividirlo entre 3 y entre 5 se obtiene resto 0 en ambos casos',
    distractors: [
      'Al dividirlo entre 2 y entre 5 se obtiene resto 0 en ambos casos',
      'Al dividirlo entre 3 y entre 10 se obtiene resto 0 en ambos casos',
      'Al dividirlo entre 5 y entre 6 se obtiene resto 0 en ambos casos',
    ],
    solution: () => 'Ser múltiplo de 15 garantiza resto 0 al dividir entre 3 y entre 5.',
  },
]

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

export function generateMathDistractorVariant(
  skill: SkillMeta,
  difficulty: number,
  seed: number
): GeneratedQuestion | null {
  if (skill.id !== 'M03S03') return null
  if (difficulty < 3) return null

  const card = DIVISIBILITY_CARDS[hash(seed + difficulty * 97) % DIVISIBILITY_CARDS.length]
  const multiplier = 6 + (hash(seed ^ 0x9e3779b9) % 24)
  const n = 15 * multiplier
  const options = rotate([card.answer, ...card.distractors], seed + difficulty)

  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: card.prompt(n),
    options,
    answerIndex: options.indexOf(card.answer),
    solution: card.solution(n),
    tags: [skill.generator_key, 'plausible_distractors', `family:m03-divisibility:d${difficulty}:f${hash(seed) % DIVISIBILITY_CARDS.length}`],
  }
}
