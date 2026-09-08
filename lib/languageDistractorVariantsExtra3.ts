import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = { prompt: string; answer: string; distractors: [string, string, string]; solution: string }

const CARDS: Record<string, Card[]> = {
  L04S02: [
    {
      prompt: 'Elige la palabra correctamente escrita.',
      answer: 'viaje',
      distractors: ['viage', 'biaje', 'biage'],
      solution: '«Viaje» se escribe con v y j.',
    },
    {
      prompt: '¿Qué palabra está correctamente escrita?',
      answer: 'haber',
      distractors: ['a ver', 'haver', 'aber'],
      solution: 'El infinitivo del verbo auxiliar es «haber»; «a ver» es otra expresión y las otras grafías son incorrectas.',
    },
    {
      prompt: 'Completa correctamente: «No sé si ___ suficientes sillas para todos».',
      answer: 'habrá',
      distractors: ['abrá', 'havrá', 'a habrá'],
      solution: 'El futuro de «haber» se escribe «habrá», con h y b.',
    },
  ],
  L04S03: [
    {
      prompt: '¿Qué opción puntúa mejor esta oración?',
      answer: 'Laura, trae el cuaderno, por favor.',
      distractors: ['Laura trae, el cuaderno por favor.', 'Laura trae el cuaderno por, favor.', 'Laura trae el cuaderno, por favor.'],
      solution: 'El vocativo «Laura» se separa con coma y la expresión incidental «por favor» también puede aislarse.',
    },
    {
      prompt: '¿Qué opción usa correctamente los dos puntos?',
      answer: 'Necesitamos tres cosas: papel, tijeras y pegamento.',
      distractors: ['Necesitamos: tres cosas papel, tijeras y pegamento.', 'Necesitamos tres: cosas, papel tijeras y pegamento.', 'Necesitamos tres cosas, papel: tijeras y pegamento.'],
      solution: 'Los dos puntos introducen adecuadamente la enumeración anunciada por «tres cosas».',
    },
    {
      prompt: '¿Qué opción está mejor puntuada?',
      answer: 'Aunque estaba cansado, terminó el trabajo.',
      distractors: ['Aunque, estaba cansado terminó el trabajo.', 'Aunque estaba, cansado terminó el trabajo.', 'Aunque estaba cansado terminó, el trabajo.'],
      solution: 'La subordinada inicial «Aunque estaba cansado» se separa del resto mediante coma.',
    },
  ],
  L05S01: [
    {
      prompt: 'En una narración, ¿qué opción describe mejor el conflicto?',
      answer: 'El problema que dificulta el objetivo del personaje y hace avanzar la acción',
      distractors: ['El lugar donde sucede la historia, aunque no afecte a las decisiones', 'La información que el narrador ofrece sobre el aspecto de los personajes', 'El orden cronológico en que se presentan todos los acontecimientos'],
      solution: 'El conflicto es la tensión o problema central que impulsa el desarrollo de la historia.',
    },
    {
      prompt: 'Lee: «Clara abrió la carta. Al reconocer la letra, guardó el sobre sin terminar de leer». ¿Qué elemento narrativo aparece con más claridad?',
      answer: 'Una acción que sugiere una reacción emocional del personaje',
      distractors: ['Una descripción objetiva del espacio donde ocurre la escena', 'Una explicación del narrador sobre las causas históricas del suceso', 'Un salto temporal que resume varios años de la vida de Clara'],
      solution: 'La conducta de Clara permite inferir una reacción emocional sin que el texto la explique directamente.',
    },
    {
      prompt: '¿Qué rasgo permite distinguir mejor a un narrador en primera persona?',
      answer: 'Cuenta los hechos desde un «yo» que participa o presencia la historia',
      distractors: ['Conoce siempre todo lo que piensan todos los personajes', 'Describe únicamente lugares y nunca acciones', 'Habla directamente al lector en todas las oraciones'],
      solution: 'La primera persona se reconoce por una voz narrativa que se expresa como «yo» dentro de la historia o como testigo de ella.',
    },
  ],
  E03S02: [
    {
      prompt: 'Choose the best sentence for a routine that is different today.',
      answer: 'I usually walk to school, but today I’m taking the bus.',
      distractors: ['I’m usually walking to school, but today I take the bus.', 'I usually walked to school, but today I’m taking the bus.', 'I usually walk to school, but today I took the bus every day.'],
      solution: 'Use present simple for the routine and present continuous for the temporary action happening today.',
    },
    {
      prompt: 'Complete: “She normally ___ at home, but this week she ___ in the library.”',
      answer: 'studies / is studying',
      distractors: ['is studying / studies', 'studied / studies', 'studies / studied'],
      solution: '“Normally” signals a routine, while “this week” describes a temporary current situation.',
    },
    {
      prompt: 'Which sentence describes a temporary situation rather than a regular habit?',
      answer: 'My uncle is staying with us this month.',
      distractors: ['My uncle stays with us every August.', 'My uncle stayed with us last month.', 'My uncle usually stays in a hotel.'],
      solution: 'Present continuous can describe a temporary current situation such as “this month”.',
    },
  ],
  E03S03: [
    {
      prompt: 'Choose the best description of a room with two windows and one desk.',
      answer: 'There are two windows and there is one desk.',
      distractors: ['There is two windows and there are one desk.', 'There are two windows and there are one desk.', 'There is two windows and there is one desk.'],
      solution: 'Use “there are” with plural nouns and “there is” with singular nouns.',
    },
    {
      prompt: 'Which adjective best describes someone who often helps other people?',
      answer: 'helpful',
      distractors: ['quiet', 'careful', 'serious'],
      solution: '“Helpful” specifically means willing to help; the other adjectives describe different traits.',
    },
    {
      prompt: 'Complete: “The village is small, but it is very ___ because there are no busy roads.”',
      answer: 'quiet',
      distractors: ['crowded', 'noisy', 'modern'],
      solution: 'The absence of busy roads supports “quiet”; the other adjectives do not follow from that clue.',
    },
  ],
  E04S03: [
    {
      prompt: 'Complete: “Yesterday I ___ my keys on the kitchen table.”',
      answer: 'left',
      distractors: ['leaved', 'leave', 'was leave'],
      solution: 'The irregular past form of “leave” is “left”.',
    },
    {
      prompt: 'Choose the correct past form: “We ___ to the museum by bus.”',
      answer: 'went',
      distractors: ['goed', 'gone', 'go'],
      solution: 'The irregular past simple of “go” is “went”.',
    },
    {
      prompt: 'Complete: “She ___ a photo and then put the camera away.”',
      answer: 'took',
      distractors: ['taken', 'taked', 'takes'],
      solution: 'The past simple of “take” is “took”; “taken” is the past participle.',
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

export function generateExtraLanguageDistractorVariant3(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  if (difficulty < 3) return null
  const cards = CARDS[skill.id]
  if (!cards?.length) return null

  const index = hash(seed + difficulty * 331) % cards.length
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
    tags: [skill.generator_key, 'plausible_distractors', `family:language-distractor-extra3:${skill.id}:d${difficulty}:f${index}`],
  }
}
