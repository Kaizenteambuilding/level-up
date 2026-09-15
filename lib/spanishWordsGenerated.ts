import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Case = { stem: string; answer: string; distractors: [string,string,string]; solution: string }

const WORD_CLASS_CASES: Case[] = [
  { stem:'En «La científica observó una estrella brillante», clasifica «brillante».', answer:'Adjetivo', distractors:['Sustantivo','Verbo','Adverbio'], solution:'«Brillante» expresa una cualidad del sustantivo «estrella».' },
  { stem:'En «Mañana iremos al museo», clasifica «mañana».', answer:'Adverbio', distractors:['Adjetivo','Sustantivo','Determinante'], solution:'«Mañana» indica una circunstancia temporal.' },
  { stem:'En «Aquellos alumnos preparan el proyecto», clasifica «aquellos».', answer:'Determinante', distractors:['Pronombre','Verbo','Adverbio'], solution:'«Aquellos» acompaña al sustantivo «alumnos» y lo determina.' },
  { stem:'En «Nosotros llegaremos temprano», clasifica «nosotros».', answer:'Pronombre', distractors:['Determinante','Sustantivo','Adjetivo'], solution:'«Nosotros» sustituye a un grupo nominal y funciona como pronombre.' },
  { stem:'En «El perro corre por el jardín», clasifica «corre».', answer:'Verbo', distractors:['Sustantivo','Adjetivo','Preposición'], solution:'«Corre» expresa una acción y está conjugado.' },
  { stem:'En «La excursión fue bastante larga», clasifica «bastante».', answer:'Adverbio', distractors:['Sustantivo','Determinante','Verbo'], solution:'«Bastante» modifica al adjetivo «larga» indicando grado.' },
  { stem:'En «Compramos pan y fruta», clasifica «y».', answer:'Conjunción', distractors:['Preposición','Adverbio','Pronombre'], solution:'«Y» une dos elementos coordinados.' },
  { stem:'En «Dejé la mochila sobre la mesa», clasifica «sobre».', answer:'Preposición', distractors:['Conjunción','Adjetivo','Verbo'], solution:'«Sobre» relaciona «mochila» y «mesa» e introduce un complemento.' },
  { stem:'En «El bosque conserva mucha humedad», clasifica «bosque».', answer:'Sustantivo', distractors:['Adjetivo','Verbo','Adverbio'], solution:'«Bosque» nombra una realidad y es un sustantivo.' },
  { stem:'En «Una respuesta correcta merece atención», clasifica «una».', answer:'Determinante', distractors:['Pronombre','Adverbio','Sustantivo'], solution:'«Una» acompaña a «respuesta» y concreta su referencia.' },
  { stem:'En «Ella dibuja cuidadosamente», clasifica «cuidadosamente».', answer:'Adverbio', distractors:['Adjetivo','Sustantivo','Determinante'], solution:'«Cuidadosamente» modifica al verbo «dibuja» indicando modo.' },
  { stem:'En «Aunque llovía, salimos», clasifica «aunque».', answer:'Conjunción', distractors:['Preposición','Pronombre','Adjetivo'], solution:'«Aunque» introduce una proposición subordinada concesiva.' },
  { stem:'En «Viajamos desde Valencia», clasifica «desde».', answer:'Preposición', distractors:['Conjunción','Verbo','Adverbio'], solution:'«Desde» introduce el punto de origen.' },
  { stem:'En «La música suave llenaba la sala», clasifica «música».', answer:'Sustantivo', distractors:['Adjetivo','Adverbio','Determinante'], solution:'«Música» nombra una realidad y funciona como sustantivo.' },
  { stem:'En «Mis primos viven cerca», clasifica «mis».', answer:'Determinante', distractors:['Pronombre','Adverbio','Preposición'], solution:'«Mis» acompaña a «primos» y expresa posesión.' },
  { stem:'En «Quizá lleguen después», clasifica «quizá».', answer:'Adverbio', distractors:['Sustantivo','Conjunción','Determinante'], solution:'«Quizá» modifica el enunciado expresando duda.' },
]

