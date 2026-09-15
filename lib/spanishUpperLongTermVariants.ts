import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta={id:string;name:string;generator_key:string}
type Card={level:number;prompt:string;answer:string;distractors:[string,string,string];solution:string}
const c=(level:number,prompt:string,answer:string,distractors:[string,string,string],solution:string):Card=>({level,prompt,answer,distractors,solution})

const BANK:Record<string,Card[]>={
L04S01:[
c(1,'¿Qué palabra aguda debe llevar tilde?','compás',['pared','reloj','animal'],'«Compás» es aguda terminada en -s.'),
c(1,'¿Qué palabra llana debe llevar tilde?','árbol',['mesa','joven','lunes'],'«Árbol» es llana terminada en consonante distinta de n o s.'),
c(2,'¿Qué palabra es esdrújula?','médico',['camión','pared','reloj'],'Las esdrújulas llevan el golpe de voz en la antepenúltima sílaba.'),
c(2,'¿Cuál está correctamente escrita?','difícil',['dificil','díficil','difícíl'],'«Difícil» es llana terminada en consonante distinta de n o s.'),
c(3,'¿Qué opción explica la tilde de «canción»?','Es aguda terminada en n',['Es llana terminada en vocal','Es esdrújula','La tilde es opcional'],'Las agudas acabadas en vocal, n o s llevan tilde.'),
c(3,'¿Cuál necesita tilde para distinguir significado?','tú',['tu','casa','mesa'],'«Tú» lleva tilde diacrítica cuando es pronombre.'),
c(4,'En «Aun no sé si él vendrá», ¿qué corrección corresponde?','Aún no sé si él vendrá',['Aun no se si el vendra','Aún no se si él vendrá','Aun no sé si el vendrá'],'«Aún» equivale a «todavía» y «sé/él» llevan tilde diacrítica.'),
c(4,'¿Qué forma está bien acentuada?','río',['rio','rióo','ríó'],'«Río» lleva tilde por hiato: vocal cerrada tónica junto a vocal abierta.')],
L04S02:[
c(1,'Elige la palabra correctamente escrita.','viaje',['biage','viage','biaje'],'«Viaje» se escribe con v y j.'),
c(1,'Elige la palabra correctamente escrita.','haber',['aver','haver','aber'],'El infinitivo «haber» se escribe con h y b.'),
c(2,'Completa: «Ayer ___ mucha gente en el museo».','hubo',['ubo','huvo','uvo'],'La forma del verbo haber es «hubo», con h y b.'),
c(2,'¿Cuál está bien escrita?','proteger',['protejer','protejér','protteger'],'«Proteger» se escribe con g ante e.'),
c(3,'Selecciona la frase correcta.','Voy a ver si ha llegado',['Voy haber si a llegado','Boy a ver si ha llegado','Voy a ber si a llegado'],'«A ver» es la expresión correcta y «ha» pertenece al verbo haber.'),
c(3,'¿Cuál palabra contiene h correctamente?','hervir',['ervir','herbir','erbir'],'«Hervir» se escribe con h y v.'),
c(4,'Corrige «No savía que iva a llover».','No sabía que iba a llover.',['No savía que iba a llover.','No sabía que iva a llover.','No sabía que hiba a llover.'],'«Sabía» se escribe con b e «iba» con b.'),
c(4,'¿Qué opción está enteramente bien escrita?','El viajero recogió su equipaje',['El biagero recogió su equipage','El viajero recojió su equipaje','El viagero recogió su equipaje'],'«Viajero», «recogió» y «equipaje» siguen sus grafías normativas.')],
L04S03:[
c(1,'¿Qué oración usa bien la coma en una enumeración?','Compré pan, fruta, leche y arroz.',['Compré, pan fruta leche y arroz.','Compré pan fruta leche y arroz.','Compré pan; fruta leche y arroz?'],'La coma separa elementos de una enumeración.'),
c(1,'¿Cuál usa correctamente la interrogación?','¿Vienes mañana?',['Vienes mañana?','¿Vienes mañana.','Vienes ¿mañana?'],'En español se usan signos de apertura y cierre.'),
c(2,'¿Cuál usa bien los dos puntos?','Trae tres cosas: cuaderno, lápiz y regla.',['Trae: tres cosas cuaderno lápiz y regla.','Trae tres cosas, cuaderno: lápiz y regla.','Trae tres cosas;: cuaderno lápiz y regla.'],'Los dos puntos pueden introducir una enumeración anunciada.'),
c(2,'¿Qué frase usa bien mayúscula inicial?','Mañana viajamos a Toledo.',['mañana viajamos a Toledo.','Mañana viajamos a toledo.','mañana viajamos a toledo.'],'La oración empieza con mayúscula y el nombre propio también.'),
c(3,'¿Cuál puntúa mejor un vocativo?','Lucía, ven un momento.',['Lucía ven, un momento.','Lucía ven un momento.','Lucía; ven, un momento.'],'El vocativo se separa con coma.'),
c(3,'¿Qué opción separa correctamente dos ideas completas?','Llegó tarde; el autobús se había averiado.',['Llegó tarde, el autobús se había averiado.','Llegó tarde:; el autobús se había averiado.','Llegó tarde? el autobús se había averiado.'],'El punto y coma puede separar oraciones relacionadas.'),
c(4,'¿Qué frase usa correctamente las comillas?','El profesor dijo: «Empezamos ahora».',['El profesor dijo «: Empezamos ahora».','El profesor dijo, «Empezamos ahora».','El profesor dijo: Empezamos «ahora».'],'Los dos puntos introducen la cita y las comillas delimitan las palabras citadas.'),
c(4,'Corrige la puntuación: «Si estudias apruebas pero debes organizarte».','Si estudias, apruebas, pero debes organizarte.',['Si estudias apruebas pero, debes organizarte.','Si estudias; apruebas pero debes, organizarte.','Si estudias apruebas: pero debes organizarte.'],'La subordinada inicial y el conector adversativo se separan con comas.')],
L04S04:[
c(1,'¿Qué corrección necesita «Mi ermano llegó tarde»?','Cambiar «ermano» por «hermano»',['Cambiar «llegó» por «llego»','Quitar «Mi»','Escribir «tarde» con v'],'«Hermano» se escribe con h.'),
c(1,'Corrige «Ayer tubo fiebre».','Ayer tuvo fiebre.',['Ayer tubo fiebre.','Ayer tuvo fievre.','Ayer tuvo fiébre.'],'El pasado de «tener» es «tuvo».'),
c(2,'¿Qué error hay en «Fuimos ala biblioteca»?','Debe escribirse «a la»',['Debe escribirse «hala»','«Biblioteca» lleva tilde','«Fuimos» lleva b'],'Preposición y artículo se escriben separados.'),
c(2,'Corrige «La jente estaba contenta».','La gente estaba contenta.',['La jente estava contenta.','La gente estava contenta.','La gente estaba contentá.'],'«Gente» se escribe con g y «estaba» con b.'),
c(3,'¿Qué versión está bien revisada?','¿Por qué no viniste ayer?',['¿Porque no viniste ayer?','Por qué no viniste ayer?','¿Porqué no viniste ayer?'],'En pregunta directa se escribe «por qué» separado y con tilde.'),
c(3,'Corrige «Haber si vienes mañana».','A ver si vienes mañana.',['Aver si vienes mañana.','A ver si bienes mañana.','Haber si bienes mañana.'],'La expresión es «a ver» y «vienes» procede de venir.'),
c(4,'¿Qué versión corrige todos los errores? «El sabado fuimos de excursion y vimos un aguila».','El sábado fuimos de excursión y vimos un águila.',['El sabado fuimos de excursión y vimos un águila.','El sábado fuimos de excursion y vimos un aguila.','El sábado fuimos de excursión y vimos un aguila.'],'«Sábado», «excursión» y «águila» requieren tilde.'),
c(4,'Revisa: «Maria dijo que vendria, sin embargo no aparecio».','María dijo que vendría; sin embargo, no apareció.',['Maria dijo que vendría sin embargo no apareció.','María dijo que vendria, sin embargo no aparecio.','María dijo que vendría: sin embargo no apareció.'],'Se corrigen tildes y se separan adecuadamente dos oraciones relacionadas.')],
L05S01:[
c(1,'¿Qué elemento es imprescindible en una narración?','Una sucesión de acontecimientos',['Una lista de definiciones','Solo instrucciones','Una tabla de datos'],'Narrar consiste en contar hechos que se desarrollan en el tiempo.'),
c(1,'¿Quién cuenta los hechos de una narración?','El narrador',['El lector','El editor','El título'],'El narrador es la voz que relata.'),
c(2,'Si el narrador dice «Entré en la casa y encendí la luz», ¿qué persona usa?','Primera persona',['Segunda persona','Tercera persona','Forma impersonal'],'«Entré» y «encendí» muestran primera persona.'),
c(2,'¿Qué parte de una narración presenta normalmente el problema principal?','El nudo',['El título','La bibliografía','El pie de página'],'En el nudo se desarrolla el conflicto.'),
c(3,'Un relato empieza por el final y luego vuelve al pasado. ¿Qué recurso usa?','Retrospección o analepsis',['Enumeración','Definición','Descripción objetiva'],'El texto altera el orden cronológico para regresar a hechos anteriores.'),
c(3,'¿Qué hace avanzar mejor una narración?','Acciones conectadas por causas y consecuencias',['Adjetivos sin relación','Listas independientes','Repetir el título'],'La progresión narrativa depende de acontecimientos relacionados.'),
c(4,'¿Qué diferencia hay entre autor y narrador?','El autor crea la obra; el narrador es la voz que cuenta',['Son siempre la misma figura','El narrador imprime el libro','El autor es un personaje obligatorio'],'El narrador es una construcción textual y no debe confundirse con la persona autora.'),
c(4,'¿Qué final resulta más coherente?','Uno que resuelve o transforma el conflicto planteado',['Uno que introduce personajes sin relación','Uno que contradice todos los hechos sin explicación','Uno que repite el inicio sin cambio'],'La coherencia narrativa exige conexión con el conflicto desarrollado.')],
L05S02:[
c(1,'¿Qué rasgo caracteriza una descripción objetiva?','Usa datos verificables y evita valoraciones personales',['Expresa solo emociones','Inventa acciones','Usa siempre primera persona'],'La objetividad se apoya en rasgos observables.'),
c(1,'¿Qué clase de palabra aparece mucho en descripciones?','Adjetivos calificativos',['Conjunciones exclusivamente','Interjecciones únicamente','Números romanos'],'Los adjetivos expresan cualidades.'),
c(2,'¿Cuál es una descripción subjetiva?','El valle parecía mágico al atardecer.',['El valle mide 12 km de longitud.','La torre tiene cuatro ventanas.','El río nace a 900 m de altitud.'],'«Mágico» refleja una valoración personal.'),
c(2,'¿Qué orden ayuda a describir una habitación con claridad?','Seguir un recorrido espacial coherente',['Saltar al azar entre objetos','Repetir solo colores','Omitir toda referencia espacial'],'Un criterio espacial facilita que el lector reconstruya el lugar.'),
c(3,'¿Qué efecto produce una comparación en una descripción?','Relaciona un rasgo con otra realidad para hacerlo más expresivo',['Convierte el texto en ley','Elimina toda imagen mental','Impide usar adjetivos'],'La comparación ayuda a visualizar o intensificar un rasgo.'),
c(3,'¿Qué opción combina dato y valoración?','La torre mide 40 metros y resulta imponente.',['La torre mide 40 metros.','La torre es imponente.','Hay una torre.'],'Incluye un dato verificable y una apreciación subjetiva.'),
c(4,'¿Qué mejora una descripción demasiado enumerativa?','Agrupar rasgos y relacionarlos mediante un criterio',['Añadir más objetos sin orden','Eliminar conectores','Usar solo frases nominales aisladas'],'La organización convierte una lista en una descripción cohesionada.'),
c(4,'¿Qué diferencia hay entre prosopografía y etopeya?','La primera describe rasgos físicos y la segunda rasgos de carácter',['Ambas significan narrar acciones','La primera describe lugares y la segunda fechas','No existe diferencia'],'Son dos tipos tradicionales de descripción de personas.')],
L05S03:[
c(1,'¿Cuál es el objetivo de un texto expositivo?','Explicar o informar con claridad',['Narrar una aventura necesariamente','Dar órdenes siempre','Expresar solo emociones'],'La exposición organiza conocimiento para hacerlo comprensible.'),
c(1,'¿Qué conector introduce un ejemplo?','por ejemplo',['sin embargo','por tanto','aunque'],'«Por ejemplo» presenta un caso concreto.'),
c(2,'¿Qué estructura sirve para explicar por qué ocurre algo?','Causa y consecuencia',['Rima y métrica','Diálogo dramático','Enumeración aleatoria'],'La relación causal organiza explicaciones.'),
c(2,'¿Qué opción define mejor un concepto?','Indica qué es y sus rasgos esenciales',['Cuenta una anécdota sin relación','Da una opinión sin razones','Formula una orden'],'Definir delimita significado y características básicas.'),
c(3,'¿Qué mejora la claridad de una exposición?','Usar apartados, ejemplos y conectores adecuados',['Cambiar de tema continuamente','Eliminar títulos y conectores','Usar tecnicismos sin explicar'],'La organización y los apoyos facilitan la comprensión.'),
c(3,'¿Cómo se distingue una explicación de una simple lista de datos?','Relaciona la información mostrando cómo o por qué',['Tiene más números','Siempre es más corta','No usa verbos'],'Explicar establece relaciones entre datos e ideas.'),
c(4,'¿Qué debe hacer un texto divulgativo con un término técnico necesario?','Introducirlo y explicarlo para el lector',['Eliminarlo siempre','Usarlo sin contexto','Repetirlo muchas veces sin definir'],'La divulgación adapta el conocimiento al destinatario.'),
c(4,'¿Qué hace fiable una explicación escolar?','Distingue hechos, ejemplos y afirmaciones justificadas',['Presenta opiniones como datos','Evita citar evidencias','Usa frases ambiguas'],'La precisión exige apoyar afirmaciones y separar ejemplos de conclusiones.')],
L05S04:[
c(1,'¿Qué conviene revisar primero en un borrador?','Si las ideas se entienden y siguen un orden',['El tipo de letra únicamente','Que todas las frases midan lo mismo','Que haya muchas palabras difíciles'],'Primero se revisa contenido y organización.'),
c(1,'¿Qué ayuda a unir ideas?','Conectores adecuados',['Repetir la misma palabra','Eliminar pronombres','Escribir todo en mayúsculas'],'Los conectores muestran relaciones lógicas.'),
c(2,'Un párrafo contiene dos temas sin relación. ¿Qué mejora conviene?','Separarlos o reorganizarlos según una idea principal',['Añadir comas al azar','Eliminar todos los verbos','Poner ambos en mayúsculas'],'Cada párrafo debe mantener una unidad temática razonable.'),
c(2,'¿Qué cambio mejora precisión?','Sustituir una palabra vaga por otra más concreta',['Añadir adjetivos sin necesidad','Repetir la misma idea','Alargar todas las frases'],'La precisión léxica hace el texto más claro.'),
c(3,'¿Qué diferencia hay entre revisar y corregir?','Revisar atiende también a ideas y estructura; corregir puede centrarse en errores formales',['Son procesos opuestos','Revisar solo busca tildes','Corregir solo cambia el título'],'La revisión es más amplia que la corrección ortográfica.'),
c(3,'¿Qué señal indica falta de cohesión?','Pronombres o conectores cuyo referente no está claro',['Uso de párrafos','Presencia de verbos','Un título relacionado'],'La cohesión exige que las referencias y relaciones sean comprensibles.'),
c(4,'¿Qué estrategia ayuda a detectar frases confusas?','Leer el texto en voz alta y reformular donde se atasca el sentido',['Añadir comas tras cada palabra','Eliminar todos los nexos','Cambiar todos los verbos a futuro'],'La lectura en voz alta permite detectar problemas de sintaxis y ritmo.'),
c(4,'¿Qué revisión final es más completa?','Contenido, estructura, cohesión, vocabulario, ortografía y puntuación',['Solo contar palabras','Solo cambiar el título','Solo comprobar mayúsculas'],'Una revisión completa combina niveles globales y formales.')],
L06S01:[
c(1,'¿Qué género se escribe normalmente para ser representado?','Teatro',['Lírica','Noticia','Diccionario'],'El teatro se organiza como acción y diálogo escénico.'),
c(1,'¿Qué género suele expresar emociones mediante una voz poética?','Lírica',['Narrativa','Teatro','Manual'],'La lírica se asocia a una voz poética y expresión subjetiva.'),
c(2,'¿Qué rasgo caracteriza la narrativa?','Un narrador cuenta acontecimientos',['Solo contiene acotaciones','Carece de personajes siempre','Usa versos obligatoriamente'],'La narrativa relata hechos mediante una voz narradora.'),
c(2,'¿Qué elemento es propio del texto teatral?','Acotaciones escénicas',['Narrador obligatorio','Notas al pie científicas','Índice temático'],'Las acotaciones orientan acciones, espacio o interpretación.'),
c(3,'Un texto en versos con ritmo y voz subjetiva pertenece probablemente a…','Lírica',['Informe científico','Noticia','Manual de instrucciones'],'Verso, ritmo y voz poética son rasgos frecuentes de la lírica.'),
c(3,'¿Puede una obra mezclar géneros?','Sí, puede combinar rasgos narrativos, líricos o dramáticos',['No, nunca','Solo si no tiene autor','Solo en textos científicos'],'Los géneros son categorías útiles pero las obras pueden hibridarlos.'),
c(4,'¿Por qué clasificar por género es útil?','Ayuda a reconocer convenciones y expectativas de lectura',['Determina una única interpretación','Hace innecesario leer la obra','Impide comparar textos'],'Los géneros orientan sobre formas y recursos habituales.'),
c(4,'¿Qué diferencia básica hay entre diálogo narrativo y dramático?','En teatro el diálogo sostiene directamente la acción escénica',['En narrativa nunca hay diálogo','En teatro siempre hay narrador','No existe ninguna diferencia funcional'],'En el drama la acción se presenta mediante parlamentos y acotaciones.')],
L06S02:[
c(1,'«Tus ojos son estrellas». ¿Qué recurso aparece?','Metáfora',['Enumeración','Hipérbole','Onomatopeya'],'Se identifica una realidad con otra sin «como».'),
c(1,'«Corre como el viento». ¿Qué recurso aparece?','Comparación',['Metáfora pura','Personificación','Ironía'],'El nexo «como» establece comparación explícita.'),
c(2,'«La ciudad despertó enfadada». ¿Qué recurso aparece?','Personificación',['Definición','Enumeración','Aliteración'],'Se atribuye una cualidad humana a la ciudad.'),
c(2,'«Te lo he dicho un millón de veces». ¿Qué recurso aparece?','Hipérbole',['Metáfora','Comparación','Anáfora'],'Se exagera deliberadamente una cantidad.'),
c(3,'¿Qué efecto puede tener repetir «nadie» al inicio de varias frases?','Crear énfasis y ritmo mediante anáfora',['Eliminar el sentido','Convertirlo en definición','Hacerlo objetivo necesariamente'],'La repetición inicial refuerza una idea y estructura el ritmo.'),
c(3,'«Susurran las hojas suaves». ¿Qué recurso sonoro puede apreciarse?','Aliteración',['Metáfora','Ironía','Hipérbaton'],'La repetición de sonidos semejantes puede producir un efecto auditivo.'),
c(4,'¿Por qué una metáfora puede admitir varias interpretaciones?','Porque relaciona significados y depende del contexto',['Porque no tiene sentido','Porque toda metáfora significa exactamente lo mismo','Porque elimina el tema'],'La relación figurada se interpreta según contexto, tono y asociaciones.'),
c(4,'¿Qué diferencia hay entre comparación y metáfora?','La comparación explicita el vínculo; la metáfora identifica o sustituye',['No hay ninguna','La metáfora siempre usa «como»','La comparación elimina imágenes'],'La comparación suele marcar semejanza con nexos; la metáfora establece una equivalencia figurada.')],
L06S03:[
c(1,'¿Qué personaje ocupa normalmente el centro de la acción?','El protagonista',['El editor','El lector','El impresor'],'El protagonista articula el conflicto principal.'),
c(1,'¿Qué es el conflicto narrativo?','La tensión o problema que impulsa la acción',['El tipo de letra','La portada','La lista de capítulos'],'El conflicto genera objetivos, obstáculos o tensiones.'),
c(2,'¿Qué función puede tener un antagonista?','Oponerse o dificultar el objetivo del protagonista',['Narrar obligatoriamente','Escribir el libro','Resolver siempre el conflicto'],'El antagonista representa una fuerza de oposición.'),
c(2,'Si conocemos pensamientos de varios personajes, ¿qué narrador es probable?','Omnisciente',['Testigo limitado necesariamente','Segunda persona obligatoria','Narrador inexistente'],'El narrador omnisciente puede acceder a la interioridad de varios personajes.'),
c(3,'¿Qué diferencia hay entre personaje principal y secundario?','Su peso en el conflicto y desarrollo de la obra',['Su edad','El número de letras de su nombre','El color de su ropa'],'La importancia narrativa depende de su función en la trama.'),
c(3,'Un personaje cambia tras superar una experiencia. ¿Qué muestra?','Evolución del personaje',['Ausencia de conflicto','Error gramatical','Narrador externo'],'Los acontecimientos pueden transformar objetivos, valores o conducta.'),
c(4,'¿Puede el antagonista ser una situación y no una persona?','Sí, puede ser una fuerza social, natural o interna',['No, siempre debe ser humano','Solo puede ser un animal','Solo existe en teatro'],'El conflicto puede surgir de múltiples tipos de oposición.'),
c(4,'¿Qué hace complejo a un personaje?','Tener motivaciones, contradicciones y cambios comprensibles',['Ser siempre bueno o malo','Aparecer muchas veces sin objetivo','Hablar con frases largas'],'La complejidad nace de motivaciones y evolución coherentes.')],
L06S04:[
c(1,'En «nadie vino, nadie llamó, nadie preguntó», ¿qué efecto produce la repetición?','Refuerza la sensación de abandono',['Elimina el tema','Convierte el texto en receta','Impide interpretar'],'La repetición intensifica una idea y crea ritmo.'),
c(1,'Una hoja que cae en un poema sobre el tiempo puede simbolizar…','Cambio o final de una etapa',['Una instrucción literal','Una fecha exacta','Una fórmula'],'Un elemento concreto puede representar una idea abstracta.'),
c(2,'Si un fragmento describe una casa oscura antes de un peligro, ¿qué efecto puede crear?','Anticipación y tensión',['Neutralidad absoluta','Humor necesariamente','Una definición técnica'],'La ambientación puede preparar emocionalmente al lector.'),
c(2,'¿Qué aporta una metáfora al tema de un poema?','Puede condensar una idea y darle fuerza evocadora',['Elimina cualquier emoción','Sustituye toda interpretación por datos','Impide relacionar forma y contenido'],'La imagen figurada puede intensificar el significado temático.'),
c(3,'Un narrador repite una misma imagen al inicio y al final. ¿Qué puede producir?','Unidad y cierre estructural',['Desorden inevitable','Ausencia de tema','Cambio de género obligatorio'],'La recurrencia de motivos puede cohesionar el texto.'),
c(3,'¿Qué conviene hacer al interpretar un símbolo?','Relacionarlo con el contexto y con otros elementos del texto',['Elegir un significado aislado sin leer','Buscar una única respuesta universal','Ignorar el tema'],'El símbolo adquiere sentido dentro de la obra concreta.'),
c(4,'Dos lectores proponen interpretaciones distintas y ambas citan evidencias. ¿Qué conclusión es razonable?','Puede haber más de una interpretación defendible',['Solo una lectura puede existir siempre','Toda interpretación vale sin pruebas','Las evidencias no importan'],'La interpretación literaria puede admitir pluralidad si está argumentada.'),
c(4,'¿Qué significa relacionar forma y tema?','Explicar cómo recursos, estructura o voz contribuyen al significado',['Resumir solo el argumento','Contar palabras','Nombrar el género sin justificar'],'La lectura profunda conecta cómo está escrito con qué comunica.')]
}

