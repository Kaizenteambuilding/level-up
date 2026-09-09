import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }

type Card = {
  prompt: string
  answer: string
  distractors: [string, string, string]
  solution: string
}

const G06S01_CARDS: Card[] = [
  {
    prompt: '¿Qué diferencia esencial había entre la democracia ateniense y una monarquía hereditaria?',
    answer: 'Parte de los ciudadanos participaba directamente en decisiones políticas',
    distractors: [
      'El poder político se transmitía entre familias aristocráticas mediante una sucesión establecida',
      'Las decisiones públicas dependían principalmente de representantes elegidos para largos mandatos',
      'La participación política se organizaba alrededor de un monarca con funciones permanentes',
    ],
    solution: 'La democracia ateniense incluía participación directa de ciudadanos, aunque la ciudadanía estaba restringida.',
  },
  {
    prompt: '¿Cuál fue una limitación importante de la democracia ateniense?',
    answer: 'La ciudadanía política excluía a amplios grupos de población',
    distractors: [
      'La participación se concentraba en representantes elegidos y dejaba poco espacio a la asamblea ciudadana',
      'Las principales magistraturas se transmitían normalmente por herencia entre las mismas familias',
      'El ejército controlaba la mayoría de decisiones civiles y limitaba la intervención de la asamblea',
    ],
    solution: 'Mujeres, esclavos y extranjeros, entre otros, quedaban fuera de la ciudadanía política.',
  },
  {
    prompt: 'Decir que una polis tenía instituciones propias significa que…',
    answer: 'Organizaba su gobierno y sus leyes con autonomía política',
    distractors: [
      'Compartía un gobierno central con el resto de polis, aunque mantuviera algunas costumbres locales',
      'Aplicaba un marco legal común griego y solo decidía cuestiones administrativas menores',
      'Su organización política dependía de autoridades religiosas comunes a todas las ciudades griegas',
    ],
    solution: 'Las polis eran comunidades políticas autónomas con instituciones y leyes propias.',
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

export function generateHistoryDistractorCleanup(
  skill: SkillMeta,
  difficulty: number,
  seed: number
): GeneratedQuestion | null {
  if (skill.id !== 'G06S01' || difficulty < 3) return null

  const index = hash(seed + difficulty * 431) % G06S01_CARDS.length
  const card = G06S01_CARDS[index]
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
    tags: [skill.generator_key, 'plausible_distractors', `family:history-cleanup:${skill.id}:d${difficulty}:f${index}`],
  }
}