const SUBJECT_CASES: Case[] = [
  { stem:'En «Las nubes cubrieron el cielo», identifica el sujeto.', answer:'Las nubes', distractors:['cubrieron','el cielo','cubrieron el cielo'], solution:'«Las nubes» concuerda en número con el verbo «cubrieron».' },
  { stem:'En «El equipo terminó el mural ayer», identifica el predicado.', answer:'terminó el mural ayer', distractors:['El equipo','el mural','ayer'], solution:'El predicado contiene el verbo y todo lo que se dice del sujeto.' },
  { stem:'En «Mi hermana pequeña toca el violín», identifica el sujeto.', answer:'Mi hermana pequeña', distractors:['toca','el violín','toca el violín'], solution:'El grupo «Mi hermana pequeña» realiza la acción y concuerda con «toca».' },
  { stem:'En «Los trenes de cercanías llegan puntuales», identifica el predicado.', answer:'llegan puntuales', distractors:['Los trenes','de cercanías','puntuales'], solution:'«Llegan puntuales» contiene el verbo y lo que se afirma del sujeto.' },
  { stem:'En «La profesora explicó la actividad con calma», identifica el sujeto.', answer:'La profesora', distractors:['explicó','la actividad','con calma'], solution:'«La profesora» es quien realiza la acción de explicar.' },
  { stem:'En «Tus amigos del barrio organizaron un torneo», identifica el predicado.', answer:'organizaron un torneo', distractors:['Tus amigos','del barrio','un torneo'], solution:'El predicado incluye el verbo «organizaron» y su complemento.' },
  { stem:'En «Aquel edificio antiguo necesita reformas», identifica el sujeto.', answer:'Aquel edificio antiguo', distractors:['necesita','reformas','necesita reformas'], solution:'El núcleo del sujeto es «edificio» y el grupo completo concuerda con «necesita».' },
  { stem:'En «Las hojas secas crujían bajo nuestros pasos», identifica el predicado.', answer:'crujían bajo nuestros pasos', distractors:['Las hojas secas','bajo nuestros pasos','nuestros pasos'], solution:'El predicado expresa lo que hacen las hojas e incluye el verbo «crujían».' },
  { stem:'En «Mi vecino y su hija plantaron tomates», identifica el sujeto.', answer:'Mi vecino y su hija', distractors:['plantaron','tomates','plantaron tomates'], solution:'El sujeto compuesto «Mi vecino y su hija» concuerda con «plantaron».' },
  { stem:'En «La película de aventuras empezó tarde», identifica el predicado.', answer:'empezó tarde', distractors:['La película','de aventuras','tarde'], solution:'«Empezó tarde» contiene el verbo y la información predicada.' },
  { stem:'En «Nuestros ordenadores nuevos funcionan muy bien», identifica el sujeto.', answer:'Nuestros ordenadores nuevos', distractors:['funcionan','muy bien','funcionan muy bien'], solution:'El grupo nominal completo es el sujeto de «funcionan».' },
  { stem:'En «El viento del norte movía las ramas», identifica el predicado.', answer:'movía las ramas', distractors:['El viento','del norte','las ramas'], solution:'El predicado contiene «movía» y su complemento directo.' },
]

const HEAD_CASES: Case[] = [
  { stem:'En el grupo nominal «aquellas montañas altas», identifica el núcleo.', answer:'montañas', distractors:['aquellas','altas','aquellas altas'], solution:'El núcleo de un grupo nominal es el sustantivo principal: «montañas».' },
  { stem:'En el grupo verbal «corrió muy deprisa», identifica el núcleo.', answer:'corrió', distractors:['muy','deprisa','muy deprisa'], solution:'El núcleo de un grupo verbal es el verbo: «corrió».' },
  { stem:'En el grupo nominal «mis dos mejores amigos», identifica el núcleo.', answer:'amigos', distractors:['mis','dos','mejores'], solution:'«Amigos» es el sustantivo principal del grupo nominal.' },
  { stem:'En el grupo verbal «había terminado pronto», identifica el núcleo verbal.', answer:'había terminado', distractors:['había','pronto','terminado pronto'], solution:'La forma verbal compuesta «había terminado» funciona como núcleo.' },
  { stem:'En el grupo nominal «la vieja estación de tren», identifica el núcleo.', answer:'estación', distractors:['la','vieja','tren'], solution:'«Estación» es el sustantivo del que dependen los demás elementos.' },
  { stem:'En el grupo verbal «podemos llegar mañana», identifica el núcleo verbal.', answer:'podemos llegar', distractors:['mañana','llegar mañana','podemos'], solution:'La perífrasis «podemos llegar» constituye el núcleo verbal.' },
  { stem:'En el grupo nominal «un cuaderno de tapas rojas», identifica el núcleo.', answer:'cuaderno', distractors:['un','tapas','rojas'], solution:'«Cuaderno» es el sustantivo principal del grupo.' },
  { stem:'En el grupo verbal «estaba leyendo en silencio», identifica el núcleo verbal.', answer:'estaba leyendo', distractors:['en silencio','leyendo en silencio','silencio'], solution:'La perífrasis progresiva «estaba leyendo» funciona como núcleo verbal.' },
  { stem:'En el grupo nominal «esas historias de misterio», identifica el núcleo.', answer:'historias', distractors:['esas','misterio','de misterio'], solution:'«Historias» es el sustantivo central del grupo nominal.' },
  { stem:'En el grupo verbal «volveremos bastante tarde», identifica el núcleo.', answer:'volveremos', distractors:['bastante','tarde','bastante tarde'], solution:'«Volveremos» es el verbo y por tanto el núcleo del grupo verbal.' },
  { stem:'En el grupo nominal «la primera página del libro», identifica el núcleo.', answer:'página', distractors:['primera','libro','la'], solution:'«Página» es el sustantivo principal; «del libro» lo complementa.' },
  { stem:'En el grupo verbal «dejó cuidadosamente la caja», identifica el núcleo.', answer:'dejó', distractors:['cuidadosamente','la caja','caja'], solution:'«Dejó» es el verbo que organiza el grupo verbal.' },
]

