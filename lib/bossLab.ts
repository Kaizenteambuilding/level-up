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
    intro: 'Durante todo el trimestre has reunido energía, precisión y estrategia. Ahora el Núcleo te exige demostrar que puedes combinarlo todo.',
    icon: '🧮',
    questions: [
      { area: 'Porcentajes', prompt: '¿Cuánto es el 25% de 240?', options: ['40', '50', '60', '80'], answer: 2 },
      { area: 'Álgebra', prompt: 'Resuelve: 3x + 5 = 20', options: ['x = 3', 'x = 5', 'x = 8', 'x = 15'], answer: 1 },
      { area: 'Geometría', prompt: 'Un triángulo tiene base 8 y altura 5. ¿Cuál es su área?', options: ['20', '26', '40', '80'], answer: 0 },
      { area: 'Fracciones y decimales', prompt: '¿Cuál es la fracción equivalente a 0,75?', options: ['1/4', '2/3', '3/4', '4/5'], answer: 2 },
      { area: 'Proporcionalidad', prompt: 'Si 4 cuadernos cuestan 12 €, ¿cuánto cuestan 7 al mismo precio?', options: ['18 €', '21 €', '24 €', '28 €'], answer: 1 },
      { area: 'Enteros', prompt: 'Calcula: -7 + 12 - 4', options: ['-3', '1', '5', '9'], answer: 1 },
      { area: 'Potencias', prompt: '¿Cuál es el valor de 2³ · 2²?', options: ['16', '24', '32', '64'], answer: 2 },
      { area: 'Ecuaciones', prompt: 'Si 5(x - 2) = 25, ¿cuánto vale x?', options: ['3', '5', '7', '10'], answer: 2 },
      { area: 'Geometría', prompt: 'Un rectángulo mide 12 cm de largo y 7 cm de ancho. ¿Cuál es su perímetro?', options: ['19 cm', '38 cm', '84 cm', '42 cm'], answer: 1 },
      { area: 'Proporcionalidad', prompt: 'Un coche recorre 180 km en 3 horas a ritmo constante. ¿Cuántos km recorre en 5 horas?', options: ['240', '270', '300', '360'], answer: 2 },
      { area: 'Fracciones', prompt: 'Calcula: 2/3 + 1/6', options: ['1/2', '2/9', '5/6', '1'], answer: 2 },
      { area: 'Estadística', prompt: 'La media de 6, 8, 10 y 12 es...', options: ['8', '9', '10', '11'], answer: 1 },
      { area: 'Ángulos', prompt: 'Dos ángulos de un triángulo miden 45° y 65°. ¿Cuánto mide el tercero?', options: ['60°', '70°', '80°', '90°'], answer: 1 },
      { area: 'Decimales', prompt: '¿Qué número es mayor?', options: ['0,58', '0,605', '0,59', '0,6'], answer: 1 },
      { area: 'Problemas', prompt: 'Una entrada cuesta 18 €. Con un descuento del 20%, ¿cuál es el precio final?', options: ['14,40 €', '15 €', '16,20 €', '12,60 €'], answer: 0 },
    ],
  },
  {
    subjectId: 'spanish',
    name: 'La Esfinge de las Palabras',
    intro: 'La Esfinge ha guardado cada palabra, cada texto y cada regla del trimestre. Solo quien comprende de verdad puede romper sus enigmas.',
    icon: '📖',
    questions: [
      { area: 'Sintaxis', prompt: '¿Cuál es el núcleo del sujeto en «Los exploradores valientes avanzaron»?', options: ['Los', 'exploradores', 'valientes', 'avanzaron'], answer: 1 },
      { area: 'Clases de palabras', prompt: '¿Qué palabra es un adverbio?', options: ['rápido', 'rapidez', 'rápidamente', 'acelerar'], answer: 2 },
      { area: 'Ortografía', prompt: '¿Cuál está correctamente acentuada?', options: ['dificil', 'arbol', 'camión', 'lapiz'], answer: 2 },
      { area: 'Narración', prompt: 'En una narración, ¿qué elemento indica dónde sucede la acción?', options: ['Narrador', 'Espacio', 'Tiempo verbal', 'Tema'], answer: 1 },
      { area: 'Vocabulario', prompt: '¿Cuál es un sinónimo de «preciso» en el sentido de exacto?', options: ['ambiguo', 'exacto', 'lejano', 'rápido'], answer: 1 },
      { area: 'Morfología', prompt: 'En «cantábamos», ¿qué información aporta la terminación verbal?', options: ['Solo género', 'Persona, número, tiempo y modo', 'Solo número', 'Solo significado léxico'], answer: 1 },
      { area: 'Ortografía', prompt: '¿Qué opción está correctamente escrita?', options: ['tubo una idea', 'tuvo una idea', 'estubo allí', 'andubo rápido'], answer: 1 },
      { area: 'Sintaxis', prompt: 'En «Marta entregó el libro a Pablo», ¿cuál es el complemento indirecto?', options: ['Marta', 'el libro', 'a Pablo', 'entregó'], answer: 2 },
      { area: 'Literatura', prompt: '¿Qué recurso consiste en exagerar intencionadamente una idea?', options: ['Metáfora', 'Hipérbole', 'Personificación', 'Anáfora'], answer: 1 },
      { area: 'Comprensión', prompt: 'La idea principal de un texto es...', options: ['el dato más largo', 'la información central que organiza el texto', 'la primera frase siempre', 'una opinión del lector'], answer: 1 },
      { area: 'Clases de palabras', prompt: '¿Cuál de estas palabras es un pronombre?', options: ['mesa', 'ellos', 'bonito', 'correr'], answer: 1 },
      { area: 'Acentuación', prompt: '¿Por qué lleva tilde «rápido»?', options: ['Es aguda terminada en vocal', 'Es llana terminada en vocal', 'Es esdrújula', 'Es monosílaba'], answer: 2 },
      { area: 'Conectores', prompt: '¿Qué conector expresa contraste?', options: ['además', 'por tanto', 'sin embargo', 'porque'], answer: 2 },
      { area: 'Vocabulario', prompt: '¿Cuál es el antónimo de «escaso»?', options: ['breve', 'abundante', 'pequeño', 'difícil'], answer: 1 },
      { area: 'Narración', prompt: 'Un narrador que conoce pensamientos y sentimientos de todos los personajes es...', options: ['protagonista', 'testigo', 'omnisciente', 'objetivo'], answer: 2 },
    ],
  },
  {
    subjectId: 'english',
    name: 'The Time Keeper',
    intro: 'The Time Keeper has sealed the final gate. Grammar, vocabulary and comprehension must work together if you want to stop the clock.',
    icon: '⏳',
    questions: [
      { area: 'Present simple', prompt: 'Choose the correct form: She ___ to school every day.', options: ['go', 'goes', 'going', 'gone'], answer: 1 },
      { area: 'Past simple', prompt: 'What is the past tense of “buy”?', options: ['buyed', 'bought', 'buys', 'buying'], answer: 1 },
      { area: 'There is / there are', prompt: 'Choose the correct option: There ___ two books on the table.', options: ['is', 'are', 'am', 'be'], answer: 1 },
      { area: 'Vocabulary', prompt: 'What does “usually” mean?', options: ['nunca', 'normalmente', 'mañana', 'quizá'], answer: 1 },
      { area: 'Present perfect', prompt: 'Complete: I have lived here ___ 2022.', options: ['for', 'since', 'during', 'at'], answer: 1 },
      { area: 'Past simple', prompt: 'Choose the correct sentence.', options: ['We goed home early.', 'We went home early.', 'We go home yesterday.', 'We have went home.'], answer: 1 },
      { area: 'Comparatives', prompt: 'Complete: A train is usually ___ than a bicycle.', options: ['fast', 'faster', 'fastest', 'more fast'], answer: 1 },
      { area: 'Modal verbs', prompt: 'Choose the best option: You ___ wear a seat belt in a car.', options: ['must', 'might not', 'can to', 'are'], answer: 0 },
      { area: 'Question forms', prompt: 'Choose the correct question.', options: ['Where you live?', 'Where do you live?', 'Where does you live?', 'Where are live you?'], answer: 1 },
      { area: 'Present continuous', prompt: 'Look! The children ___ in the garden.', options: ['play', 'played', 'are playing', 'plays'], answer: 2 },
      { area: 'Vocabulary', prompt: 'Which word means “preocupado”?', options: ['worried', 'excited', 'quiet', 'proud'], answer: 0 },
      { area: 'Future', prompt: 'Complete: I think it ___ rain tomorrow.', options: ['will', 'did', 'has', 'was'], answer: 0 },
      { area: 'Prepositions', prompt: 'The meeting starts ___ 9 o’clock.', options: ['in', 'on', 'at', 'by'], answer: 2 },
      { area: 'Present perfect', prompt: 'Choose the correct option: She has ___ finished her homework.', options: ['yet', 'already', 'ago', 'last'], answer: 1 },
      { area: 'Reading', prompt: 'If a notice says “Keep off the grass”, what should you do?', options: ['Sit on the grass', 'Do not walk on the grass', 'Water the grass', 'Cut the grass'], answer: 1 },
    ],
  },
  {
    subjectId: 'geography_history',
    name: 'El Titán de las Eras',
    intro: 'Civilizaciones, mapas y siglos enteros forman su armadura. Cada respuesta correcta abre una grieta en el tiempo.',
    icon: '🏺',
    questions: [
      { area: 'Geografía física', prompt: '¿Qué línea imaginaria divide la Tierra en hemisferio norte y sur?', options: ['Meridiano de Greenwich', 'Ecuador', 'Trópico de Cáncer', 'Círculo polar'], answer: 1 },
      { area: 'Roma', prompt: '¿Qué civilización construyó una amplia red de calzadas por Europa?', options: ['Egipcia', 'Romana', 'Maya', 'China'], answer: 1 },
      { area: 'Cartografía', prompt: '¿Qué indica la escala de un mapa?', options: ['La altitud máxima', 'La relación entre mapa y realidad', 'La población', 'El clima'], answer: 1 },
      { area: 'Edad Media', prompt: '¿Cuál fue una característica del feudalismo europeo?', options: ['Sufragio universal', 'Relaciones de vasallaje', 'Industrialización', 'Internet'], answer: 1 },
      { area: 'Fuentes históricas', prompt: '¿Qué fuente es primaria para estudiar una época histórica?', options: ['Un manual actual', 'Una moneda de la época', 'Un resumen escolar', 'Una novela reciente'], answer: 1 },
      { area: 'Prehistoria', prompt: '¿Qué cambio caracteriza el Neolítico?', options: ['La desaparición del fuego', 'La agricultura y la ganadería', 'La invención de internet', 'El abandono de poblados'], answer: 1 },
      { area: 'Egipto', prompt: '¿Junto a qué río se desarrolló la civilización egipcia?', options: ['Danubio', 'Nilo', 'Tigris', 'Ebro'], answer: 1 },
      { area: 'Grecia', prompt: '¿En qué polis se desarrolló una forma temprana de democracia?', options: ['Esparta', 'Atenas', 'Roma', 'Cartago'], answer: 1 },
      { area: 'Roma', prompt: '¿Qué lengua difundió Roma por gran parte de su imperio occidental?', options: ['Latín', 'Árabe', 'Sánscrito', 'Chino'], answer: 0 },
      { area: 'Edad Media', prompt: '¿Qué institución tuvo una gran influencia cultural en la Europa medieval?', options: ['La Iglesia', 'La ONU', 'La bolsa moderna', 'La televisión'], answer: 0 },
      { area: 'Cartografía', prompt: '¿Qué coordenada mide la distancia al norte o al sur del Ecuador?', options: ['Longitud', 'Latitud', 'Altitud', 'Escala'], answer: 1 },
      { area: 'Relieve', prompt: 'Una meseta es...', options: ['una llanura elevada', 'una depresión marina', 'un río corto', 'una isla volcánica siempre'], answer: 0 },
      { area: 'Clima', prompt: '¿Qué elemento climático se mide con un pluviómetro?', options: ['Temperatura', 'Precipitaciones', 'Presión', 'Viento'], answer: 1 },
      { area: 'Población', prompt: 'La densidad de población relaciona...', options: ['habitantes y superficie', 'nacimientos y muertes únicamente', 'edad y empleo', 'ríos y montañas'], answer: 0 },
      { area: 'Cronología', prompt: '¿Qué siglo corresponde al año 1492?', options: ['XIII', 'XIV', 'XV', 'XVI'], answer: 2 },
    ],
  },
  {
    subjectId: 'biology_geology',
    name: 'La Quimera de Gaia',
    intro: 'La Quimera reúne vida, roca, planeta y ecosistemas en un solo cuerpo. Para vencerla tendrás que conectar todo lo aprendido.',
    icon: '🌋',
    questions: [
      { area: 'La célula', prompt: '¿Cuál es la unidad básica de los seres vivos?', options: ['Tejido', 'Órgano', 'Célula', 'Sistema'], answer: 2 },
      { area: 'Fotosíntesis', prompt: '¿Qué orgánulo realiza principalmente la fotosíntesis?', options: ['Núcleo', 'Cloroplasto', 'Ribosoma', 'Mitocondria'], answer: 1 },
      { area: 'Rocas', prompt: '¿Qué tipo de roca se forma al enfriarse el magma?', options: ['Sedimentaria', 'Metamórfica', 'Ígnea', 'Caliza exclusivamente'], answer: 2 },
      { area: 'Ecosistemas', prompt: 'En una cadena trófica, las plantas son normalmente…', options: ['Consumidores', 'Descomponedores', 'Productores', 'Depredadores'], answer: 2 },
      { area: 'Geología', prompt: '¿Qué capa sólida externa de la Tierra incluye la corteza y parte del manto superior?', options: ['Atmósfera', 'Litosfera', 'Hidrosfera', 'Núcleo externo'], answer: 1 },
      { area: 'La célula', prompt: '¿Qué estructura controla principalmente las actividades de una célula eucariota?', options: ['Núcleo', 'Pared celular', 'Vacuola', 'Membrana únicamente'], answer: 0 },
      { area: 'Nutrición', prompt: '¿Qué aparato transforma los alimentos y absorbe nutrientes?', options: ['Respiratorio', 'Digestivo', 'Excretor', 'Locomotor'], answer: 1 },
      { area: 'Ecosistemas', prompt: '¿Qué relación existe cuando dos organismos compiten por el mismo recurso limitado?', options: ['Mutualismo', 'Competencia', 'Parasitismo siempre', 'Fotosíntesis'], answer: 1 },
      { area: 'Biodiversidad', prompt: 'La biodiversidad describe...', options: ['solo el número de árboles', 'la variedad de seres vivos y ecosistemas', 'solo animales vertebrados', 'la temperatura del planeta'], answer: 1 },
      { area: 'Atmósfera', prompt: '¿Qué gas es el más abundante en la atmósfera terrestre?', options: ['Oxígeno', 'Nitrógeno', 'Dióxido de carbono', 'Hidrógeno'], answer: 1 },
      { area: 'Geología', prompt: '¿Qué proceso puede transformar una roca por presión y temperatura sin fundirla?', options: ['Erosión', 'Metamorfismo', 'Evaporación', 'Sedimentación únicamente'], answer: 1 },
      { area: 'Tectónica', prompt: 'La mayoría de terremotos se concentran...', options: ['en límites de placas tectónicas', 'solo en desiertos', 'en el centro de todos los continentes', 'solo bajo ríos'], answer: 0 },
      { area: 'Agua', prompt: 'En el ciclo del agua, el paso de líquido a vapor se llama...', options: ['Condensación', 'Evaporación', 'Precipitación', 'Infiltración'], answer: 1 },
      { area: 'Clasificación', prompt: '¿Cuál de estos animales es vertebrado?', options: ['Medusa', 'Araña', 'Salmón', 'Caracol'], answer: 2 },
      { area: 'Ecología', prompt: '¿Qué ocurriría primero si desaparecieran los productores de una cadena trófica?', options: ['Aumentaría la energía disponible', 'Los consumidores perderían su fuente básica de energía', 'Nada cambiaría', 'Aparecerían más productores automáticamente'], answer: 1 },
    ],
  },
]

export function bossForSubject(subjectId: string) {
  return SUBJECT_BOSSES.find((boss) => boss.subjectId === subjectId) ?? null
}