const FRAMES=[
(p:string)=>p,
(p:string)=>`Reto de Lengua: ${p}`,
(p:string)=>`Aplica la regla y responde: ${p}`,
(p:string)=>`Analiza con atención: ${p}`,
] as const
function rotate<T>(items:T[],shift:number){const o=((shift%items.length)+items.length)%items.length;return items.slice(o).concat(items.slice(0,o))}
export function generateSpanishUpperLongTermVariant(skill:SkillMeta,difficulty:number,seed:number):GeneratedQuestion|null{
 const cards=BANK[skill.id]; if(!cards?.length)return null
 const eligible=cards.filter(card=>Math.abs(card.level-difficulty)<=1); const pool=eligible.length?eligible:cards
 const n=seed>>>0; const card=pool[n%pool.length]; const frame=FRAMES[Math.floor(n/pool.length)%FRAMES.length]
 const options=rotate([card.answer,...card.distractors],n+difficulty)
 return {skillId:skill.id,label:skill.name,difficulty,seed,prompt:frame(card.prompt),options,answerIndex:options.indexOf(card.answer),solution:card.solution,tags:[skill.generator_key,'spanish','spanish_upper_course_depth']}
}
export const spanishUpperVariantSkillIds=()=>Object.keys(BANK)
export const spanishUpperVariantCount=(skillId:string)=>(BANK[skillId]?.length??0)*FRAMES.length
