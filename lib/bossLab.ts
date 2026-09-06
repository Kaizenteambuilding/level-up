import type { SubjectId } from './subjects'

export type BossQuestion = {
  prompt: string
  options: string[]
  answer: number
  area: string
}

export type SubjectBoss = {
  subjectId: SubjectId
  name: string
  intro: string
  icon: string
  questions: BossQuestion[]
}

export const BOSS_PASS_PERCENT = 80
export const BOSS_COOLDOWN_HOURS = 24
export const BOSS_REQUIRED_PROGRESS_PERCENT = 80
export const BOSS_REQUIRED_STREAK_DAYS = 7

export const SUBJECT_BOSSES: SubjectBoss[] = [
  {
    subjectId: 'math',
    name: 'El Guardián del Núcleo',
    intro: 'Solo cae ante quien domina cálculo, proporciones, álgebra y geometría.',
    icon: '🧮',
    questions: [
      { area: 'Porcentajes', prompt: '¿Cuánto es el 25% de 240?', options: ['40', '50', '60', '80'], answer: 2 },
      { area: 'Álgebra', prompt: 'Resuelve: 3x + 5 = 20', options: ['x = 3', 'x = 5', 'x = 8', 'x = 15'], answer: 1 },
      { area: 'Geometría', prompt: 'Un triángulo tiene base 8 y altura 5. ¿Cuál es su área?', options: ['20', '26', '40', '80'], answer: 0 },
      { area: 'Fracciones y decimales', prompt: '¿Cuál es la fracción equivalente a 0,75?', options: ['1/4', '2/3', '3/4', '4/5'], answer: 2 },
      { area: 'Proporcionalidad', prompt: 'Si 4 cuadernos cuestan 12 €, ¿cuánto cuestan 7 al mismo precio?', options: ['18 €', '21 €', '24 €', '28 €'], answer: 1 },
    ],
  },
  {
    subjectId: 'spanish',
    name: 'La Esfinge de las Palabras',
    intro: 'Comprensión, gramática y vocabulario son las claves para vencerla.',
    icon: '📖',
    questions: [
      { area: 'Sintaxis', prompt: '¿Cuál es el núcleo del sujeto en «Los exploradores valientes avanzaron»?', options: ['Los', 'exploradores', 'valientes', 'avanzaron'], answer: 1 },
      { area: 'Clases de palabras', prompt: '¿Qué palabra es un adverbio?', options: ['rápido', 'rapidez', 'rápidamente', 'acelerar'], answer: 2 },
      { area: 'Ortografía', prompt: '¿Cuál está correctamente acentuada?', options: ['dificil', 'arbol', 'camión', 'lapiz'], answer: 2 },
      { area: 'Narración', prompt: 'En una narración, ¿qué elemento indica dónde sucede la acción?', options: ['Narrador', 'Espacio', 'Tiempo verbal', 'Tema'], answer: 1 },
      { area: 'Vocabulario', prompt: '¿Cuál es un sinónimo de «preciso» en el sentido de exacto?', options: ['ambiguo', 'exacto', 'lejano', 'rápido'], answer: 1 },
    ],
  },
  {
    subjectId: 'english',
    name: 'The Time Keeper',
    intro: 'Grammar, vocabulary and comprehension will break its shield.',
    icon: '⏳',
    questions: [
      { area: 'Present simple', prompt: 'Choose the correct form: She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answer: 1 },
      { area: 'Past simple', prompt: 'What is the past tense of “buy”?', options: ['buyed', 'bought', 'buys', 'buying'], answer: 1 },
      { area: 'There is / there are', prompt: 'Choose the correct option: There ___ two books on the table.', options: ['is', 'are', 'am', 'be'], answer: 1 },
      { area: 'Vocabulary', prompt: 'What does “usually” mean?', options: ['nunca', 'normalmente', 'mañana', 'quizá'], answer: 1 },
      { area: 'Present perfect', prompt: 'Complete: I have lived here ___ 2022.', options: ['for', 'since', 'during', 'at'], answer: 1 },
    ],
  },
  {
    subjectId: 'geography_history',
    name: 'El Titán de las Eras',
    intro: 'Mapas, sociedades y procesos históricos forman su armadura.',
    icon: '🏺',
    questions: [
      { area: 'Geografía física', prompt: '¿Qué línea imaginaria divide la Tierra en hemisferio norte y sur?', options: ['Meridiano de Greenwich', 'Ecuador', 'Trópico de Cáncer', 'Círculo polar'], answer: 1 },
      { area: 'Roma', prompt: '¿Qué civilización construyó una amplia red de calzadas por Europa?', options: ['Egipcia', 'Romana', 'Maya', 'China'], answer: 1 },
      { area: 'Cartografía', prompt: '¿Qué indica la escala de un mapa?', options: ['La altitud máxima', 'La relación entre mapa y realidad', 'La población', 'El clima'], answer: 1 },
      { area: 'Edad Media', prompt: '¿Cuál fue una característica del feudalismo europeo?', options: ['Sufragio universal', 'Relaciones de vasallaje', 'Industrialización', 'Internet'], answer: 1 },
      { area: 'Fuentes históricas', prompt: '¿Qué fuente es primaria para estudiar una época histórica?', options: ['Un manual actual', 'Una moneda de la época', 'Un resumen escolar', 'Una novela reciente'], answer: 1 },
    ],
  },
  {
    subjectId: 'biology_geology',
    name: 'La Quimera de Gaia',
    intro: 'Células, ecosistemas y planeta se combinan en un solo desafío.',
    icon: '🌋',
    questions: [
      { area: 'La célula', prompt: '¿Cuál es la unidad básica de los seres vivos?', options: ['Tejido', 'Órgano', 'Célula', 'Sistema'], answer: 2 },
      { area: 'Fotosíntesis', prompt: '¿Qué orgánulo realiza principalmente la fotosíntesis?', options: ['Núcleo', 'Cloroplasto', 'Ribosoma', 'Mitocondria'], answer: 1 },
      { area: 'Rocas', prompt: '¿Qué tipo de roca se forma al enfriarse el magma?', options: ['Sedimentaria', 'Metamórfica', 'Ígnea', 'Caliza exclusivamente'], answer: 2 },
      { area: 'Ecosistemas', prompt: 'En una cadena trófica, las plantas son normalmente…', options: ['Consumidores', 'Descomponedores', 'Productores', 'Depredadores'], answer: 2 },
      { area: 'Geología', prompt: '¿Qué capa sólida externa de la Tierra incluye la corteza y parte del manto superior?', options: ['Atmósfera', 'Litosfera', 'Hidrosfera', 'Núcleo externo'], answer: 1 },
    ],
  },
]

export function bossForSubject(subjectId: string) {
  return SUBJECT_BOSSES.find((boss) => boss.subjectId === subjectId) ?? null
}
