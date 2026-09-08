import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Variant = { prompt: string; answer: string; distractors: [string,string,string]; solution: string }

const BANK: Record<string, Variant[]> = {
  L01S01: [
    { prompt:'Lee: «El ayuntamiento ha ampliado las zonas peatonales para reducir ruido, mejorar la seguridad y facilitar los paseos». ¿Cuál es la idea principal?', answer:'Las zonas peatonales aportan varios beneficios a la ciudad', distractors:['Solo sirven para reducir el ruido','Impiden caminar por la ciudad','El ayuntamiento quiere eliminar todas las calles'], solution:'La idea principal debe reunir los tres beneficios citados.' },
    { prompt:'Lee: «Preparar la mochila la noche anterior ayuda a no olvidar materiales y permite salir de casa con menos prisa». ¿Qué resume mejor el texto?', answer:'Preparar la mochila con antelación facilita la organización', distractors:['La mochila debe ser siempre pequeña','Salir deprisa ayuda a recordar','Los materiales escolares no son importantes'], solution:'El texto explica cómo una acción previa mejora la organización.' },
    { prompt:'Lee: «Las abejas polinizan muchas plantas y contribuyen a la producción de numerosos alimentos». ¿Cuál es la idea principal?', answer:'Las abejas son importantes para las plantas y la alimentación', distractors:['Las abejas solo producen miel','Todas las plantas dependen de una sola abeja','Los alimentos no necesitan plantas'], solution:'La idea principal engloba polinización y producción de alimentos.' },
    { prompt:'Lee: «Practicar deporte con regularidad fortalece el cuerpo, mejora la resistencia y puede ayudar a reducir el estrés». ¿Qué idea resume el texto?', answer:'El deporte regular aporta beneficios físicos y emocionales', distractors:['El deporte solo sirve para competir','La resistencia empeora al entrenar','El estrés desaparece siempre por completo'], solution:'El texto presenta beneficios de distintos tipos.' },
    { prompt:'Lee: «Un buen horario de estudio reparte las tareas, incluye descansos y evita dejar todo para el último día». ¿Cuál es la idea principal?', answer:'Organizar el estudio ayuda a trabajar de forma más equilibrada', distractors:['Estudiar sin pausas es siempre mejor','Todas las tareas deben hacerse el último día','Un horario solo sirve para apuntar exámenes'], solution:'La idea central es la utilidad de una planificación equilibrada.' },
    { prompt:'Lee: «Los mercados locales permiten comprar productos cercanos y favorecen a pequeños productores de la zona». ¿Qué resume mejor el texto?', answer:'Los mercados locales benefician al consumo cercano y a productores locales', distractors:['Solo venden productos importados','Los pequeños productores no participan','Comprar cerca siempre es más caro'], solution:'La idea principal reúne los dos beneficios mencionados.' },
    { prompt:'Lee: «Cerrar el grifo mientras nos cepillamos los dientes evita gastar agua innecesariamente». ¿Cuál es la idea principal?', answer:'Un gesto sencillo puede ahorrar agua', distractors:['Cepillarse los dientes gasta toda el agua','El grifo debe permanecer abierto','Ahorrar agua solo depende de las fábricas'], solution:'El texto relaciona una acción cotidiana con el ahorro de agua.' },
    { prompt:'Lee: «Los museos conservan objetos del pasado, los investigan y los muestran al público para ayudar a comprender la historia». ¿Qué idea principal expresa?', answer:'Los museos conservan y difunden patrimonio para comprender el pasado', distractors:['Los museos solo guardan cuadros','Investigar objetos históricos no sirve','El público no puede aprender en un museo'], solution:'La frase resume conservación, investigación y divulgación.' },
  ],
  L01S02: [
    { prompt:'«Recuerda traer mañana la autorización firmada». ¿Cuál es la intención principal?', answer:'Recordar o pedir una acción', distractors:['Contar una aventura','Explicar un fenómeno natural','Describir un paisaje'], solution:'El emisor quiere que el receptor realice una acción concreta.' },
    { prompt:'«El concierto comenzará a las ocho y las puertas abrirán media hora antes». ¿Qué intención predomina?', answer:'Informar', distractors:['Convencer','Ordenar','Expresar miedo'], solution:'El mensaje aporta datos prácticos sin pedir ni valorar.' },
    { prompt:'«¡Ojalá podamos volver pronto!». ¿Qué intención predomina?', answer:'Expresar un deseo', distractors:['Dar una instrucción','Definir un concepto','Presentar una noticia'], solution:'La expresión “ojalá” comunica deseo.' },
    { prompt:'«No pises el césped». ¿Cuál es la intención principal?', answer:'Prohibir una acción', distractors:['Narrar un hecho','Preguntar una opinión','Expresar sorpresa'], solution:'La forma negativa imperativa establece una prohibición.' },
    { prompt:'«¿Podrías cerrar la ventana, por favor?». ¿Qué intención principal tiene?', answer:'Pedir algo de forma cortés', distractors:['Informar de una avería','Contar un recuerdo','Explicar una definición'], solution:'La pregunta se usa como petición cortés.' },
    { prompt:'«Este libro te atrapará desde la primera página; no te lo pierdas». ¿Qué intención predomina?', answer:'Recomendar o convencer', distractors:['Dar una fecha','Prohibir una conducta','Explicar una fórmula'], solution:'El mensaje valora el libro y trata de persuadir al receptor.' },
    { prompt:'«¿A qué hora sale el próximo autobús?». ¿Cuál es la intención?', answer:'Solicitar información', distractors:['Dar una orden','Expresar alegría','Definir una palabra'], solution:'La pregunta busca obtener un dato concreto.' },
    { prompt:'«Sentimos las molestias ocasionadas por el retraso». ¿Qué intención predomina?', answer:'Disculparse', distractors:['Amenazar','Dar instrucciones','Narrar una historia'], solution:'El emisor reconoce una molestia y expresa disculpa.' },
  ],
  L01S03: [
    { prompt:'«Cuando Pablo llegó, todos los paraguas goteaban junto a la entrada». ¿Qué podemos inferir?', answer:'Había llovido recientemente', distractors:['Había hecho mucho calor','Los paraguas eran nuevos','La entrada estaba cerrada'], solution:'Los paraguas mojados son una pista de lluvia reciente.' },
    { prompt:'«Ana bajó la voz al entrar y vio a varias personas leyendo en silencio». ¿Dónde es probable que esté?', answer:'En una biblioteca', distractors:['En un estadio','En una piscina','En un mercado al aire libre'], solution:'Leer en silencio y bajar la voz son pistas propias de una biblioteca.' },
    { prompt:'«El suelo estaba cubierto de hojas secas y Marcos llevaba una chaqueta ligera». ¿Qué estación es probable?', answer:'Otoño', distractors:['Verano','Primavera necesariamente','Invierno con nieve'], solution:'Las hojas secas caídas son una pista típica del otoño.' },
    { prompt:'«Lucía apagó las velas mientras todos aplaudían y cantaban». ¿Qué celebración podemos inferir?', answer:'Un cumpleaños', distractors:['Un examen','Una mudanza','Una excursión escolar'], solution:'Velas, aplausos y canto son señales habituales de un cumpleaños.' },
    { prompt:'«El entrenador miró el marcador, pidió tiempo muerto y reunió al equipo». ¿Qué podemos inferir?', answer:'El partido estaba en un momento importante', distractors:['El partido había terminado hace horas','No había competición','El equipo estaba de vacaciones'], solution:'Mirar el marcador y pedir tiempo muerto indica una situación relevante del partido.' },
    { prompt:'«Clara buscó una manta y cerró bien la ventana antes de sentarse». ¿Qué podemos inferir?', answer:'Tenía frío', distractors:['Tenía mucha sed','Quería salir a correr','La habitación estaba demasiado iluminada'], solution:'Buscar una manta y cerrar la ventana son pistas de frío.' },
    { prompt:'«El camarero trajo una carta y preguntó qué querían beber». ¿Dónde están probablemente los personajes?', answer:'En un restaurante o cafetería', distractors:['En una estación de tren','En una biblioteca','En una consulta médica'], solution:'La carta y el camarero sitúan la escena en un establecimiento de comida.' },
    { prompt:'«Miguel guardó los cuadernos, se puso el abrigo y esperó junto a la puerta cuando sonó el timbre». ¿Qué podemos inferir?', answer:'La clase había terminado', distractors:['La clase acababa de empezar','Iba a dormir','Estaba en una piscina'], solution:'Guardar materiales y esperar tras el timbre indica final de clase.' },
  ],
  L01S04: [
    { prompt:'Completa: «No llevó paraguas; ___, terminó empapado».', answer:'por eso', distractors:['sin embargo','además','aunque'], solution:'“Por eso” introduce la consecuencia de no llevar paraguas.' },
    { prompt:'Completa: «El camino era largo; ___, decidieron continuar».', answer:'sin embargo', distractors:['por tanto','porque','así que'], solution:'“Sin embargo” introduce contraste entre la dificultad y la decisión.' },
    { prompt:'Completa: «Primero revisaremos el texto; ___, corregiremos los errores».', answer:'después', distractors:['aunque','porque','sin embargo'], solution:'“Después” marca secuencia temporal.' },
    { prompt:'Completa: «Me gusta leer; ___, disfruto escribiendo relatos».', answer:'además', distractors:['por eso','aunque','en cambio'], solution:'“Además” suma una idea relacionada.' },
    { prompt:'Completa: «No salimos al patio ___ estaba lloviendo».', answer:'porque', distractors:['sin embargo','además','por tanto'], solution:'“Porque” introduce la causa.' },
    { prompt:'Completa: «Había estudiado mucho; ___, estaba nervioso antes del examen».', answer:'aun así', distractors:['por eso','además','porque'], solution:'“Aun así” expresa contraste con la expectativa creada por haber estudiado.' },
    { prompt:'Completa: «Puedes venir en autobús ___ en metro».', answer:'o', distractors:['porque','aunque','sin embargo'], solution:'“O” presenta alternativas.' },
    { prompt:'Completa: «El museo cierra a las seis; ___, debemos llegar antes».', answer:'por tanto', distractors:['aunque','mientras','sin embargo'], solution:'“Por tanto” introduce una consecuencia lógica.' },
  ],
  L06S04: [
    { prompt:'Lee: «La vieja casa parecía suspirar cada vez que soplaba el viento». ¿Qué efecto produce “suspirar”?', answer:'Da a la casa un rasgo humano y crea una atmósfera inquietante', distractors:['Convierte la frase en una instrucción','Indica que la casa respira literalmente','Elimina cualquier emoción'], solution:'La personificación atribuye una acción humana a la casa y crea ambiente.' },
    { prompt:'Lee: «Corría, corría, corría sin mirar atrás». ¿Qué efecto produce la repetición?', answer:'Intensifica la sensación de rapidez y urgencia', distractors:['Detiene completamente la acción','Explica una definición','Indica que el personaje está dormido'], solution:'La repetición refuerza ritmo, intensidad y urgencia.' },
    { prompt:'Lee: «La ciudad era un hormiguero al amanecer». ¿Qué sugiere la metáfora?', answer:'Había mucha actividad y movimiento', distractors:['La ciudad estaba llena de hormigas literalmente','No vivía nadie allí','Todo estaba completamente inmóvil'], solution:'“Hormiguero” se usa metafóricamente para transmitir actividad intensa.' },
    { prompt:'Lee: «El último tren se perdió en la oscuridad y con él se fue su esperanza». ¿Qué tema aparece?', answer:'La pérdida de una oportunidad o esperanza', distractors:['La explicación de una máquina','Una receta de cocina','La descripción objetiva de un mapa'], solution:'El tren funciona como imagen asociada a una oportunidad que desaparece.' },
    { prompt:'Lee: «El río seguía su camino, indiferente a las despedidas de la orilla». ¿Qué puede simbolizar el río?', answer:'El paso continuo del tiempo o de la vida', distractors:['Una norma de tráfico','Una operación matemática','Una lista de objetos'], solution:'El movimiento continuo del río puede simbolizar el paso del tiempo.' },
    { prompt:'Lee: «Su voz era tan baja que parecía esconderse entre las palabras». ¿Qué sensación transmite?', answer:'Timidez, inseguridad o reserva', distractors:['Euforia y ruido','Velocidad física','Una explicación científica'], solution:'La imagen de una voz que “se esconde” sugiere retraimiento.' },
    { prompt:'Lee: «Después de la tormenta, una pequeña luz apareció entre las nubes». En un relato difícil, ¿qué podría representar esa luz?', answer:'Esperanza o posibilidad de mejora', distractors:['Una prohibición','Un dato estadístico','Una derrota inevitable'], solution:'La luz tras la tormenta suele funcionar como símbolo de esperanza.' },
    { prompt:'Lee: «La puerta cerrada seguía frente a él, enorme como una montaña». ¿Qué efecto tiene la comparación?', answer:'Hace que el obstáculo parezca difícil de superar', distractors:['Reduce la importancia del obstáculo','Demuestra que la puerta es una montaña real','Convierte el texto en una noticia'], solution:'Comparar la puerta con una montaña intensifica la sensación de dificultad.' },
  ],
}

function rotate<T>(items:T[], shift:number){
  const offset=((shift%items.length)+items.length)%items.length
  return items.slice(offset).concat(items.slice(0,offset))
}

export function generateSpanishReadingVariant(skill:SkillMeta,difficulty:number,seed:number):GeneratedQuestion|null {
  const variants=BANK[skill.id]
  if(!variants?.length) return null
  const index=((seed+difficulty)%variants.length+variants.length)%variants.length
  const selected=variants[index]
  const options=rotate([selected.answer,...selected.distractors],seed+difficulty)
  return {skillId:skill.id,label:skill.name,difficulty,seed,prompt:selected.prompt,options,answerIndex:options.indexOf(selected.answer),solution:selected.solution,tags:[skill.generator_key,'spanish','reading_gallery_variant']}
}

export function spanishReadingVariantCount(skillId:string){ return BANK[skillId]?.length ?? 0 }
export function spanishReadingVariantSkillIds(){ return Object.keys(BANK) }