const AGREEMENT_CASES: Case[] = [
  { stem:'Selecciona la opción con concordancia correcta.', answer:'Los árboles altos', distractors:['Los árbol altos','Las árboles altas','El árboles alto'], solution:'Determinante, sustantivo y adjetivo concuerdan en masculino plural.' },
  { stem:'Completa «Mi hermana y yo ___ temprano».', answer:'llegamos', distractors:['llega','llego','llegáis'], solution:'«Mi hermana y yo» equivale a primera persona del plural.' },
  { stem:'Selecciona la opción con concordancia correcta.', answer:'Una ventana abierta', distractors:['Un ventana abierto','Una ventana abiertos','Unas ventana abierta'], solution:'Los tres elementos deben concordar en femenino singular.' },
  { stem:'Completa «Tus amigos ___ preparados».', answer:'están', distractors:['está','estoy','estáis'], solution:'El sujeto «Tus amigos» exige tercera persona del plural.' },
  { stem:'Selecciona la opción con concordancia correcta.', answer:'Aquellas flores amarillas', distractors:['Aquellos flores amarillos','Aquella flores amarilla','Aquellas flor amarillas'], solution:'El grupo completo concuerda en femenino plural.' },
  { stem:'Completa «El perro y el gato ___ en el jardín».', answer:'juegan', distractors:['juega','juego','jugáis'], solution:'Un sujeto compuesto exige verbo en plural.' },
  { stem:'Selecciona la opción con concordancia correcta.', answer:'Estos cuadernos nuevos', distractors:['Este cuadernos nuevo','Estas cuadernos nuevas','Estos cuaderno nuevos'], solution:'Determinante, sustantivo y adjetivo concuerdan en masculino plural.' },
  { stem:'Completa «La mayoría de los alumnos ___ la respuesta».', answer:'conoce', distractors:['conocen necesariamente','conozco','conocéis'], solution:'El núcleo «mayoría» es singular y admite concordancia singular en este contexto.' },
  { stem:'Selecciona la opción con concordancia correcta.', answer:'La puerta estaba cerrada', distractors:['La puerta estaban cerrada','La puerta estaba cerrado','Las puerta estaban cerradas'], solution:'Sujeto, verbo y atributo concuerdan en singular y femenino donde corresponde.' },
  { stem:'Completa «Vosotros ___ la actividad mañana».', answer:'terminaréis', distractors:['terminará','terminaremos','terminarán'], solution:'«Vosotros» exige segunda persona del plural.' },
  { stem:'Selecciona la opción con concordancia correcta.', answer:'Mis primas son simpáticas', distractors:['Mis primas es simpáticas','Mi primas son simpática','Mis primas son simpático'], solution:'El sujeto femenino plural exige verbo plural y atributo femenino plural.' },
  { stem:'Completa «Cada participante ___ una tarjeta».', answer:'recibe', distractors:['reciben','recibo','recibís'], solution:'«Cada participante» es singular y exige verbo singular.' },
]

