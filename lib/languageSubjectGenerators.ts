import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Item = { prompt: string; answer: string; distractors: [string, string, string]; solution: string; tag?: string }

const BANK: Record<string, Item[]> = {
  es_main_idea: [
    { prompt: 'Lee: «El huerto escolar permite aprender ciencias, trabajar en equipo y cultivar alimentos». ¿Cuál es la idea principal?', answer: 'El huerto escolar aporta varios aprendizajes', distractors: ['Solo sirve para cultivar alimentos','La ciencia se estudia únicamente fuera del aula','Trabajar en equipo impide aprender'], solution: 'La frase reúne varios beneficios del huerto; esa es la idea que engloba los detalles.' },
    { prompt: 'Lee: «Cada tarde, Nora pasea a su perro por el parque. Allí ambos hacen ejercicio y conocen a otros vecinos». ¿Qué idea resume mejor el texto?', answer: 'El paseo diario beneficia a Nora y a su perro', distractors: ['Nora quiere mudarse de barrio','El parque está vacío por las tardes','El perro no necesita ejercicio'], solution: 'La idea principal reúne la rutina y sus beneficios.' },
  ],
  es_communication_intent: [
    { prompt: '«Por favor, entrega el trabajo antes del viernes». ¿Cuál es la intención principal?', answer: 'Pedir o indicar una acción', distractors: ['Narrar un recuerdo','Describir un paisaje','Expresar una duda científica'], solution: 'El emisor solicita que el receptor realice una acción.' },
    { prompt: '«¡Qué alegría verte otra vez!». ¿Qué intención predomina?', answer: 'Expresar una emoción', distractors: ['Dar instrucciones','Definir un concepto','Informar de una norma'], solution: 'La exclamación comunica alegría.' },
  ],
  es_inference: [
    { prompt: '«Marta entró en casa chorreando y dejó el paraguas junto a la puerta». ¿Qué podemos inferir?', answer: 'Estaba lloviendo', distractors: ['Había nevado dentro de casa','Marta venía de nadar necesariamente','El paraguas estaba roto'], solution: '“Chorreando” y el paraguas son pistas compatibles con lluvia.' },
    { prompt: '«Leo miró el reloj tres veces y empezó a guardar sus cosas deprisa». ¿Qué es razonable inferir?', answer: 'Tenía prisa o debía marcharse pronto', distractors: ['No sabía leer la hora','Acababa de despertarse','Quería perder sus cosas'], solution: 'Mirar repetidamente el reloj y recoger deprisa sugiere prisa.' },
  ],
  es_cohesion: [
    { prompt: 'Completa: «Estudió mucho; ___, aprobó el examen».', answer: 'por eso', distractors: ['sin embargo','aunque','en cambio'], solution: '“Por eso” expresa consecuencia.' },
    { prompt: 'Completa: «Quería salir; ___, empezó a llover».', answer: 'sin embargo', distractors: ['por tanto','porque','además de'], solution: '“Sin embargo” introduce contraste.' },
  ],
  es_word_classes: [
    { prompt: 'En «La casa azul parece tranquila», ¿qué clase de palabra es «azul»?', answer: 'Adjetivo', distractors: ['Sustantivo','Verbo','Adverbio'], solution: '“Azul” expresa una cualidad del sustantivo “casa”.' },
    { prompt: 'En «Ellos llegaron ayer», ¿qué clase de palabra es «ayer»?', answer: 'Adverbio', distractors: ['Pronombre','Verbo','Determinante'], solution: '“Ayer” indica una circunstancia de tiempo.' },
  ],
  es_subject_predicate: [
    { prompt: 'En «Mis amigos prepararon la merienda», ¿cuál es el sujeto?', answer: 'Mis amigos', distractors: ['prepararon','la merienda','prepararon la merienda'], solution: '“Mis amigos” concuerda en número y persona con el verbo.' },
    { prompt: 'En «El tren llegó puntual», ¿cuál es el predicado?', answer: 'llegó puntual', distractors: ['El tren','puntual','tren llegó'], solution: 'El predicado contiene el verbo y lo que se dice del sujeto.' },
  ],
  es_phrase_heads: [
    { prompt: 'En el grupo nominal «los libros antiguos», ¿cuál es el núcleo?', answer: 'libros', distractors: ['los','antiguos','los antiguos'], solution: 'El núcleo de un grupo nominal es normalmente el sustantivo o pronombre.' },
    { prompt: 'En «corre muy rápido», ¿cuál es el núcleo del grupo verbal?', answer: 'corre', distractors: ['muy','rápido','muy rápido'], solution: 'El núcleo del grupo verbal es el verbo.' },
  ],
  es_agreement: [
    { prompt: 'Elige la opción con concordancia correcta.', answer: 'Las ventanas abiertas', distractors: ['Las ventana abiertas','La ventanas abierta','Los ventanas abiertos'], solution: 'Determinante, sustantivo y adjetivo concuerdan en femenino plural.' },
    { prompt: 'Completa correctamente: «Mi hermano y yo ___ al instituto».', answer: 'vamos', distractors: ['va','voy','vais'], solution: '“Mi hermano y yo” equivale a primera persona del plural.' },
  ],
  es_syn_ant: [
    { prompt: '¿Cuál es un sinónimo de «rápido» en «un coche rápido»?', answer: 'veloz', distractors: ['lento','quieto','pesado'], solution: '“Veloz” comparte el significado de rapidez.' },
    { prompt: '¿Cuál es un antónimo de «escaso»?', answer: 'abundante', distractors: ['pequeño','breve','limitado'], solution: '“Abundante” expresa la idea opuesta a “escaso”.' },
  ],
  es_polysemy: [
    { prompt: 'En «Me senté en el banco del parque», ¿qué significa «banco»?', answer: 'Asiento para varias personas', distractors: ['Entidad financiera','Conjunto de peces','Mesa de trabajo'], solution: 'El contexto “del parque” indica que se trata de un asiento.' },
    { prompt: 'En «El banco aprobó el préstamo», ¿qué significa «banco»?', answer: 'Entidad financiera', distractors: ['Asiento','Banco de arena','Grupo de peces'], solution: '“Préstamo” sitúa la palabra en el contexto financiero.' },
  ],
  es_word_families: [
    { prompt: '¿Qué palabra pertenece a la familia léxica de «pan»?', answer: 'panadero', distractors: ['pañuelo','pantalón','pared'], solution: '“Panadero” comparte el lexema “pan-”.' },
    { prompt: '¿Qué palabra pertenece a la familia de «mar»?', answer: 'marino', distractors: ['marrón','martillo','marca'], solution: '“Marino” deriva del lexema relacionado con “mar”.' },
  ],
  es_word_formation: [
    { prompt: 'En «deshacer», ¿qué elemento se añade a «hacer»?', answer: 'Un prefijo', distractors: ['Un sufijo','Una desinencia de plural','Ningún elemento'], solution: '“des-” aparece delante de la base y funciona como prefijo.' },
    { prompt: '¿Cómo se forma «felicidad» a partir de «feliz»?', answer: 'Mediante un sufijo', distractors: ['Mediante un prefijo','Por composición','Por abreviación'], solution: 'El sufijo “-idad” crea un sustantivo.' },
  ],
  es_accentuation: [
    { prompt: '¿Qué palabra debe llevar tilde?', answer: 'camión', distractors: ['pared','reloj','animal'], solution: '“camión” es aguda terminada en -n.' },
    { prompt: '¿Cuál está correctamente acentuada?', answer: 'música', distractors: ['musica','arboles','camion'], solution: '“música” es esdrújula y siempre lleva tilde.' },
  ],
  es_spelling_letters: [
    { prompt: 'Elige la palabra correctamente escrita.', answer: 'viaje', distractors: ['biage','viage','biaje'], solution: '“viaje” se escribe con v y j.' },
    { prompt: 'Elige la palabra correctamente escrita.', answer: 'haber', distractors: ['aver','haver','aber'], solution: 'El infinitivo “haber” se escribe con h y b.' },
  ],
  es_punctuation: [
    { prompt: '¿Qué opción puntúa correctamente una enumeración?', answer: 'Compré pan, leche, fruta y arroz.', distractors: ['Compré pan leche fruta y arroz.','Compré, pan leche, fruta y arroz.','Compré pan; leche fruta y arroz?'], solution: 'Los elementos de una enumeración se separan con comas.' },
    { prompt: '¿Qué opción usa correctamente los signos de interrogación?', answer: '¿Vienes mañana?', distractors: ['Vienes mañana?','¿Vienes mañana.','Vienes ¿mañana?'], solution: 'En español la interrogación lleva signo de apertura y cierre.' },
  ],
  es_spelling_edit: [
    { prompt: '¿Qué corrección necesita «Ayer fuimos ala biblioteca»?', answer: 'Cambiar «ala» por «a la»', distractors: ['Cambiar «Ayer» por «Hay»','Quitar «biblioteca»','Escribir «fuimos» con b'], solution: 'La preposición y el artículo deben escribirse separados: “a la”.' },
    { prompt: 'Corrige «Mi hermano tubo fiebre».', answer: 'Mi hermano tuvo fiebre.', distractors: ['Mi hermano tubo fiebre.','Mi ermano tuvo fiebre.','Mi hermano tuvo fievre.'], solution: 'El pasado de “tener” es “tuvo”, con v.' },
  ],
  es_narrative: [
    { prompt: '¿Qué elemento es esencial en una narración?', answer: 'Una sucesión de acontecimientos', distractors: ['Una lista de definiciones','Solo datos estadísticos','Únicamente instrucciones'], solution: 'Narrar consiste en contar acontecimientos protagonizados por personajes.' },
    { prompt: 'En una narración, ¿quién cuenta los hechos?', answer: 'El narrador', distractors: ['El adjetivo','El título necesariamente','El lector'], solution: 'La voz que relata los acontecimientos es el narrador.' },
  ],
  es_description: [
    { prompt: '¿Cuál es una descripción objetiva?', answer: 'La mesa mide 120 cm y tiene cuatro patas.', distractors: ['La mesa es preciosa y acogedora.','Me encanta esa mesa.','Es la mejor mesa del mundo.'], solution: 'La opción usa datos verificables y evita valoraciones personales.' },
    { prompt: '¿Qué recurso aparece con frecuencia en una descripción?', answer: 'Adjetivos calificativos', distractors: ['Ecuaciones','Fechas históricas obligatoriamente','Solo verbos en futuro'], solution: 'Los adjetivos ayudan a expresar cualidades.' },
  ],
  es_exposition: [
    { prompt: '¿Cuál es el propósito principal de un texto expositivo?', answer: 'Explicar información de forma clara', distractors: ['Inventar una aventura','Dar órdenes siempre','Expresar únicamente emociones'], solution: 'La exposición organiza información para informar o explicar.' },
    { prompt: '¿Qué relación expresa «por ejemplo»?', answer: 'Ejemplificación', distractors: ['Contraste','Consecuencia','Condición'], solution: '“Por ejemplo” introduce un caso concreto que ilustra una idea.' },
  ],
  es_writing_revision: [
    { prompt: 'Al revisar un texto, ¿qué conviene comprobar primero?', answer: 'Que las ideas se entienden y están ordenadas', distractors: ['Que todas las frases tengan la misma longitud','Que no haya ningún punto','Que todas las palabras sean difíciles'], solution: 'La claridad y organización son fundamentales antes del pulido final.' },
    { prompt: '¿Qué mejora más la cohesión de un párrafo?', answer: 'Usar conectores adecuados', distractors: ['Repetir cada palabra varias veces','Eliminar todos los pronombres','Escribir todo en mayúsculas'], solution: 'Los conectores muestran relaciones entre ideas.' },
  ],
  es_literary_genres: [
    { prompt: '¿A qué género pertenece normalmente una obra escrita para ser representada en escena?', answer: 'Teatro', distractors: ['Lírica','Ensayo científico','Diccionario'], solution: 'El teatro se construye para la representación mediante diálogo y acción.' },
    { prompt: '¿Qué género suele expresar sentimientos mediante una voz poética?', answer: 'Lírica', distractors: ['Narrativa','Teatro','Noticia'], solution: 'La lírica se asocia a la expresión subjetiva y poética.' },
  ],
  es_literary_devices: [
    { prompt: '«Tus ojos son dos estrellas». ¿Qué recurso aparece?', answer: 'Metáfora', distractors: ['Enumeración','Hipérbaton','Onomatopeya'], solution: 'Se identifica una realidad con otra sin usar “como”.' },
    { prompt: '«El viento susurraba entre los árboles». ¿Qué recurso aparece?', answer: 'Personificación', distractors: ['Comparación','Ironía','Definición'], solution: 'Se atribuye al viento una acción humana: susurrar.' },
  ],
  es_literary_elements: [
    { prompt: 'En una narración, ¿qué es el conflicto?', answer: 'El problema o tensión que impulsa la acción', distractors: ['La lista de capítulos','El nombre del autor','La tipografía'], solution: 'El conflicto pone en marcha o sostiene el desarrollo de la historia.' },
    { prompt: '¿Qué personaje ocupa el centro de la acción?', answer: 'El protagonista', distractors: ['El editor','El narratario siempre','El corrector'], solution: 'El protagonista es el personaje principal.' },
  ],
  es_literary_reading: [
    { prompt: 'Si un fragmento repite «nadie vino, nadie llamó, nadie preguntó», ¿qué efecto produce la repetición?', answer: 'Refuerza la sensación de abandono', distractors: ['Elimina el tema','Convierte el texto en una receta','Impide cualquier interpretación'], solution: 'La repetición intensifica una idea y puede crear ritmo.' },
    { prompt: 'En un poema sobre el paso del tiempo, una hoja que cae puede funcionar como…', answer: 'Símbolo del cambio o del final de una etapa', distractors: ['Una instrucción literal','Una fórmula matemática','Una fecha exacta necesariamente'], solution: 'Los elementos concretos pueden adquirir significado simbólico.' },
  ],
  en_personal_info: [
    { prompt: 'Choose the best answer: “What’s your name?”', answer: 'My name is Alex.', distractors: ['I am twelve years old.','I live in Madrid.','It is Monday.'], solution: 'The question asks for a name.' },
    { prompt: 'Choose the best answer: “How old are you?”', answer: 'I’m twelve.', distractors: ['I’m from Spain.','My name is Sara.','I’m fine, thanks.'], solution: 'Age is expressed with “I am / I’m + number”.' },
  ],
  en_be_pronouns: [
    { prompt: 'Complete: “___ are my friends.”', answer: 'They', distractors: ['He','She','It'], solution: '“Friends” is plural, so the subject pronoun is “they”.' },
    { prompt: 'Complete: “I ___ a student.”', answer: 'am', distractors: ['is','are','be'], solution: 'The present form of “be” with “I” is “am”.' },
  ],
  en_possessives_have: [
    { prompt: 'Complete: “She has a dog. ___ dog is brown.”', answer: 'Her', distractors: ['His','Their','Our'], solution: 'The possessive adjective for “she” is “her”.' },
    { prompt: 'Choose the correct sentence.', answer: 'I have got two sisters.', distractors: ['I has got two sisters.','I have got two sister.','I got have two sisters.'], solution: 'With “I”, use “have got”; plural “sisters” matches two.' },
  ],
  en_classroom_language: [
    { prompt: 'What does “Open your book” mean?', answer: 'Abre tu libro', distractors: ['Cierra tu libro','Escribe tu nombre','Levántate'], solution: '“Open your book” is a common classroom instruction.' },
    { prompt: 'Which expression asks someone to repeat?', answer: 'Can you say that again, please?', distractors: ['Close the window.','What time is it?','I have a pencil.'], solution: '“Say that again” asks for repetition.' },
  ],
  en_present_simple: [
    { prompt: 'Complete: “Tom ___ football every Saturday.”', answer: 'plays', distractors: ['play','is playing','played'], solution: 'A routine with third-person singular uses present simple + -s.' },
    { prompt: 'Choose the correct sentence.', answer: 'We study English on Mondays.', distractors: ['We studies English on Mondays.','We studying English on Mondays.','We studied English on Mondays every week now.'], solution: 'Regular routines use present simple.' },
  ],
  en_frequency: [
    { prompt: 'Choose the natural word order.', answer: 'I usually walk to school.', distractors: ['I walk usually to school.','Usually I to school walk.','I to school usually walk.'], solution: 'Frequency adverbs normally go before the main verb.' },
    { prompt: 'Which word means “casi nunca”?', answer: 'hardly ever', distractors: ['always','often','usually'], solution: '“Hardly ever” means almost never.' },
  ],
  en_present_questions: [
    { prompt: 'Complete: “___ she like music?”', answer: 'Does', distractors: ['Do','Is','Has'], solution: 'Present simple questions with “she” use “does”.' },
    { prompt: 'Choose the correct short answer to “Do they play tennis?”', answer: 'Yes, they do.', distractors: ['Yes, they are.','Yes, they does.','Yes, they play do.'], solution: 'A “do” question takes “do” in the short answer.' },
  ],
  en_routines_vocab: [
    { prompt: 'What does “have breakfast” mean?', answer: 'desayunar', distractors: ['cenar','dormirse','vestirse'], solution: '“Have breakfast” means “desayunar”.' },
    { prompt: 'Which comes first in a typical morning routine?', answer: 'wake up', distractors: ['go to bed','have dinner','finish school'], solution: '“Wake up” starts the morning routine.' },
  ],
  en_present_continuous: [
    { prompt: 'Complete: “They ___ a film right now.”', answer: 'are watching', distractors: ['watch','watches','watched'], solution: '“Right now” signals present continuous: are + verb-ing.' },
    { prompt: 'Choose the correct sentence.', answer: 'I am doing my homework now.', distractors: ['I do my homework now at this moment.','I am do my homework now.','I doing my homework now.'], solution: 'Present continuous uses be + -ing.' },
  ],
  en_present_contrast: [
    { prompt: 'Choose: “She usually ___ by bus, but today she ___.”', answer: 'goes / is walking', distractors: ['is going / walks','go / walking','went / walks'], solution: 'Routine → present simple; action today/in progress → present continuous.' },
    { prompt: 'Which sentence describes a routine?', answer: 'I play basketball every Friday.', distractors: ['I am playing basketball now.','Look! He is running.','They are studying at the moment.'], solution: '“Every Friday” signals a habitual action.' },
  ],
  en_descriptions: [
    { prompt: 'Complete: “There ___ two windows in the room.”', answer: 'are', distractors: ['is','be','am'], solution: 'Plural noun “two windows” takes “there are”.' },
    { prompt: 'Which adjective can describe a person’s height?', answer: 'tall', distractors: ['hungry','yesterday','slowly'], solution: '“Tall” describes height.' },
  ],
  en_comparatives: [
    { prompt: 'Complete: “A train is usually ___ than a bicycle.”', answer: 'faster', distractors: ['fastest','more fast','fast'], solution: 'The comparative of short adjective “fast” is “faster”.' },
    { prompt: 'Complete: “This book is ___ than that one.”', answer: 'more interesting', distractors: ['interestinger','most interesting','more interested'], solution: 'Long adjective “interesting” forms the comparative with “more”.' },
  ],
  en_past_be: [
    { prompt: 'Complete: “They ___ at home yesterday.”', answer: 'were', distractors: ['was','are','be'], solution: 'Past “be” with “they” is “were”.' },
    { prompt: 'Choose the correct question.', answer: 'Was she tired?', distractors: ['Did she was tired?','Were she tired?','Was she tire?'], solution: 'Past “be” questions invert “was/were” and the subject.' },
  ],
  en_past_regular: [
    { prompt: 'Complete: “We ___ the museum yesterday.”', answer: 'visited', distractors: ['visit','visits','visiting'], solution: 'Regular past simple adds -ed.' },
    { prompt: 'Choose the correct negative.', answer: 'I did not play football.', distractors: ['I did not played football.','I not played football.','I was not play football.'], solution: 'After “did not”, use the base form.' },
  ],
  en_past_irregular: [
    { prompt: 'What is the past form of “go”?', answer: 'went', distractors: ['goed','gone','goes'], solution: '“Go” is irregular: go → went.' },
    { prompt: 'Complete: “She ___ a sandwich for lunch.”', answer: 'ate', distractors: ['eated','eat','eats'], solution: 'The past form of “eat” is “ate”.' },
  ],
  en_past_sequence: [
    { prompt: 'Choose the best connector: “First we had breakfast. ___, we left the hotel.”', answer: 'Then', distractors: ['Because','Although','Never'], solution: '“Then” sequences the next event.' },
    { prompt: 'Which order is logical?', answer: 'First → then → finally', distractors: ['Finally → first → then','Then → finally → first','First → finally → before first'], solution: 'These markers give a clear chronological sequence.' },
  ],
  en_can: [
    { prompt: 'Complete: “I ___ swim, but I can’t dive.”', answer: 'can', distractors: ['cans','am can','do can'], solution: 'Modal “can” does not change with the subject.' },
    { prompt: 'Which sentence expresses ability?', answer: 'She can play the guitar.', distractors: ['She must wear a uniform.','She is playing now.','She went home yesterday.'], solution: '“Can” commonly expresses ability.' },
  ],
  en_must: [
    { prompt: 'Choose: “You ___ run in the corridor. It’s forbidden.”', answer: 'mustn’t', distractors: ['must','can','are'], solution: '“Mustn’t” expresses prohibition.' },
    { prompt: 'Which sentence expresses obligation?', answer: 'You must wear a helmet.', distractors: ['You can sing.','You are wearing a helmet.','You wore a helmet.'], solution: '“Must” expresses strong obligation.' },
  ],
  en_going_to: [
    { prompt: 'Complete: “We are going to ___ grandma this weekend.”', answer: 'visit', distractors: ['visited','visiting','visits'], solution: '“Be going to” is followed by the base verb.' },
    { prompt: 'Which sentence expresses a future plan?', answer: 'I’m going to study tonight.', distractors: ['I study every night.','I studied last night.','I am twelve years old.'], solution: '“Be going to” is used for intentions and plans.' },
  ],
  en_functional_language: [
    { prompt: 'Which is the most polite request?', answer: 'Could you help me, please?', distractors: ['Help me now.','You help.','Helping me.'], solution: '“Could you… please?” is a polite request form.' },
    { prompt: 'Choose a suitable suggestion.', answer: 'Let’s watch a film.', distractors: ['You watched a film yesterday.','I can swim.','Must you a film?'], solution: '“Let’s + verb” is a common way to suggest an activity.' },
  ],
  en_reading_gist: [
    { prompt: 'Read: “Our school is organising a sports day on Friday. Students can choose football, basketball or athletics.” What is the text mainly about?', answer: 'A school sports event', distractors: ['A maths exam','A family holiday','A cooking lesson'], solution: 'The general topic is a school sports day.' },
    { prompt: 'Read: “Mia loves animals and volunteers at a dog shelter every Saturday.” What is the main idea?', answer: 'Mia helps animals regularly', distractors: ['Mia dislikes dogs','Mia works at school on Saturdays','Mia owns every dog'], solution: 'The sentence centres on Mia’s regular volunteering with animals.' },
  ],
  en_reading_detail: [
    { prompt: 'Read: “The library opens at 9:00 and closes at 18:00 on weekdays.” When does it close?', answer: 'At 18:00', distractors: ['At 9:00','At 8:00','At 19:00'], solution: 'The closing time is stated explicitly.' },
    { prompt: 'Read: “Ben took an umbrella because the sky was very dark.” Why did he take it?', answer: 'He expected rain', distractors: ['He wanted shade at night','He lost his coat','He was going swimming'], solution: 'The dark sky is a clue that rain may come.' },
  ],
  en_text_organisation: [
    { prompt: 'Choose the best connector: “I was tired, ___ I went to bed early.”', answer: 'so', distractors: ['but','although','or'], solution: '“So” introduces a result.' },
    { prompt: 'Which sentence works best as the first sentence of a paragraph about a hobby?', answer: 'My favourite hobby is photography.', distractors: ['For example, I use a small camera.','Finally, that is why I enjoy it.','However, on rainy days.'], solution: 'A topic sentence introduces the paragraph clearly.' },
  ],
  en_mediation: [
    { prompt: 'Choose the best simple paraphrase of “The museum is free for children under 12.”', answer: 'Children younger than 12 do not pay.', distractors: ['All children pay double.','Only adults can enter.','The museum closes at 12.'], solution: 'The paraphrase keeps the same essential meaning.' },
    { prompt: 'Your friend asks what “No food or drink” means. Choose the best explanation.', answer: 'You cannot eat or drink here.', distractors: ['You must buy food here.','Only water is free.','The place sells drinks.'], solution: 'Mediation explains the message in simpler words.' },
  ],
}

function hash(seed: number, text: string) {
  let x = seed >>> 0
  for (let i = 0; i < text.length; i += 1) x = Math.imul(x ^ text.charCodeAt(i), 16777619) >>> 0
  x ^= x >>> 16
  return x >>> 0
}

function shuffle<T>(items: T[], seed: number) {
  const out = [...items]
  let x = seed >>> 0
  for (let i = out.length - 1; i > 0; i -= 1) {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0
    const j = x % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function generateLanguageSubjectQuestion(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  const items = BANK[skill.generator_key]
  if (!items?.length) return null
  const item = items[hash(seed + difficulty * 997, skill.generator_key) % items.length]
  const options = shuffle([item.answer, ...item.distractors], hash(seed, `${skill.id}:options`))
  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: item.prompt,
    options,
    answerIndex: options.indexOf(item.answer),
    solution: item.solution,
    tags: [`family:${item.tag ?? skill.generator_key}`, `subject:${skill.id.startsWith('L') ? 'spanish' : 'english'}`],
  }
}

export function languageGeneratorKeys() {
  return Object.keys(BANK)
}
