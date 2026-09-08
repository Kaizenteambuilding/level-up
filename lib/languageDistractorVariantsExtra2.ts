import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = { prompt: string; answer: string; distractors: [string, string, string]; solution: string }

const CARDS: Record<string, Card[]> = {
  L03S01: [
    {
      prompt: 'En «El sendero era estrecho», ¿qué palabra puede sustituir mejor a «estrecho» sin cambiar el sentido principal?',
      answer: 'angosto',
      distractors: ['corto', 'empinado', 'irregular'],
      solution: '«Angosto» mantiene la idea de poca anchura; las otras opciones describen longitud, pendiente o superficie.',
    },
    {
      prompt: '¿Cuál es el antónimo más preciso de «escaso» en «había escaso alimento»?',
      answer: 'abundante',
      distractors: ['suficiente', 'variado', 'nutritivo'],
      solution: '«Abundante» expresa directamente la oposición entre poca y mucha cantidad.',
    },
    {
      prompt: 'En «Su explicación fue clara», ¿qué sinónimo conserva mejor el significado de «clara»?',
      answer: 'comprensible',
      distractors: ['breve', 'correcta', 'detallada'],
      solution: 'En este contexto, «clara» significa fácil de entender; una explicación puede ser breve, correcta o detallada sin ser necesariamente clara.',
    },
  ],
  L03S03: [
    {
      prompt: '¿Qué palabra pertenece a la misma familia léxica que «mar»?',
      answer: 'marítimo',
      distractors: ['marea', 'marfil', 'marrón'],
      solution: '«Marítimo» deriva del mismo lexema relacionado con «mar»; las otras palabras se parecen gráficamente o se relacionan semánticamente sin pertenecer a la misma familia.',
    },
    {
      prompt: '¿Qué pareja pertenece a la misma familia léxica?',
      answer: 'pan / panadero',
      distractors: ['sol / sombra', 'flor / jardín', 'casa / edificio'],
      solution: '«Panadero» se forma a partir del lexema «pan-»; las otras parejas están relacionadas por significado, no por derivación léxica.',
    },
    {
      prompt: '¿Cuál de estas palabras comparte lexema con «flor»?',
      answer: 'florero',
      distractors: ['jardín', 'pétalo', 'primavera'],
      solution: '«Florero» contiene el lexema «flor-»; las otras palabras están asociadas al mismo campo semántico, pero no pertenecen a su familia léxica.',
    },
  ],
  E01S02: [
    {
      prompt: 'Complete: “Laura and Marta ___ my classmates.”',
      answer: 'are',
      distractors: ['is', 'am', 'be'],
      solution: 'A plural subject takes “are”.',
    },
    {
      prompt: 'Choose the correct sentence.',
      answer: 'He is my new English teacher.',
      distractors: ['He are my new English teacher.', 'Him is my new English teacher.', 'He be my new English teacher.'],
      solution: 'The subject pronoun “he” takes “is” in the present tense of “be”.',
    },
    {
      prompt: 'Complete: “___ are from Italy, but our teacher is from Spain.”',
      answer: 'We',
      distractors: ['Us', 'Our', 'Ours'],
      solution: 'The blank needs a subject pronoun before the verb “are”: “We”.',
    },
  ],
  E01S03: [
    {
      prompt: 'Complete: “Sara has a brother. ___ name is Daniel.”',
      answer: 'His',
      distractors: ['Her', 'He', 'Him'],
      solution: '“His” is the possessive adjective referring to the brother, Daniel.',
    },
    {
      prompt: 'Choose the correct sentence.',
      answer: 'We have got two bicycles.',
      distractors: ['We has got two bicycles.', 'We have two bicycles got.', 'Us have got two bicycles.'],
      solution: 'With “we”, use “have got”; “we” is the subject form.',
    },
    {
      prompt: 'Complete: “This is Anna. ___ parents are teachers.”',
      answer: 'Her',
      distractors: ['His', 'She', 'Hers'],
      solution: '“Her” is the possessive adjective used before the noun “parents”.',
    },
  ],
  E02S02: [
    {
      prompt: 'Choose the most natural sentence.',
      answer: 'I usually walk to school.',
      distractors: ['I walk usually to school.', 'I am usually walk to school.', 'Usually I walking to school.'],
      solution: 'Frequency adverbs normally go before the main verb in present simple.',
    },
    {
      prompt: 'Complete: “She is ___ late for class; maybe once or twice a year.”',
      answer: 'hardly ever',
      distractors: ['often', 'usually', 'always'],
      solution: '“Hardly ever” matches a very low frequency.',
    },
    {
      prompt: 'Choose the sentence that means the activity happens on most days, but not every day.',
      answer: 'He usually does his homework after dinner.',
      distractors: ['He always does his homework after dinner.', 'He never does his homework after dinner.', 'He hardly ever does his homework after dinner.'],
      solution: '“Usually” means frequently or on most occasions, but not necessarily every time.',
    },
  ],
  E02S03: [
    {
      prompt: 'Choose the correct question about a routine.',
      answer: 'Does your sister play basketball on Fridays?',
      distractors: ['Do your sister play basketball on Fridays?', 'Does your sister plays basketball on Fridays?', 'Is your sister play basketball on Fridays?'],
      solution: 'Third-person singular present simple questions use “does” plus the base verb.',
    },
    {
      prompt: 'Choose the correct short answer to “Do they live near here?”',
      answer: 'Yes, they do.',
      distractors: ['Yes, they are.', 'Yes, they does.', 'Yes, they live.'],
      solution: 'A “Do they…?” question takes “do” in the short answer.',
    },
    {
      prompt: 'Choose the correct negative short answer to “Does Tom like maths?”',
      answer: 'No, he doesn’t.',
      distractors: ['No, he isn’t.', 'No, he don’t.', 'No, he doesn’t like.'],
      solution: 'With “Does Tom…?”, the negative short answer is “No, he doesn’t.”',
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

export function generateExtraLanguageDistractorVariant2(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  if (difficulty < 3) return null
  const cards = CARDS[skill.id]
  if (!cards?.length) return null

  const index = hash(seed + difficulty * 293) % cards.length
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
    tags: [skill.generator_key, 'plausible_distractors', `family:language-distractor-extra2:${skill.id}:d${difficulty}:f${index}`],
  }
}
