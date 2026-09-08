import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }

type Card = {
  prompt: (n: number) => string
  answer: string
  distractors: [string, string, string]
  solution: (n: number) => string
}

type StaticCard = {
  prompt: string
  answer: string
  distractors: [string, string, string]
  solution: string
}

const DIVISIBILITY_CARDS: Card[] = [
  {
    prompt: (n) => `Sabemos que ${n} es múltiplo de 15. ¿Qué afirmación es necesariamente cierta?`,
    answer: 'Es divisible entre 3 y entre 5',
    distractors: ['Es divisible entre 3 pero no entre 5','Es divisible entre 5 pero no entre 3','Es divisible entre 6 y entre 10'],
    solution: () => 'Todo múltiplo de 15 contiene los factores 3 y 5, así que es divisible entre ambos.',
  },
  {
    prompt: (n) => `Si ${n} es divisible entre 15, ¿qué propiedad debe cumplir?`,
    answer: 'Ser divisible entre 3 y entre 5',
    distractors: ['Ser divisible entre 3 y no entre 5','Ser divisible entre 5 y no entre 3','Ser divisible entre 10 y entre 3'],
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
    distractors: ['Divisibilidad entre 2 y entre 5','Divisibilidad entre 3 y entre 10','Divisibilidad entre 5 y entre 6'],
    solution: () => 'El criterio de 15 combina los criterios de 3 y de 5.',
  },
  {
    prompt: (n) => `Sabiendo que ${n} es divisible entre 15, completa la deducción correcta.`,
    answer: 'También es divisible entre 3 y entre 5',
    distractors: ['También es divisible entre 2 y entre 5','También es divisible entre 3 y entre 10','También es divisible entre 5 y entre 6'],
    solution: () => 'Dividir entre 15 implica poder dividir exactamente entre sus factores 3 y 5.',
  },
  {
    prompt: (n) => `¿Qué comprobación basta para confirmar que ${n} cumple la divisibilidad asociada a 15?`,
    answer: 'Que cumpla a la vez los criterios de 3 y de 5',
    distractors: ['Que cumpla los criterios de 2 y de 5','Que cumpla los criterios de 3 y de 10','Que cumpla los criterios de 5 y de 6'],
    solution: () => 'Al ser 15 = 3 × 5, hay que verificar simultáneamente divisibilidad entre 3 y entre 5.',
  },
  {
    prompt: (n) => `Un alumno sabe que ${n} es múltiplo de 15. ¿Qué conclusión puede escribir sin hacer más cálculos?`,
    answer: '3 y 5 son divisores de ese número',
    distractors: ['2 y 5 son divisores de ese número','3 y 10 son divisores de ese número','5 y 6 son divisores de ese número'],
    solution: () => 'Los divisores 3 y 5 están contenidos necesariamente en cualquier múltiplo de 15.',
  },
  {
    prompt: (n) => `¿Qué afirmación encaja con que ${n} sea múltiplo de 15?`,
    answer: 'Al dividirlo entre 3 y entre 5 se obtiene resto 0 en ambos casos',
    distractors: ['Al dividirlo entre 2 y entre 5 se obtiene resto 0 en ambos casos','Al dividirlo entre 3 y entre 10 se obtiene resto 0 en ambos casos','Al dividirlo entre 5 y entre 6 se obtiene resto 0 en ambos casos'],
    solution: () => 'Ser múltiplo de 15 garantiza resto 0 al dividir entre 3 y entre 5.',
  },
]

const BASIC_GEOMETRY_CARDS: StaticCard[] = [
  {
    prompt: 'Dos puntos A y B determinan una figura recta limitada entre ambos. ¿Cómo se llama?',
    answer: 'Segmento AB',
    distractors: ['Recta AB', 'Semirrecta AB', 'Punto medio de AB'],
    solution: 'Un segmento tiene dos extremos: A y B.',
  },
  {
    prompt: 'Una figura recta pasa por A y B y se prolonga indefinidamente en ambos sentidos. ¿Qué es?',
    answer: 'La recta AB',
    distractors: ['El segmento AB', 'La semirrecta AB', 'La distancia AB'],
    solution: 'Una recta no tiene extremos y se prolonga en ambos sentidos.',
  },
  {
    prompt: 'Parte de una recta que empieza en A, pasa por B y continúa indefinidamente en un solo sentido:',
    answer: 'Semirrecta AB',
    distractors: ['Segmento AB', 'Recta AB', 'Punto AB'],
    solution: 'Una semirrecta tiene un origen y se prolonga en un único sentido.',
  },
  {
    prompt: '¿Qué diferencia distingue mejor un segmento de una recta?',
    answer: 'El segmento tiene dos extremos y la recta no tiene extremos',
    distractors: ['El segmento tiene un extremo y la recta dos','La recta tiene dos extremos y el segmento ninguno','Ambos tienen exactamente un extremo'],
    solution: 'La presencia de dos extremos caracteriza al segmento; la recta se prolonga indefinidamente.',
  },
  {
    prompt: 'Si A, B y C están alineados y B queda entre A y C, ¿qué afirmación describe correctamente AC?',
    answer: 'AC es un segmento que contiene al punto B',
    distractors: ['AC es una semirrecta con origen en B','AC es un punto porque A y C están alineados','AC es una recta con extremos A y C'],
    solution: 'El segmento AC incluye todos los puntos situados entre A y C, incluido B.',
  },
  {
    prompt: '¿Cuál de estas descripciones corresponde a un punto geométrico?',
    answer: 'Indica una posición pero no tiene longitud ni anchura',
    distractors: ['Tiene longitud pero no extremos','Tiene dos extremos y una longitud medible','Se prolonga indefinidamente en una dirección'],
    solution: 'Un punto representa una posición sin dimensiones.',
  },
  {
    prompt: '¿Qué figura queda determinada por dos puntos distintos si se prolonga sin límite a ambos lados?',
    answer: 'Una recta',
    distractors: ['Un segmento', 'Una semirrecta', 'Un punto medio'],
    solution: 'Por dos puntos distintos pasa una única recta, que se prolonga indefinidamente.',
  },
  {
    prompt: 'En el segmento AB, ¿qué puede decirse de A y B?',
    answer: 'Son los dos extremos del segmento',
    distractors: ['Son dos puntos interiores del segmento','Uno es el único extremo y el otro no pertenece al segmento','Son los extremos de una recta limitada'],
    solution: 'A y B delimitan el segmento y son sus extremos.',
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
  if (difficulty < 3) return null

  if (skill.id === 'M03S03') {
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

  if (skill.id === 'M10S01') {
    const index = hash(seed + difficulty * 131) % BASIC_GEOMETRY_CARDS.length
    const card = BASIC_GEOMETRY_CARDS[index]
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
      tags: [skill.generator_key, 'plausible_distractors', `family:m10-basic-geometry:d${difficulty}:f${index}`],
    }
  }

  return null
}