const SYN_ANT_CASES: Case[] = [
  { stem:'Busca un sinónimo de «alegre».', answer:'contento', distractors:['triste','furioso','agotado'], solution:'«Contento» comparte el significado básico de «alegre».' },
  { stem:'Busca un antónimo de «amplio».', answer:'estrecho', distractors:['grande','extenso','espacioso'], solution:'«Estrecho» expresa la idea opuesta a «amplio».' },
  { stem:'Busca un sinónimo de «comenzar».', answer:'iniciar', distractors:['terminar','detener','olvidar'], solution:'«Iniciar» y «comenzar» comparten significado.' },
  { stem:'Busca un antónimo de «visible».', answer:'oculto', distractors:['claro','brillante','evidente'], solution:'«Oculto» se opone a aquello que puede verse.' },
  { stem:'Busca un sinónimo de «difícil».', answer:'complicado', distractors:['sencillo','rápido','pequeño'], solution:'«Complicado» puede sustituir a «difícil» en muchos contextos.' },
  { stem:'Busca un antónimo de «generoso».', answer:'tacaño', distractors:['amable','atento','solidario'], solution:'«Tacaño» se opone a «generoso» respecto a dar o compartir.' },
  { stem:'Busca un sinónimo de «observar».', answer:'mirar', distractors:['ocultar','romper','olvidar'], solution:'«Mirar» comparte con «observar» la idea de dirigir la vista.' },
  { stem:'Busca un antónimo de «antiguo».', answer:'moderno', distractors:['viejo','histórico','pasado'], solution:'«Moderno» expresa oposición temporal a «antiguo».' },
  { stem:'Busca un sinónimo de «enorme».', answer:'gigantesco', distractors:['minúsculo','estrecho','breve'], solution:'«Gigantesco» expresa gran tamaño, como «enorme».' },
  { stem:'Busca un antónimo de «permitir».', answer:'prohibir', distractors:['aceptar','autorizar','dejar'], solution:'«Prohibir» expresa la acción contraria a permitir.' },
  { stem:'Busca un sinónimo de «tranquilo».', answer:'sereno', distractors:['nervioso','ruidoso','veloz'], solution:'«Sereno» puede equivaler a «tranquilo».' },
  { stem:'Busca un antónimo de «aumentar».', answer:'disminuir', distractors:['crecer','sumar','elevar'], solution:'«Disminuir» expresa la acción opuesta a aumentar.' },
  { stem:'Busca un sinónimo de «valiente».', answer:'audaz', distractors:['cobarde','tímido','débil'], solution:'«Audaz» comparte la idea de afrontar riesgos con decisión.' },
  { stem:'Busca un antónimo de «flexible».', answer:'rígido', distractors:['elástico','adaptable','maleable'], solution:'«Rígido» se opone a «flexible».' },
  { stem:'Busca un sinónimo de «preciso».', answer:'exacto', distractors:['confuso','aproximado','dudoso'], solution:'«Exacto» puede ser sinónimo de «preciso».' },
  { stem:'Busca un antónimo de «frecuente».', answer:'raro', distractors:['habitual','común','repetido'], solution:'«Raro» puede expresar que algo ocurre pocas veces.' },
]

