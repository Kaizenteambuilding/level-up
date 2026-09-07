import type { GeneratedQuestion } from './firstEvaluationGenerators'
import { generateLanguageSubjectQuestion } from './languageSubjectGenerators'
import { generateExpandedEnglishQuestion } from './englishExpandedGenerators'
import { generateEnglishBonusQuestion } from './englishBonusVariants'

type SkillMeta = { id: string; name: string; generator_key: string }
type Variant = { prompt: string; answer: string; distractors: [string,string,string]; solution: string }

const VARIANTS: Record<string, Variant[]> = {
  L01S01: [
    { prompt:'Lee: «El transporte público reduce el número de coches, puede disminuir la contaminación y facilita los desplazamientos». ¿Cuál es la idea principal?', answer:'El transporte público aporta beneficios a la movilidad y al entorno', distractors:['Solo sirve para reducir coches','La contaminación siempre desaparece','Moverse por la ciudad es imposible'], solution:'La idea principal reúne los beneficios generales expresados en el texto.' },
    { prompt:'Lee: «Dormir bien ayuda a concentrarse, mejora el estado de ánimo y favorece el aprendizaje». ¿Cuál es la idea principal?', answer:'Dormir bien aporta beneficios para aprender y sentirse mejor', distractors:['Dormir sirve únicamente para descansar','El aprendizaje depende solo del sueño','El estado de ánimo no cambia nunca'], solution:'La idea principal resume los distintos beneficios del buen descanso.' },
    { prompt:'Lee: «Los árboles dan sombra, absorben dióxido de carbono y sirven de refugio a muchos animales». ¿Qué resume mejor el texto?', answer:'Los árboles cumplen varias funciones beneficiosas', distractors:['Los árboles solo producen sombra','Todos los animales viven en árboles','El dióxido de carbono desaparece por completo'], solution:'El texto enumera varias funciones, así que la idea principal debe englobarlas.' },
    { prompt:'Lee: «La biblioteca del barrio ofrece libros, salas de estudio y actividades culturales gratuitas». ¿Cuál es la idea principal?', answer:'La biblioteca ofrece distintos recursos y actividades a la comunidad', distractors:['La biblioteca solo presta novelas','Estudiar en casa está prohibido','Todas las actividades son de pago'], solution:'La idea principal reúne los servicios que presta la biblioteca.' },
    { prompt:'Lee: «Separar los residuos permite reciclar materiales y reducir la cantidad de basura que termina en vertederos». ¿Qué idea principal expresa?', answer:'Separar residuos facilita el reciclaje y reduce desechos', distractors:['Separar residuos elimina toda la basura','Reciclar solo sirve para papel','Los vertederos dejan de existir'], solution:'El texto explica dos beneficios relacionados de la separación de residuos.' },
  ],
  L02S01: [
    { prompt:'En «Aquellos alumnos trabajan silenciosamente», ¿qué clase de palabra es «silenciosamente»?', answer:'Adverbio', distractors:['Adjetivo','Determinante','Sustantivo'], solution:'Modifica al verbo “trabajan” e indica modo.' },
    { prompt:'En «Mi hermano llegó ayer», ¿qué clase de palabra es «ayer»?', answer:'Adverbio', distractors:['Sustantivo','Adjetivo','Pronombre'], solution:'“Ayer” modifica al verbo e indica tiempo.' },
    { prompt:'En «La casa azul está lejos», ¿qué clase de palabra es «azul»?', answer:'Adjetivo', distractors:['Verbo','Adverbio','Determinante'], solution:'“Azul” expresa una cualidad del sustantivo “casa”.' },
    { prompt:'En «Nosotros preparamos la cena», ¿qué clase de palabra es «nosotros»?', answer:'Pronombre', distractors:['Sustantivo','Adjetivo','Preposición'], solution:'“Nosotros” sustituye a un grupo nominal y funciona como pronombre personal.' },
    { prompt:'En «El perro corre por el parque», ¿qué clase de palabra es «por»?', answer:'Preposición', distractors:['Adverbio','Verbo','Sustantivo'], solution:'“Por” relaciona elementos de la oración y es una preposición.' },
  ],
  L03S02: [
    { prompt:'En «La hoja del árbol cayó al suelo», ¿qué significa «hoja»?', answer:'Parte plana de una planta', distractors:['Página de un libro','Cuchilla de una herramienta','Documento administrativo'], solution:'El contexto “del árbol” determina el significado vegetal.' },
    { prompt:'En «El banco estaba lleno de gente esperando para ingresar dinero», ¿qué significa «banco»?', answer:'Entidad financiera', distractors:['Asiento alargado','Grupo de peces','Montón de arena'], solution:'Las expresiones “ingresar dinero” y “gente esperando” señalan el sentido financiero.' },
    { prompt:'En «El ratón dejó de funcionar y no podía mover el cursor», ¿qué significa «ratón»?', answer:'Dispositivo informático', distractors:['Animal roedor','Persona muy tímida','Juguete de tela'], solution:'El contexto informático del cursor determina el significado.' },
    { prompt:'En «La copa del árbol se movía con el viento», ¿qué significa «copa»?', answer:'Parte superior formada por ramas y hojas', distractors:['Vaso con pie','Trofeo deportivo','Cantidad de bebida'], solution:'El contexto “del árbol” indica el significado relacionado con su parte superior.' },
    { prompt:'En «La red del equipo se cayó y nadie podía conectarse a internet», ¿qué significa «red»?', answer:'Sistema de conexión informática', distractors:['Tejido para pescar','Conjunto de cuerdas de una portería','Hamaca'], solution:'La referencia a conectarse a internet fija el significado tecnológico.' },
  ],
  L04S01: [
    { prompt:'¿Cuál de estas palabras es esdrújula y debe llevar tilde?', answer:'pájaro', distractors:['pared','reloj','papel'], solution:'“pájaro” es esdrújula y todas las esdrújulas llevan tilde.' },
    { prompt:'¿Cuál de estas palabras debe llevar tilde por ser aguda terminada en vocal?', answer:'café', distractors:['pared','reloj','motor'], solution:'“café” es aguda y termina en vocal, por eso lleva tilde.' },
    { prompt:'¿Cuál de estas palabras debe llevar tilde por ser llana terminada en consonante distinta de n o s?', answer:'árbol', distractors:['casa','joven','lunes'], solution:'“árbol” es llana y termina en “l”, así que lleva tilde.' },
    { prompt:'¿Cuál de estas palabras está correctamente acentuada?', answer:'música', distractors:['musica','camíon','arbolés'], solution:'“música” es esdrújula y debe llevar tilde en la primera sílaba.' },
    { prompt:'¿Qué palabra contiene un hiato que se marca con tilde?', answer:'país', distractors:['aire','cielo','causa'], solution:'En “país”, la vocal cerrada tónica rompe el diptongo y se marca con tilde.' },
  ],
  L05S03: [
    { prompt:'¿Qué fragmento es claramente expositivo?', answer:'«La fotosíntesis es el proceso por el que las plantas producen materia orgánica usando luz.»', distractors:['«Corrí hasta casa mientras anochecía.»','«¡Qué hermoso estaba el cielo!»','«Cierra la puerta ahora mismo.»'], solution:'Define y explica un concepto de forma objetiva.' },
    { prompt:'¿Qué fragmento es claramente narrativo?', answer:'«Al abrir la puerta, Julia encontró una caja que no estaba allí la noche anterior.»', distractors:['«El agua hierve a 100 °C a nivel del mar.»','«Se ruega mantener silencio.»','«La palabra sustantivo nombra seres u objetos.»'], solution:'Presenta acciones protagonizadas por un personaje y una secuencia de hechos.' },
    { prompt:'¿Qué fragmento es claramente instructivo?', answer:'«Añade dos cucharadas de aceite y remueve durante un minuto.»', distractors:['«La tarde estaba tranquila y luminosa.»','«Los volcanes expulsan materiales del interior terrestre.»','«Me emocionó mucho la película.»'], solution:'Da indicaciones directas para realizar una acción.' },
    { prompt:'¿Qué fragmento es claramente descriptivo?', answer:'«La habitación era pequeña, luminosa y tenía una ventana redonda.»', distractors:['«Primero conecta el cable.»','«Ayer llegamos tarde al tren.»','«La evaporación transforma agua líquida en vapor.»'], solution:'Enumera rasgos y características de un espacio.' },
    { prompt:'¿Qué fragmento es claramente argumentativo?', answer:'«Conviene usar más transporte público porque reduce tráfico y emisiones.»', distractors:['«El autobús salió a las ocho.»','«La estación tiene cuatro andenes.»','«Pulsa el botón verde para abrir.»'], solution:'Defiende una idea mediante una razón explícita.' },
  ],
  L06S01: [
    { prompt:'Una obra formada principalmente por diálogos y acotaciones pertenece al género…', answer:'dramático o teatral', distractors:['lírico','periodístico','científico'], solution:'Diálogos y acotaciones son rasgos propios del texto teatral.' },
    { prompt:'Un poema que expresa emociones y sentimientos pertenece principalmente al género…', answer:'lírico', distractors:['dramático','periodístico','instructivo'], solution:'El género lírico se caracteriza por la expresión subjetiva de emociones y experiencias.' },
    { prompt:'Una novela en la que un narrador cuenta las acciones de varios personajes pertenece al género…', answer:'narrativo', distractors:['lírico','dramático','publicitario'], solution:'El género narrativo presenta una historia contada por un narrador.' },
    { prompt:'¿Qué elemento es característico de una obra teatral escrita?', answer:'Las acotaciones escénicas', distractors:['Las fórmulas matemáticas','Los titulares periodísticos','Las instrucciones de montaje'], solution:'Las acotaciones indican acciones, movimientos o aspectos de la puesta en escena.' },
    { prompt:'¿Qué rasgo identifica mejor un texto lírico?', answer:'El uso expresivo del lenguaje para transmitir emociones', distractors:['La explicación objetiva de un experimento','Las órdenes paso a paso','La presencia obligatoria de diálogos'], solution:'La lírica utiliza recursos expresivos para comunicar sentimientos y percepciones.' },
  ],
  E01S01: [
    { prompt:'Choose the best answer: “Where are you from?”', answer:'I’m from Spain.', distractors:['I’m thirteen.','My name is Leo.','It’s half past six.'], solution:'The question asks about origin or country.' },
    { prompt:'Choose the best answer: “How old are you?”', answer:'I’m twelve years old.', distractors:['I’m from Madrid.','My favourite subject is English.','It’s Monday.'], solution:'The question asks about age.' },
    { prompt:'Choose the best answer: “What’s your surname?”', answer:'It’s García.', distractors:['I’m fine, thanks.','I’m from Spain.','I’m eleven.'], solution:'The question asks for a family name.' },
    { prompt:'Choose the best answer: “What do you like doing at weekends?”', answer:'I like riding my bike.', distractors:['I am in Year 7.','It is ten o’clock.','My school is near here.'], solution:'The question asks about a preferred leisure activity.' },
    { prompt:'Choose the best answer: “When is your birthday?”', answer:'It’s in May.', distractors:['I’m from Toledo.','I have one sister.','I’m very well.'], solution:'The question asks for the time or date of a birthday.' },
  ],
  E02S01: [
    { prompt:'Choose the correct sentence about a daily routine.', answer:'She walks to school every day.', distractors:['She walking to school every day.','She walk to school every day.','She is walk to school every day.'], solution:'With “she” in the present simple, the verb takes -s.' },
    { prompt:'Complete: “My brother ___ breakfast at seven.”', answer:'has', distractors:['have','having','is have'], solution:'Third-person singular in the present simple uses “has”.' },
    { prompt:'Choose the correct negative sentence.', answer:'He doesn’t play tennis on Mondays.', distractors:['He don’t plays tennis on Mondays.','He doesn’t plays tennis on Mondays.','He not play tennis on Mondays.'], solution:'With he/she/it, use “doesn’t” plus the base verb.' },
    { prompt:'Choose the correct question about a routine.', answer:'Does Sara study after dinner?', distractors:['Do Sara studies after dinner?','Does Sara studies after dinner?','Is Sara study after dinner?'], solution:'Present simple questions with third-person singular use “does” plus the base verb.' },
    { prompt:'Complete: “We usually ___ the bus to school.”', answer:'take', distractors:['takes','taking','are take'], solution:'With “we”, the present simple uses the base form “take”.' },
  ],
  E03S01: [
    { prompt:'Choose the correct sentence for an action happening now.', answer:'They are studying now.', distractors:['They study now every day.','They is studying now.','They studying now.'], solution:'Present continuous uses be + verb-ing.' },
    { prompt:'Complete: “I ___ my homework at the moment.”', answer:'am doing', distractors:['do','is doing','doing'], solution:'With “I”, present continuous uses “am” + verb-ing.' },
    { prompt:'Choose the correct question.', answer:'Is she wearing a blue jacket?', distractors:['Does she wearing a blue jacket?','Is she wear a blue jacket?','She is wearing a blue jacket?'], solution:'Present continuous questions invert “be” and the subject.' },
    { prompt:'Choose the correct negative sentence.', answer:'We aren’t watching TV now.', distractors:['We don’t watching TV now.','We not are watching TV now.','We aren’t watch TV now.'], solution:'Present continuous negative uses “aren’t” + verb-ing.' },
    { prompt:'Complete: “Look! The dog ___ after the ball.”', answer:'is running', distractors:['runs every day','run','are running'], solution:'“Look!” signals an action happening now, so present continuous is appropriate.' },
  ],
  E04S02: [
    { prompt:'Choose the correct past simple form.', answer:'Yesterday we played football.', distractors:['Yesterday we play football.','Yesterday we playing football.','Yesterday we plays football.'], solution:'Regular past simple adds -ed: play → played.' },
    { prompt:'Complete: “Last night I ___ a film.”', answer:'watched', distractors:['watch','watches','watching'], solution:'The regular past form of “watch” is “watched”.' },
    { prompt:'Choose the correct negative sentence in the past.', answer:'She didn’t visit the museum.', distractors:['She didn’t visited the museum.','She doesn’t visit the museum yesterday.','She not visited the museum.'], solution:'Past simple negative uses “didn’t” plus the base verb.' },
    { prompt:'Choose the correct past simple question.', answer:'Did they finish the project?', distractors:['Did they finished the project?','Do they finished the project?','Were they finish the project?'], solution:'Past simple questions use “did” plus the base verb.' },
    { prompt:'Complete: “We ___ at home last Saturday.”', answer:'stayed', distractors:['stay','stays','staying'], solution:'The regular past form of “stay” is “stayed”.' },
  ],
  E05S03: [
    { prompt:'Complete: “Next summer, I ___ visit my cousins.”', answer:'am going to', distractors:['is going to','are going to','going'], solution:'With “I”, the correct form is “am going to”.' },
    { prompt:'Complete: “They ___ travel by train tomorrow.”', answer:'are going to', distractors:['is going to','am going to','going to are'], solution:'With “they”, use “are going to” plus the base verb.' },
    { prompt:'Choose the correct question about a plan.', answer:'Are you going to study tonight?', distractors:['Do you going to study tonight?','Are you go to study tonight?','Is you going to study tonight?'], solution:'Questions with “going to” use the correct form of “be” before the subject.' },
    { prompt:'Choose the correct negative future plan.', answer:'He isn’t going to buy a new phone.', distractors:['He doesn’t going to buy a new phone.','He not going buy a new phone.','He aren’t going to buy a new phone.'], solution:'With “he”, the negative is “isn’t going to” plus the base verb.' },
    { prompt:'Complete: “We ___ have a picnic if the weather is good.”', answer:'are going to', distractors:['is going to','am going to','going'], solution:'With “we”, the plan structure is “are going to”.' },
  ],
  E06S01: [
    { prompt:'Read: “Maya has a small garden. She grows tomatoes and herbs there every spring.” What is the text mainly about?', answer:'Maya’s garden and what she grows', distractors:['A school timetable','A winter holiday','A football match'], solution:'The general meaning is about Maya’s garden and plants.' },
    { prompt:'Read: “Leo cycles to school because it is close to his house and he enjoys being outdoors.” What is the text mainly about?', answer:'Why Leo cycles to school', distractors:['How Leo repairs bicycles','A long bus journey','A school sports competition'], solution:'The text gives the reasons Leo chooses to cycle to school.' },
    { prompt:'Read: “The town library opens a new study room on Saturdays. Students can use computers and work quietly there.” What is the text mainly about?', answer:'A new study space at the library', distractors:['A computer shop','A noisy sports hall','A cancelled school day'], solution:'The central idea is the new library study room and what students can do there.' },
    { prompt:'Read: “Nora joined a cooking club this term. Every Friday, the group learns a new recipe and eats together.” What is the text mainly about?', answer:'Nora’s cooking club activities', distractors:['A restaurant job','A food delivery service','A school exam'], solution:'The passage focuses on Nora’s club and its weekly activity.' },
    { prompt:'Read: “Our class is collecting used batteries this month so they can be recycled safely.” What is the text mainly about?', answer:'A class recycling collection', distractors:['Buying new batteries','A science test about electricity','A trip to a factory'], solution:'The text describes a class action to collect batteries for recycling.' },
  ],
}

