import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = { prompt: string; answer: string; distractors: [string, string, string]; solution: string }

const CARDS: Record<string, Card[]> = {
  L04S04: [
    {
      prompt: '¿Qué corrección necesita «Ayer fuimos ala biblioteca»?',
      answer: 'Cambiar «ala» por «a la»',
      distractors: ['Cambiar «fuimos» por «íbamos»', 'Cambiar «biblioteca» por «librería»', 'Añadir una coma después de «Ayer»'],
      solution: 'La preposición «a» y el artículo «la» deben escribirse separados en este contexto.',
    },
    {
      prompt: '¿Qué corrección mejora «Mi hermano tubo fiebre anoche»?',
      answer: 'Cambiar «tubo» por «tuvo»',
      distractors: ['Cambiar «fiebre» por «febril»', 'Cambiar «anoche» por «ayer noche»', 'Añadir una coma después de «hermano»'],
      solution: 'El pretérito del verbo «tener» es «tuvo», con v.',
    },
    {
      prompt: 'En «Haber si llegamos a tiempo», ¿qué corrección es necesaria?',
      answer: 'Cambiar «Haber» por «A ver»',
      distractors: ['Cambiar «llegamos» por «lleguemos» obligatoriamente', 'Escribir «tiempo» con mayúscula', 'Añadir dos puntos después de «ver»'],
      solution: 'La expresión usada para introducir una expectativa es «a ver», no el infinitivo «haber».',
    },
  ],
  L05S04: [
    {
      prompt: 'Un párrafo explica primero el problema, luego una consecuencia y termina proponiendo una solución. ¿Qué revisión mejoraría más su claridad?',
      answer: 'Mantener ese orden y añadir conectores que hagan explícita la relación entre las ideas',
      distractors: ['Mover la solución al principio sin cambiar el resto del párrafo', 'Eliminar la consecuencia para acortar el texto', 'Sustituir los conectores por repeticiones de las mismas palabras'],
      solution: 'La estructura problema-consecuencia-solución ya es lógica; los conectores ayudan a hacer visible esa relación.',
    },
    {
      prompt: '¿Qué cambio mejora más la cohesión entre «El autobús llegó tarde. Perdimos el inicio de la película»?',
      answer: '«El autobús llegó tarde; por eso, perdimos el inicio de la película.»',
      distractors: ['«El autobús llegó tarde; sin embargo, perdimos el inicio de la película.»', '«El autobús llegó tarde; por ejemplo, perdimos el inicio de la película.»', '«El autobús llegó tarde; además, porque perdimos el inicio de la película.»'],
      solution: 'La segunda idea es consecuencia de la primera, por eso el conector adecuado es «por eso».',
    },
    {
      prompt: 'Al revisar un texto, detectas que dos frases consecutivas repiten casi la misma idea. ¿Qué opción es mejor?',
      answer: 'Fusionarlas o eliminar la repetición manteniendo la información necesaria',
      distractors: ['Añadir una tercera frase que vuelva a expresar la misma idea', 'Cambiar solo algunas palabras y conservar ambas frases', 'Separarlas en párrafos distintos sin modificar el contenido'],
      solution: 'La revisión debe evitar redundancias sin perder información relevante.',
    },
  ],
  L06S02: [
    {
      prompt: 'En «La ciudad despertó bostezando entre sirenas y motores», ¿qué recurso destaca?',
      answer: 'Personificación',
      distractors: ['Metáfora', 'Comparación', 'Hipérbole'],
      solution: 'Se atribuye a la ciudad una acción humana: «bostezar».',
    },
    {
      prompt: 'En «Su voz era terciopelo», ¿qué recurso aparece?',
      answer: 'Metáfora',
      distractors: ['Comparación', 'Personificación', 'Enumeración'],
      solution: 'Se identifica directamente la voz con el terciopelo sin usar «como».',
    },
    {
      prompt: 'En «Corría como si el suelo ardiera bajo sus pies», ¿qué recurso aparece principalmente?',
      answer: 'Comparación',
      distractors: ['Metáfora', 'Personificación', 'Repetición'],
      solution: 'La relación explícita mediante «como si» construye una comparación.',
    },
  ],
  L06S03: [
    {
      prompt: 'En una historia, un personaje intenta ganar una carrera mientras otro modifica el recorrido para impedirlo. ¿Qué relación narrativa se establece?',
      answer: 'El segundo personaje actúa como antagonista respecto al objetivo del primero',
      distractors: ['El segundo personaje funciona como narrador externo', 'Ambos personajes cumplen exactamente la misma función narrativa', 'El primer personaje deja de ser protagonista porque encuentra un obstáculo'],
      solution: 'El antagonista se opone al objetivo del protagonista y contribuye al conflicto.',
    },
    {
      prompt: 'Un narrador cuenta solo lo que ve y oye, sin conocer los pensamientos de los personajes. ¿Qué limitación presenta?',
      answer: 'Su información interna sobre los personajes es limitada',
      distractors: ['No puede describir acciones visibles', 'Debe participar necesariamente como protagonista', 'Conoce mejor que nadie el futuro de todos los personajes'],
      solution: 'Un narrador observador puede relatar hechos externos, pero no accede directamente a todos los pensamientos.',
    },
    {
      prompt: '¿Qué opción describe mejor el conflicto interno de un personaje?',
      answer: 'Duda entre decir la verdad o proteger a un amigo',
      distractors: ['Discute con un rival por el resultado de un partido', 'Se pierde porque una carretera está cortada', 'Intenta escapar de una tormenta que se acerca'],
      solution: 'Un conflicto interno enfrenta deseos, valores o decisiones dentro del propio personaje.',
    },
  ],
  E05S01: [
    {
      prompt: 'Choose the sentence that expresses ability.',
      answer: 'Maya can swim 500 metres without stopping.',
      distractors: ['Maya can use the pool after 4 p.m.', 'Maya can borrow my goggles if she wants.', 'Maya can leave early because the coach agreed.'],
      solution: 'The correct option describes what Maya is able to do; the others express permission.',
    },
    {
      prompt: 'Choose the sentence that expresses permission.',
      answer: 'You can use my calculator during the exercise.',
      distractors: ['You can solve this equation very quickly.', 'You can remember all the formulas.', 'You can do mental arithmetic faster than I can.'],
      solution: 'Here “can” gives permission; the other options describe ability.',
    },
    {
      prompt: 'Complete: “I ___ come to training today because I have a doctor’s appointment.”',
      answer: 'can’t',
      distractors: ['can', 'must', 'am able'],
      solution: 'The appointment prevents attendance, so the negative form “can’t” is required.',
    },
  ],
  E05S02: [
    {
      prompt: 'A sign says “No food in the computer room.” Which sentence matches the rule?',
      answer: 'You mustn’t eat in the computer room.',
      distractors: ['You don’t have to eat in the computer room.', 'You must eat before entering the computer room.', 'You can’t eat there because you are not hungry.'],
      solution: '“Mustn’t” expresses prohibition; “don’t have to” means lack of necessity.',
    },
    {
      prompt: 'Complete: “Students ___ wear safety glasses during this experiment.”',
      answer: 'must',
      distractors: ['mustn’t', 'don’t have to', 'can’t'],
      solution: 'The sentence expresses a compulsory safety rule, so “must” is correct.',
    },
    {
      prompt: 'Which sentence means the action is prohibited?',
      answer: 'You mustn’t touch the exhibits.',
      distractors: ['You don’t have to touch the exhibits.', 'You shouldn’t need to touch the exhibits.', 'You can touch the exhibits if you want.'],
      solution: '“Mustn’t” means the action is not allowed.',
    },
  ],
  E06S04: [
    {
      prompt: 'A notice says: “Tickets bought online cost €8; tickets bought at the door cost €10.” Which paraphrase keeps the meaning?',
      answer: 'Buying the ticket online is €2 cheaper than buying it at the door.',
      distractors: ['All tickets cost €8 if you pay before entering.', 'Tickets at the door cost €2 in total.', 'Online tickets and door tickets cost the same after a discount.'],
      solution: 'The paraphrase preserves the price difference without changing the conditions.',
    },
    {
      prompt: 'Original: “The library closes at 6 p.m. on Fridays, one hour earlier than usual.” Which paraphrase is accurate?',
      answer: 'On Fridays, the library closes at 6 p.m. instead of its usual 7 p.m.',
      distractors: ['The library normally closes at 6 p.m. and stays open later on Fridays.', 'The library closes for one hour every Friday at 6 p.m.', 'On Fridays, the library opens one hour earlier than usual.'],
      solution: 'The correct paraphrase keeps both the Friday closing time and the one-hour difference.',
    },
    {
      prompt: 'A message says: “Bring a packed lunch because the café will be closed.” What is the best restatement?',
      answer: 'You should bring your own lunch since you won’t be able to buy food at the café.',
      distractors: ['You should bring lunch only if the café is open.', 'The café will sell packed lunches instead of its usual food.', 'You may leave your lunch at home because the café is closed.'],
      solution: 'The restatement preserves the cause-and-effect relationship in the original message.',
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

export function generateExtraLanguageDistractorVariant4(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  if (difficulty < 3) return null
  const cards = CARDS[skill.id]
  if (!cards?.length) return null

  const index = hash(seed + difficulty * 367) % cards.length
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
    tags: [skill.generator_key, 'plausible_distractors', `family:language-distractor-extra4:${skill.id}:d${difficulty}:f${index}`],
  }
}