const POLYSEMY_CASES: Case[] = [
  { stem:'En «La hoja del árbol cayó al suelo», ¿qué significa «hoja»?', answer:'Parte plana de una planta', distractors:['Lámina de papel','Cuchilla de una herramienta','Página web'], solution:'El contexto del árbol indica la parte vegetal.' },
  { stem:'En «Escribe tu nombre en la hoja», ¿qué significa «hoja»?', answer:'Lámina de papel', distractors:['Parte de una planta','Cuchilla metálica','Rama fina'], solution:'La acción de escribir sitúa «hoja» en el sentido de papel.' },
  { stem:'En «El ratón se escondió detrás del armario», ¿qué significa «ratón»?', answer:'Pequeño mamífero roedor', distractors:['Dispositivo de ordenador','Persona muy tímida','Botón de una máquina'], solution:'«Se escondió detrás del armario» describe un animal.' },
  { stem:'En «El ratón del ordenador no responde», ¿qué significa «ratón»?', answer:'Dispositivo para controlar el cursor', distractors:['Animal roedor','Tecla del teclado','Pantalla táctil'], solution:'«Del ordenador» activa el significado informático.' },
  { stem:'En «La sierra corta la madera», ¿qué significa «sierra»?', answer:'Herramienta para cortar', distractors:['Cadena montañosa','Animal marino','Camino estrecho'], solution:'El verbo «corta» señala la herramienta.' },
  { stem:'En «Atravesamos una sierra cubierta de pinos», ¿qué significa «sierra»?', answer:'Conjunto o cadena de montañas', distractors:['Herramienta dentada','Máquina de coser','Tipo de árbol'], solution:'El paisaje de montañas y pinos indica el accidente geográfico.' },
  { stem:'En «La planta necesita más luz», ¿qué significa «planta»?', answer:'Ser vivo vegetal', distractors:['Piso de un edificio','Parte inferior del pie','Fábrica industrial'], solution:'La necesidad de luz es propia de un vegetal.' },
  { stem:'En «Vivimos en la tercera planta», ¿qué significa «planta»?', answer:'Piso o nivel de un edificio', distractors:['Vegetal','Parte del pie','Plano de una ciudad'], solution:'«Tercera» y «vivimos» indican un nivel del edificio.' },
  { stem:'En «El pico del ave es muy largo», ¿qué significa «pico»?', answer:'Parte saliente de la boca de un ave', distractors:['Cima de una montaña','Herramienta de cavar','Momento máximo'], solution:'El contexto del ave indica su boca córnea.' },
  { stem:'En «Llegamos al pico de la montaña», ¿qué significa «pico»?', answer:'Cima elevada', distractors:['Boca de un ave','Herramienta metálica','Parte de una botella'], solution:'«De la montaña» señala la cima.' },
  { stem:'En «La cola del perro se mueve», ¿qué significa «cola»?', answer:'Extremidad posterior de un animal', distractors:['Fila de personas','Pegamento','Bebida gaseosa'], solution:'El contexto del perro indica la parte corporal.' },
  { stem:'En «Había una cola enorme en la entrada», ¿qué significa «cola»?', answer:'Fila de personas', distractors:['Extremidad de un animal','Pegamento','Cuerda larga'], solution:'En una entrada, «cola» significa una fila de personas esperando.' },
]

const FAMILY_CASES: Case[] = [
  { stem:'¿Qué palabra pertenece a la familia léxica de «flor»?', answer:'florero', distractors:['flotar','flauta','flexible'], solution:'«Florero» comparte el lexema «flor-».' },
  { stem:'¿Qué palabra pertenece a la familia léxica de «libro»?', answer:'librería', distractors:['libertad','libélula','líbero'], solution:'«Librería» deriva del lexema relacionado con «libro».' },
  { stem:'¿Qué palabra pertenece a la familia léxica de «nube»?', answer:'nublado', distractors:['nuevo','nuez','número'], solution:'«Nublado» se forma a partir de la base léxica relacionada con «nube».' },
  { stem:'¿Qué palabra pertenece a la familia léxica de «pan»?', answer:'panadería', distractors:['pantalla','pandilla','pantera'], solution:'«Panadería» comparte la raíz «pan-».' },
  { stem:'¿Qué palabra pertenece a la familia léxica de «mar»?', answer:'marinero', distractors:['martillo','marrón','marca'], solution:'«Marinero» se relaciona léxicamente con «mar».' },
  { stem:'¿Qué palabra pertenece a la familia léxica de «sol»?', answer:'soleado', distractors:['soltar','soledad','soldado'], solution:'«Soleado» se forma a partir de «sol».' },
  { stem:'¿Qué palabra pertenece a la familia léxica de «papel»?', answer:'papelería', distractors:['papilla','paralelo','palmera'], solution:'«Papelería» comparte la base «papel-».' },
  { stem:'¿Qué palabra pertenece a la familia léxica de «zapato»?', answer:'zapatero', distractors:['zafiro','zanahoria','zumbido'], solution:'«Zapatero» deriva de «zapato».' },
  { stem:'¿Qué palabra pertenece a la familia léxica de «leche»?', answer:'lechero', distractors:['lechuga','lecho','lector'], solution:'«Lechero» comparte la base léxica «lech-» asociada a «leche».' },
  { stem:'¿Qué palabra pertenece a la familia léxica de «casa»?', answer:'casero', distractors:['casual','casino','casilla'], solution:'«Casero» deriva del sustantivo «casa».' },
  { stem:'¿Qué palabra pertenece a la familia léxica de «jardín»?', answer:'jardinero', distractors:['jarabe','jarra','jabalí'], solution:'«Jardinero» comparte el lexema «jardin-».' },
  { stem:'¿Qué palabra pertenece a la familia léxica de «campo»?', answer:'campesino', distractors:['campana','campeón','camisa'], solution:'«Campesino» pertenece a la familia de «campo».' },
]