function rotate<T>(items:T[], shift:number){
  const offset=((shift%items.length)+items.length)%items.length
  return items.slice(offset).concat(items.slice(0,offset))
}

export function generateLanguageQuestionWithCriticalVariants(skill:SkillMeta,difficulty:number,seed:number):GeneratedQuestion {
  const variants = VARIANTS[skill.id]
  const isEnglish = skill.id.startsWith('E')
  const useCriticalVariant = Boolean(variants?.length) && (isEnglish ? seed % 7 === 0 : (seed & 1) === 1)
  if (!useCriticalVariant) {
    if (isEnglish) {
      if (seed % 11 === 0) {
        const bonus = generateEnglishBonusQuestion(skill,difficulty,seed)
        if (bonus) return bonus
      }
      return generateExpandedEnglishQuestion(skill,difficulty,seed)
    }
    const base = generateLanguageSubjectQuestion(skill,difficulty,seed)
    if (!base) throw new Error(`No language generator for ${skill.id}`)
    return base
  }
  const index = ((Math.floor(seed / (isEnglish ? 7 : 2)) + difficulty) % variants.length + variants.length) % variants.length
  const selected = variants[index]
  const options=[selected.answer,...selected.distractors]
  const rotated=rotate(options,(seed+difficulty)%4)
  return { skillId:skill.id,label:skill.name,difficulty,seed,prompt:selected.prompt,options:rotated,answerIndex:rotated.indexOf(selected.answer),solution:selected.solution,tags:[skill.generator_key,isEnglish?'english':'spanish','critical_variant'] }
}

export function languageCriticalVariantSkillIds(){ return Object.keys(VARIANTS) }
export function languageCriticalVariantCount(skillId:string){ return VARIANTS[skillId]?.length ?? 0 }
