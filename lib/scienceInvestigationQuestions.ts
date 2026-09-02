import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = { prompt: string; answer: string; distractors: [string, string, string]; why: string }

const BANK: Record<string, Card[]> = {
  B01S01: [
    { prompt: '¿Cuál es una hipótesis científica comprobable?', answer: 'Si una planta recibe menos luz, crecerá menos en dos semanas', distractors: ['Las plantas son bonitas', 'La naturaleza es perfecta', 'Me gusta más la luz azul'], why: 'Una hipótesis científica debe poder contrastarse mediante observaciones o experimentos.' },
    { prompt: 'Quieres estudiar si la temperatura influye en la germinación. ¿Qué hipótesis es comprobable?', answer: 'Si aumenta la temperatura dentro de un rango seguro, cambiará el número de semillas que germinan', distractors: ['Las semillas prefieren el calor', 'Germinar es interesante', 'Todas las semillas deberían crecer igual'], why: 'La hipótesis relaciona variables que pueden medirse.' },
    { prompt: '¿Qué pregunta puede investigarse con datos medibles en clase?', answer: '¿Cambia el tiempo de disolución del azúcar al variar la temperatura del agua?', distractors: ['¿Qué bebida sabe mejor?', '¿Es bonito el azúcar?', '¿Cuál es el mejor vaso?'], why: 'Tiempo y temperatura pueden medirse y compararse.' },
    { prompt: 'Un grupo observa que unas hojas están amarillas. ¿Cuál es la mejor pregunta científica inicial?', answer: '¿Qué factor ambiental cambia entre las plantas con hojas verdes y amarillas?', distractors: ['¿Qué planta es más bonita?', '¿Por qué la naturaleza hace eso?', '¿Cuál me gusta más?'], why: 'Una buena pregunta científica busca factores observables y contrastables.' },
    { prompt: '¿Cuál de estas afirmaciones funciona como predicción derivada de una hipótesis?', answer: 'Si la luz favorece el crecimiento, las plantas con más horas de luz crecerán más en el mismo periodo', distractors: ['Las plantas crecerán porque sí', 'La luz siempre es buena', 'Todas las plantas serán idénticas'], why: 'Una predicción concreta indica qué resultado esperar si la hipótesis es correcta.' },
    { prompt: 'Para investigar si el ejercicio cambia la frecuencia cardiaca, ¿qué pregunta está mejor formulada?', answer: '¿Cómo cambia la frecuencia cardiaca tras 3 minutos de ejercicio moderado?', distractors: ['¿Es bueno hacer ejercicio?', '¿Quién corre mejor?', '¿Qué deporte es más divertido?'], why: 'La pregunta define una variable medible y una condición concreta.' },
    { prompt: '¿Qué característica hace útil una hipótesis científica?', answer: 'Que pueda ponerse a prueba y resultar apoyada o refutada por datos', distractors: ['Que sea imposible de discutir', 'Que exprese una preferencia personal', 'Que siempre tenga que ser verdadera'], why: 'Una hipótesis científica debe ser falsable y contrastable.' },
    { prompt: 'Un alumno dice: “El fertilizante hace crecer más las plantas”. ¿Cómo mejorarías esa hipótesis?', answer: 'Si plantas iguales reciben fertilizante, su crecimiento medio en 14 días será mayor que el de plantas sin fertilizante', distractors: ['El fertilizante es estupendo', 'Las plantas crecerán mucho', 'Me gustan las plantas abonadas'], why: 'La versión mejorada define comparación, medida y periodo.' },
  ],
  B01S02: [
    { prompt: 'Al probar cómo afecta la luz al crecimiento, ¿qué variable debemos cambiar deliberadamente?', answer: 'La cantidad de luz', distractors: ['Todas las condiciones a la vez', 'La conclusión', 'El nombre de la planta'], why: 'La variable independiente es la que se modifica para estudiar su efecto.' },
    { prompt: 'En un experimento sobre fertilizante y crecimiento, ¿qué debería mantenerse igual entre grupos?', answer: 'La especie de planta, el agua y el tiempo de crecimiento', distractors: ['La cantidad de fertilizante', 'El resultado final', 'La altura que alcanzarán'], why: 'Controlar las demás condiciones permite atribuir diferencias al factor estudiado.' },
    { prompt: 'Se compara la germinación a 15 °C y 25 °C. ¿Cuál es la variable dependiente?', answer: 'El número o porcentaje de semillas que germinan', distractors: ['La temperatura aplicada', 'El nombre de las semillas', 'La hipótesis escrita'], why: 'La variable dependiente es el resultado que se mide.' },
    { prompt: '¿Qué diseño constituye una prueba más justa del efecto del agua en una planta?', answer: 'Usar plantas similares y variar solo la cantidad de agua', distractors: ['Cambiar agua, luz y especie a la vez', 'Usar una planta distinta en cada grupo', 'Regar solo cuando parezca necesario sin medir'], why: 'Una prueba justa modifica una variable principal y controla las demás.' },
    { prompt: 'Para estudiar el efecto del ejercicio sobre el pulso, ¿cuál es la variable independiente?', answer: 'La cantidad o intensidad de ejercicio realizado', distractors: ['La frecuencia cardiaca medida después', 'La conclusión del informe', 'El número de la página'], why: 'La variable independiente es la condición que el investigador modifica.' },
    { prompt: 'Dos grupos prueban detergentes distintos, pero uno usa agua caliente y otro fría. ¿Cuál es el problema?', answer: 'Hay más de una variable cambiando y no se puede atribuir el resultado solo al detergente', distractors: ['No hay ningún problema', 'Falta una opinión personal', 'Se necesitan detergentes del mismo color'], why: 'Cambiar varias condiciones a la vez introduce variables de confusión.' },
    { prompt: '¿Para qué sirve un grupo de control en un experimento?', answer: 'Para disponer de una referencia con la que comparar el efecto del tratamiento', distractors: ['Para garantizar que la hipótesis sea cierta', 'Para eliminar la necesidad de medir', 'Para cambiar más variables'], why: 'El control ayuda a interpretar qué cambio se debe al tratamiento.' },
    { prompt: 'Quieres saber si la sal cambia el punto de congelación del agua. ¿Qué condición debería ser igual en todos los recipientes?', answer: 'El volumen de agua y el recipiente, salvo la cantidad de sal', distractors: ['La cantidad de sal', 'La temperatura de congelación obtenida', 'El resultado esperado'], why: 'Mantener constantes las condiciones evita confundir el efecto de la sal.' },
  ],
  B01S03: [
    { prompt: 'Tres plantas con abono crecen 12, 11 y 13 cm; tres sin abono, 5, 6 y 5 cm. ¿Qué apoyan estos datos?', answer: 'En estas condiciones, el grupo con abono creció más', distractors: ['El abono siempre duplica cualquier planta', 'No existe diferencia alguna', 'Todas las plantas crecerán 13 cm'], why: 'La conclusión debe limitarse a lo que muestran los datos observados.' },
    { prompt: 'En cinco ensayos, una reacción tarda 20, 21, 19, 20 y 60 s. ¿Qué conviene hacer antes de concluir?', answer: 'Revisar el valor de 60 s y comprobar si hubo un error o condición distinta', distractors: ['Borrar el dato sin mirarlo', 'Usar solo el valor más rápido', 'Concluir que siempre tarda 60 s'], why: 'Un dato atípico debe investigarse, no ignorarse automáticamente.' },
    { prompt: 'Un gráfico muestra que al aumentar la temperatura de 10 a 30 °C aumenta la velocidad de una reacción. ¿Qué conclusión es válida?', answer: 'Dentro del rango estudiado, la reacción fue más rápida a temperaturas mayores', distractors: ['A cualquier temperatura seguirá aumentando para siempre', 'La temperatura no tuvo efecto', 'Todas las reacciones se comportan igual'], why: 'La evidencia permite concluir solo dentro de las condiciones estudiadas.' },
    { prompt: 'Dos grupos obtienen medias de 8,2 cm y 8,4 cm, pero las medidas varían mucho entre plantas. ¿Qué interpretación es más prudente?', answer: 'La diferencia entre medias es pequeña y hace falta más evidencia para asegurar un efecto', distractors: ['El segundo tratamiento funciona con total certeza', 'La variación no importa nunca', 'El primer grupo es siempre mejor'], why: 'La variabilidad y el tamaño de la diferencia condicionan la fuerza de la conclusión.' },
    { prompt: 'Si repites un experimento tres veces y obtienes resultados parecidos, ¿qué aumenta?', answer: 'La confianza en que el patrón observado es reproducible', distractors: ['La certeza absoluta', 'La necesidad de eliminar datos', 'La cantidad de variables independientes'], why: 'La repetición consistente mejora la fiabilidad de la evidencia.' },
    { prompt: 'Una tabla contiene medidas de temperatura cada minuto. ¿Qué representación ayuda mejor a ver una tendencia temporal?', answer: 'Un gráfico de líneas con tiempo en el eje horizontal', distractors: ['Una lista sin ordenar', 'Un dibujo decorativo', 'Solo el valor máximo'], why: 'Un gráfico de líneas permite visualizar cambios continuos en el tiempo.' },
    { prompt: 'Un experimento apoya una hipótesis en una muestra de 4 plantas. ¿Qué afirmación es científicamente adecuada?', answer: 'Los resultados apoyan la hipótesis en esas condiciones, pero conviene repetir con más muestras', distractors: ['La hipótesis queda demostrada para siempre', 'Ya no hace falta repetir', 'El resultado sirve para cualquier especie'], why: 'La evidencia limitada debe interpretarse con cautela y replicarse.' },
    { prompt: 'En una investigación, 9 de 10 mediciones siguen un patrón y una no. ¿Qué es lo correcto?', answer: 'Comprobar la medición discordante y documentar si existe una explicación', distractors: ['Ocultarla para que el gráfico quede mejor', 'Cambiarla por la media', 'Ignorar todas las demás'], why: 'La ciencia exige tratar los datos discrepantes de forma transparente.' },
  ],
  B01S04: [
    { prompt: '¿Qué fuente ofrece mejor respaldo para una afirmación científica?', answer: 'Un estudio revisado con método y datos descritos', distractors: ['Un rumor sin fuente', 'Un anuncio sin evidencias', 'Una opinión anónima'], why: 'La evidencia científica debe ser trazable y evaluable.' },
    { prompt: 'Dos páginas web hacen afirmaciones opuestas sobre nutrición. ¿Qué criterio ayuda más a decidir cuál es fiable?', answer: 'Comprobar autores, fuentes citadas, fecha y calidad de la evidencia', distractors: ['Elegir la que tenga más colores', 'Escoger la más breve', 'Confiar en la que aparece primero'], why: 'La fiabilidad depende de trazabilidad, evidencia y contexto, no del diseño visual.' },
    { prompt: '¿Qué señal hace sospechar de una noticia científica?', answer: 'Promete un resultado absoluto pero no enlaza estudio, datos ni autores', distractors: ['Describe el método usado', 'Distingue correlación y causalidad', 'Reconoce limitaciones'], why: 'Las afirmaciones extraordinarias sin evidencia verificable requieren cautela.' },
    { prompt: 'Un vídeo afirma que un producto “cura cualquier enfermedad”. ¿Cuál es la mejor respuesta?', answer: 'Buscar evidencia clínica fiable y fuentes sanitarias antes de aceptar la afirmación', distractors: ['Compartirlo porque tiene muchas visitas', 'Creerlo si lo dice con seguridad', 'Aceptar que los comentarios sustituyen a los estudios'], why: 'Popularidad y seguridad al hablar no sustituyen evidencia científica.' },
    { prompt: '¿Por qué es importante conocer la fecha de una fuente científica?', answer: 'Porque el conocimiento y las recomendaciones pueden actualizarse con nueva evidencia', distractors: ['Porque las fuentes antiguas son siempre falsas', 'Porque solo importa el día de la semana', 'Porque una fecha reciente garantiza que todo sea correcto'], why: 'La actualidad es un criterio relevante, aunque no suficiente por sí solo.' },
    { prompt: '¿Qué diferencia principal hay entre un artículo científico y una opinión personal?', answer: 'El artículo científico presenta métodos, datos y referencias que pueden evaluarse', distractors: ['La opinión siempre tiene más datos', 'El artículo no necesita autores', 'No existe ninguna diferencia'], why: 'La ciencia comunica procedimientos y evidencias revisables.' },
    { prompt: 'Una gráfica viral no indica de dónde salen sus datos. ¿Qué deberías hacer?', answer: 'Buscar la fuente original y comprobar cómo se recogieron los datos', distractors: ['Dar por cierta la gráfica', 'Mirar solo el color de las barras', 'Compartirla antes de verificarla'], why: 'Sin procedencia no se puede evaluar la calidad de los datos.' },
    { prompt: 'Una fuente cita correctamente un estudio, pero el estudio se hizo solo con 12 personas. ¿Qué debes valorar?', answer: 'Que el tamaño y características de la muestra limitan cuánto se puede generalizar', distractors: ['Que citar un estudio elimina cualquier limitación', 'Que 12 personas representan siempre a toda la población', 'Que el tamaño de muestra no importa'], why: 'La calidad de una fuente también depende de las limitaciones de la evidencia que cita.' },
  ],
}

function hash(seed: number, value: string) {
  let h = (seed ^ 0x9e3779b9) >>> 0
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

function rotate<T>(items: T[], shift: number) {
  const n = ((shift % items.length) + items.length) % items.length
  return items.slice(n).concat(items.slice(0, n))
}

export function generateScienceInvestigationQuestion(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  const cards = BANK[skill.id]
  if (!cards?.length) return null
  const card = cards[hash(seed + Math.max(1, difficulty), skill.id) % cards.length]
  const options = [card.answer, ...card.distractors]
  const rotated = rotate(options, seed + difficulty)
  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: card.prompt,
    options: rotated,
    answerIndex: rotated.indexOf(card.answer),
    solution: card.why,
    tags: [skill.generator_key, 'biology_geology', 'science_investigation_variety'],
  }
}

export function scienceInvestigationCardCounts() {
  return Object.fromEntries(Object.entries(BANK).map(([skillId, cards]) => [skillId, cards.length]))
}
