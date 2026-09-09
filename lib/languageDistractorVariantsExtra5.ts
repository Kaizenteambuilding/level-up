import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = { prompt: string; answer: string; distractors: [string, string, string]; solution: string }

const CARDS: Record<string, Card[]> = {
  L02S04: [
    {
      prompt: 'Elige la opción con concordancia correcta.',
      answer: 'Las ventanas del aula estaban abiertas.',
      distractors: ['Las ventanas del aula estaba abierta.', 'La ventanas del aula estaban abiertas.', 'Las ventanas del aula estaban abierto.'],
      solution: 'El sujeto plural «Las ventanas» exige verbo en plural y el atributo debe concordar en femenino plural.',
    },
    {
      prompt: 'Completa: «Mi hermano y yo ___ responsables de preparar el material».',
      answer: 'somos',
      distractors: ['soy', 'es', 'son'],
      solution: '«Mi hermano y yo» equivale a primera persona del plural, por eso corresponde «somos».',
    },
    {
      prompt: '¿Qué opción mantiene correctamente la concordancia?',
      answer: 'Ese grupo de alumnas llegó preparado para la actividad.',
      distractors: ['Ese grupo de alumnas llegaron preparadas para la actividad.', 'Esa grupo de alumnas llegó preparada para la actividad.', 'Ese grupo de alumnas llegaron preparado para la actividad.'],
      solution: 'El núcleo del sujeto es «grupo», singular y masculino; el verbo y el participio concuerdan con ese núcleo.',
    },
  ],
  L03S04: [
    {
      prompt: '¿Cómo se forma «desconectar» a partir de «conectar»?',
      answer: 'Añadiendo el prefijo «des-»',
      distractors: ['Añadiendo el sufijo «-des»', 'Uniendo dos lexemas independientes', 'Cambiando solo la desinencia verbal'],
      solution: '«Des-» se coloca delante de la base «conectar», por lo que es un prefijo.',
    },
    {
      prompt: '¿Qué procedimiento forma «panadero» a partir de «pan»?',
      answer: 'Derivación mediante el sufijo «-adero»',
      distractors: ['Composición de dos palabras completas', 'Adición de un prefijo antes de «pan»', 'Cambio de género sin añadir morfemas derivativos'],
      solution: '«Panadero» se obtiene añadiendo un sufijo derivativo a la base «pan».',
    },
    {
      prompt: '¿Qué palabra se ha formado mediante prefijación?',
      answer: 'imposible',
      distractors: ['panadero', 'sacapuntas', 'mesita'],
      solution: '«Imposible» incorpora el prefijo «im-»; las otras palabras responden a sufijación o composición.',
    },
  ],
  E01S04: [
    {
      prompt: 'The teacher says: “Underline the verbs and circle the adjectives.” What should you do?',
      answer: 'Draw a line under the verbs and a circle around the adjectives.',
      distractors: ['Circle the verbs and underline the adjectives.', 'Copy only the verbs and erase the adjectives.', 'Write the verbs above the adjectives.'],
      solution: '“Underline” means draw a line under; “circle” means draw a circle around.',
    },
    {
      prompt: 'The teacher says: “Work in pairs and compare your answers.” What does this mean?',
      answer: 'Work with one partner and check your answers together.',
      distractors: ['Work alone and hand in your answers immediately.', 'Join a large group and choose one answer for the class.', 'Copy your partner’s answers without discussing them.'],
      solution: '“Work in pairs” means two students work together; “compare” means check similarities and differences.',
    },
    {
      prompt: 'The teacher says: “Turn to page 42 and read the second paragraph silently.” What should you do first?',
      answer: 'Open the book at page 42.',
      distractors: ['Read the second paragraph aloud.', 'Write a summary before opening the book.', 'Turn to the second page and read paragraph 42.'],
      solution: 'The instruction sequence begins by opening the book at page 42.',
    },
  ],
  E02S04: [
    {
      prompt: 'Which sequence is the most logical for a school morning?',
      answer: 'wake up → get dressed → have breakfast → go to school',
      distractors: ['go to school → wake up → have breakfast → get dressed', 'have breakfast → go to school → wake up → get dressed', 'get dressed → go to school → wake up → have breakfast'],
      solution: 'The correct order follows the normal chronological sequence of a morning routine.',
    },
    {
      prompt: 'Complete: “I leave home at quarter past eight.” What time is that?',
      answer: '8:15',
      distractors: ['8:45', '7:45', '8:30'],
      solution: '“Quarter past eight” means fifteen minutes after eight.',
    },
    {
      prompt: 'Choose the best connector: “First I pack my bag. ___, I check that I have my keys.”',
      answer: 'Then',
      distractors: ['Because', 'Although', 'Never'],
      solution: '“Then” introduces the next step in a sequence.',
    },
  ],
  E03S04: [
    {
      prompt: 'Choose the correct comparative sentence.',
      answer: 'This route is shorter than the one through the park.',
      distractors: ['This route is more short than the one through the park.', 'This route is shortest than the one through the park.', 'This route is as shorter as the one through the park.'],
      solution: 'The comparative of the short adjective “short” is “shorter”, followed by “than”.',
    },
    {
      prompt: 'Complete: “A train is usually ___ than a bicycle for long journeys.”',
      answer: 'faster',
      distractors: ['fastest', 'more fast', 'as fast'],
      solution: 'Comparing two things requires the comparative form “faster”.',
    },
    {
      prompt: 'Choose the sentence that means both buildings have the same height.',
      answer: 'The library is as tall as the sports centre.',
      distractors: ['The library is taller than the sports centre.', 'The library is the tallest of the two.', 'The library is less tall and more high than the sports centre.'],
      solution: '“As + adjective + as” expresses equality.',
    },
  ],
  E04S01: [
    {
      prompt: 'Complete: “I ___ at home last night, but my parents ___ at a concert.”',
      answer: 'was / were',
      distractors: ['were / was', 'am / are', 'was / was'],
      solution: 'Past “be” uses “was” with I and “were” with the plural subject “my parents”.',
    },
    {
      prompt: 'Choose the correct past question.',
      answer: 'Were they at school yesterday?',
      distractors: ['Did they were at school yesterday?', 'Was they at school yesterday?', 'Are they at school yesterday?'],
      solution: 'Past questions with “be” invert “were” and the subject; they do not use “did”.',
    },
    {
      prompt: 'Choose the correct negative sentence.',
      answer: 'She wasn’t tired after the trip.',
      distractors: ['She didn’t be tired after the trip.', 'She weren’t tired after the trip.', 'She isn’t tired after the trip yesterday.'],
      solution: 'The past negative of “be” with “she” is “wasn’t”.',
    },
  ],
  E04S04: [
    {
      prompt: 'Choose the best order for a short past narrative.',
      answer: 'First we missed the bus; then we called a taxi; finally we arrived at the station.',
      distractors: ['Finally we missed the bus; first we arrived at the station; then we called a taxi.', 'Then we arrived at the station; finally we called a taxi; first we missed the bus.', 'First we arrived at the station; then we missed the bus; finally we called a taxi.'],
      solution: 'The connectors must match the chronological order of the events.',
    },
    {
      prompt: 'Complete: “We finished dinner. ___, we went for a walk.”',
      answer: 'After that',
      distractors: ['Before that', 'Because', 'At first'],
      solution: '“After that” correctly places the walk after dinner.',
    },
    {
      prompt: 'Which connector best shows that one past event happened before another?',
      answer: 'Before',
      distractors: ['Finally', 'Meanwhile', 'Suddenly'],
      solution: '“Before” explicitly expresses an earlier event in relation to another one.',
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

export function generateExtraLanguageDistractorVariant5(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  if (difficulty < 3) return null
  const cards = CARDS[skill.id]
  if (!cards?.length) return null

  const index = hash(seed + difficulty * 401) % cards.length
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
    tags: [skill.generator_key, 'plausible_distractors', `family:language-distractor-extra5:${skill.id}:d${difficulty}:f${index}`],
  }
}