const FORMATION_CASES: Case[] = [
  { stem:'En «imposible», ¿qué procedimiento aparece respecto de «posible»?', answer:'Prefijación', distractors:['Sufijación','Composición','Siglación'], solution:'El prefijo «im-» se añade delante de «posible».' },
  { stem:'En «panadero», ¿qué procedimiento aparece respecto de «pan»?', answer:'Sufijación', distractors:['Prefijación','Composición','Acortamiento'], solution:'El sufijo «-adero» se añade a la base «pan-».' },
  { stem:'¿Cómo se forma «sacapuntas»?', answer:'Composición', distractors:['Prefijación','Sufijación','Acronimia'], solution:'Une dos bases léxicas: «saca» y «puntas».' },
  { stem:'En «releer», ¿qué procedimiento aparece respecto de «leer»?', answer:'Prefijación', distractors:['Sufijación','Composición','Abreviación'], solution:'El prefijo «re-» aporta la idea de repetición.' },
  { stem:'En «felicidad», ¿qué procedimiento aparece respecto de «feliz»?', answer:'Sufijación', distractors:['Prefijación','Composición','Siglación'], solution:'El sufijo «-idad» forma un sustantivo abstracto.' },
  { stem:'¿Cómo se forma «pararrayos»?', answer:'Composición', distractors:['Prefijación','Sufijación','Acortamiento'], solution:'La palabra combina dos elementos léxicos en una unidad.' },
  { stem:'En «desconectar», ¿qué procedimiento aparece respecto de «conectar»?', answer:'Prefijación', distractors:['Sufijación','Composición','Acronimia'], solution:'El prefijo «des-» se añade antes de la base.' },
  { stem:'En «amabilidad», ¿qué procedimiento aparece respecto de «amable»?', answer:'Sufijación', distractors:['Prefijación','Composición','Siglación'], solution:'El sufijo «-idad» crea un sustantivo abstracto.' },
  { stem:'¿Cómo se forma «lavavajillas»?', answer:'Composición', distractors:['Prefijación','Sufijación','Abreviación'], solution:'Combina dos bases para nombrar un objeto.' },
  { stem:'En «submarino», ¿qué procedimiento aparece respecto de «marino»?', answer:'Prefijación', distractors:['Sufijación','Composición','Acortamiento'], solution:'Se añade el prefijo «sub-» delante de «marino».' },
  { stem:'En «deportista», ¿qué procedimiento aparece respecto de «deporte»?', answer:'Sufijación', distractors:['Prefijación','Composición','Siglación'], solution:'El sufijo «-ista» forma un nombre relacionado con una actividad.' },
  { stem:'¿Cómo se forma «abrelatas»?', answer:'Composición', distractors:['Prefijación','Sufijación','Acronimia'], solution:'Se unen «abre» y «latas» para crear una nueva palabra.' },
]

const CASES: Record<string, Case[]> = {
  L02S01: WORD_CLASS_CASES,
  L02S02: SUBJECT_CASES,
  L02S03: HEAD_CASES,
  L02S04: AGREEMENT_CASES,
  L03S01: SYN_ANT_CASES,
  L03S02: POLYSEMY_CASES,
  L03S03: FAMILY_CASES,
  L03S04: FORMATION_CASES,
}

const PROMPT_FRAMES = [
  (stem:string) => stem,
  (stem:string) => `Reto de análisis: ${stem}`,
  (stem:string) => `Piensa en la regla y responde: ${stem}`,
  (stem:string) => `Comprueba tu dominio de lengua: ${stem}`,
] as const

function rotate<T>(items:T[], shift:number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

export function generateSpanishWordsVariant(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  const cases = CASES[skill.id]
  if (!cases?.length) return null
  const normalized = seed >>> 0
  const caseIndex = normalized % cases.length
  const frameIndex = Math.floor(normalized / cases.length) % PROMPT_FRAMES.length
  const selected = cases[caseIndex]
  const options = rotate([selected.answer, ...selected.distractors], normalized + difficulty)
  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: PROMPT_FRAMES[frameIndex](selected.stem),
    options,
    answerIndex: options.indexOf(selected.answer),
    solution: selected.solution,
    tags: [skill.generator_key, 'spanish', 'words_course_depth'],
  }
}

export function spanishWordsVariantCount(skillId: string) {
  return (CASES[skillId]?.length ?? 0) * PROMPT_FRAMES.length
}

export function spanishWordsVariantSkillIds() {
  return Object.keys(CASES)
}
