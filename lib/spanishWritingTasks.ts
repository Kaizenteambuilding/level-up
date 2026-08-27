export type WritingCriterion =
  | { code: string; label: string; type: 'min_words'; value: number }
  | { code: string; label: string; type: 'min_sentences'; value: number }
  | { code: string; label: string; type: 'contains_all'; values: string[] }
  | { code: string; label: string; type: 'contains_any'; values: string[]; count?: number }
  | { code: string; label: string; type: 'punctuation'; values: string[] }
  | { code: string; label: string; type: 'starts_uppercase' }
  | { code: string; label: string; type: 'forbid'; values: string[] }

export type SpanishWritingTask = {
  id: string
  skillId: string
  title: string
  prompt: string
  hint: string
  criteria: WritingCriterion[]
}

export type WritingEvaluation = {
  ok: boolean
  met: number
  total: number
  wordCount: number
  sentenceCount: number
  checks: Array<{ code: string; label: string; met: boolean }>
}

const TASKS: Record<string, SpanishWritingTask[]> = {
  L04S01: [
    { id: 'accent-1', skillId: 'L04S01', title: 'Tildes en contexto', prompt: 'Escribe dos oraciones sobre una excursión. Usa correctamente las palabras “también” y “después”.', hint: 'Comprueba las tildes antes de entregar.', criteria: [{ code: 'words', label: 'Al menos 12 palabras', type: 'min_words', value: 12 }, { code: 'sentences', label: 'Al menos 2 oraciones', type: 'min_sentences', value: 2 }, { code: 'targets', label: 'Incluye “también” y “después”', type: 'contains_all', values: ['también', 'después'] }, { code: 'wrong_accents', label: 'Evita las formas sin tilde', type: 'forbid', values: ['tambien', 'despues'] }] },
    { id: 'accent-2', skillId: 'L04S01', title: 'Palabras agudas', prompt: 'Cuenta brevemente qué ocurrió en una competición. Incluye “ganó” y “campeón”.', hint: 'Las dos palabras objetivo llevan tilde.', criteria: [{ code: 'words', label: 'Al menos 12 palabras', type: 'min_words', value: 12 }, { code: 'targets', label: 'Incluye “ganó” y “campeón”', type: 'contains_all', values: ['ganó', 'campeón'] }, { code: 'wrong_accents', label: 'Evita las formas sin tilde', type: 'forbid', values: ['gano ', 'campeon'] }, { code: 'period', label: 'Cierra con punto', type: 'punctuation', values: ['.'] }] },
    { id: 'accent-3', skillId: 'L04S01', title: 'Esdrújulas', prompt: 'Describe una clase divertida usando las palabras “música” y “rápido”.', hint: 'Las esdrújulas siempre llevan tilde.', criteria: [{ code: 'words', label: 'Al menos 12 palabras', type: 'min_words', value: 12 }, { code: 'targets', label: 'Incluye “música” y “rápido”', type: 'contains_all', values: ['música', 'rápido'] }, { code: 'wrong_accents', label: 'Evita las formas sin tilde', type: 'forbid', values: ['musica', 'rapido'] }, { code: 'uppercase', label: 'Empieza con mayúscula', type: 'starts_uppercase' }] },
    { id: 'accent-4', skillId: 'L04S01', title: 'Interrogativos', prompt: 'Escribe una pregunta y su respuesta sobre un viaje. Usa “qué” o “cómo” con tilde en la pregunta.', hint: 'Los interrogativos directos llevan tilde.', criteria: [{ code: 'words', label: 'Al menos 12 palabras', type: 'min_words', value: 12 }, { code: 'question', label: 'Incluye signos de interrogación', type: 'punctuation', values: ['¿', '?'] }, { code: 'target', label: 'Usa “qué” o “cómo”', type: 'contains_any', values: ['qué', 'cómo'] }, { code: 'sentences', label: 'Incluye pregunta y respuesta', type: 'min_sentences', value: 2 }] },
  ],
  L04S02: [
    { id: 'letters-1', skillId: 'L04S02', title: 'B y V', prompt: 'Escribe una oración sobre unas vacaciones usando “viaje” y “había”.', hint: 'Fíjate en la v de viaje y la h+b de había.', criteria: [{ code: 'words', label: 'Al menos 10 palabras', type: 'min_words', value: 10 }, { code: 'targets', label: 'Incluye “viaje” y “había”', type: 'contains_all', values: ['viaje', 'había'] }, { code: 'wrong', label: 'Evita grafías incorrectas', type: 'forbid', values: ['biaje', 'avía', 'abía'] }, { code: 'period', label: 'Cierra con punto', type: 'punctuation', values: ['.'] }] },
    { id: 'letters-2', skillId: 'L04S02', title: 'G y J', prompt: 'Describe una escena en el colegio usando “gimnasio” y “jugar”.', hint: 'Comprueba la letra inicial de cada palabra objetivo.', criteria: [{ code: 'words', label: 'Al menos 10 palabras', type: 'min_words', value: 10 }, { code: 'targets', label: 'Incluye “gimnasio” y “jugar”', type: 'contains_all', values: ['gimnasio', 'jugar'] }, { code: 'wrong', label: 'Evita grafías incorrectas', type: 'forbid', values: ['jimnasio', 'gugar'] }, { code: 'uppercase', label: 'Empieza con mayúscula', type: 'starts_uppercase' }] },
    { id: 'letters-3', skillId: 'L04S02', title: 'Uso de H', prompt: 'Cuenta algo que hiciste hoy usando “he” y “hecho”.', hint: 'Ambas formas llevan h.', criteria: [{ code: 'words', label: 'Al menos 10 palabras', type: 'min_words', value: 10 }, { code: 'targets', label: 'Incluye “he” y “hecho”', type: 'contains_all', values: ['he ', 'hecho'] }, { code: 'wrong', label: 'Evita “echo” cuando quieres decir “hecho”', type: 'forbid', values: [' e echo ', ' e hecho'] }, { code: 'period', label: 'Cierra con punto', type: 'punctuation', values: ['.'] }] },
    { id: 'letters-4', skillId: 'L04S02', title: 'Ortografía combinada', prompt: 'Escribe dos oraciones que incluyan “buscar”, “ventana” y “hoja”.', hint: 'Tres palabras, tres decisiones ortográficas.', criteria: [{ code: 'words', label: 'Al menos 14 palabras', type: 'min_words', value: 14 }, { code: 'sentences', label: 'Al menos 2 oraciones', type: 'min_sentences', value: 2 }, { code: 'targets', label: 'Incluye las tres palabras', type: 'contains_all', values: ['buscar', 'ventana', 'hoja'] }, { code: 'wrong', label: 'Evita grafías incorrectas', type: 'forbid', values: ['vuscar', 'bentana', 'oja '] }] },
  ],
  L04S03: [
    { id: 'punct-1', skillId: 'L04S03', title: 'Coma y punto', prompt: 'Describe tu mochila enumerando al menos tres objetos. Usa una coma y termina con punto.', hint: 'Separa elementos de la enumeración con comas.', criteria: [{ code: 'words', label: 'Al menos 12 palabras', type: 'min_words', value: 12 }, { code: 'punct', label: 'Usa coma y punto', type: 'punctuation', values: [',', '.'] }, { code: 'uppercase', label: 'Empieza con mayúscula', type: 'starts_uppercase' }] },
    { id: 'punct-2', skillId: 'L04S03', title: 'Dos puntos', prompt: 'Presenta una lista de tres cosas que necesitas para una excursión. Introduce la lista con dos puntos.', hint: 'Los dos puntos anuncian la enumeración.', criteria: [{ code: 'words', label: 'Al menos 10 palabras', type: 'min_words', value: 10 }, { code: 'colon', label: 'Usa dos puntos', type: 'punctuation', values: [':'] }, { code: 'comma', label: 'Usa al menos una coma', type: 'punctuation', values: [','] }, { code: 'uppercase', label: 'Empieza con mayúscula', type: 'starts_uppercase' }] },
    { id: 'punct-3', skillId: 'L04S03', title: 'Pregunta completa', prompt: 'Escribe una pregunta para entrevistar a una científica y añade una frase explicando por qué la haces.', hint: 'Abre y cierra correctamente la interrogación.', criteria: [{ code: 'words', label: 'Al menos 14 palabras', type: 'min_words', value: 14 }, { code: 'question', label: 'Usa ¿ y ?', type: 'punctuation', values: ['¿', '?'] }, { code: 'sentences', label: 'Incluye al menos 2 oraciones', type: 'min_sentences', value: 2 }] },
    { id: 'punct-4', skillId: 'L04S03', title: 'Exclamación expresiva', prompt: 'Cuenta un momento sorprendente. Incluye una exclamación y otra oración que explique lo ocurrido.', hint: 'Usa ¡...! para la exclamación.', criteria: [{ code: 'words', label: 'Al menos 14 palabras', type: 'min_words', value: 14 }, { code: 'exclamation', label: 'Usa ¡ y !', type: 'punctuation', values: ['¡', '!'] }, { code: 'sentences', label: 'Incluye al menos 2 oraciones', type: 'min_sentences', value: 2 }, { code: 'uppercase', label: 'Empieza con mayúscula', type: 'starts_uppercase' }] },
  ],
  L04S04: [
    { id: 'edit-1', skillId: 'L04S04', title: 'Reescritura ortográfica', prompt: 'Reescribe correctamente esta idea con una frase completa: “ayer fuimos de biaje y avia mucha jente”.', hint: 'Corrige viaje, había, gente y la puntuación.', criteria: [{ code: 'targets', label: 'Corrige viaje, había y gente', type: 'contains_all', values: ['viaje', 'había', 'gente'] }, { code: 'wrong', label: 'Elimina las grafías incorrectas', type: 'forbid', values: ['biaje', 'avia', 'jente'] }, { code: 'uppercase', label: 'Empieza con mayúscula', type: 'starts_uppercase' }, { code: 'period', label: 'Termina con punto', type: 'punctuation', values: ['.'] }] },
    { id: 'edit-2', skillId: 'L04S04', title: 'Texto corregido', prompt: 'Corrige y mejora: “mi ermano a echo un dibujo increible”.', hint: 'Revisa h, auxiliar, participio y tilde.', criteria: [{ code: 'targets', label: 'Incluye “hermano”, “ha hecho” e “increíble”', type: 'contains_all', values: ['hermano', 'ha hecho', 'increíble'] }, { code: 'wrong', label: 'Elimina las formas incorrectas', type: 'forbid', values: ['ermano', 'a echo', 'increible'] }, { code: 'uppercase', label: 'Empieza con mayúscula', type: 'starts_uppercase' }, { code: 'period', label: 'Termina con punto', type: 'punctuation', values: ['.'] }] },
    { id: 'edit-3', skillId: 'L04S04', title: 'Puntuación al revisar', prompt: 'Reescribe con puntuación clara: “cuando llegamos al parque vimos patos ardillas y peces después merendamos”.', hint: 'Separa la enumeración y las dos acciones.', criteria: [{ code: 'comma', label: 'Usa comas', type: 'punctuation', values: [','] }, { code: 'sentences', label: 'Organiza el texto en al menos 2 oraciones', type: 'min_sentences', value: 2 }, { code: 'uppercase', label: 'Empieza con mayúscula', type: 'starts_uppercase' }] },
    { id: 'edit-4', skillId: 'L04S04', title: 'Revisión completa', prompt: 'Corrige: “el sabado jugemos al futbol y despues vimos una pelicula”.', hint: 'Revisa tildes, verbo, mayúscula y punto final.', criteria: [{ code: 'targets', label: 'Incluye “sábado”, “jugamos”, “fútbol”, “después” y “película”', type: 'contains_all', values: ['sábado', 'jugamos', 'fútbol', 'después', 'película'] }, { code: 'wrong', label: 'Elimina las formas incorrectas', type: 'forbid', values: ['sabado', 'jugemos', 'futbol', 'despues', 'pelicula'] }, { code: 'uppercase', label: 'Empieza con mayúscula', type: 'starts_uppercase' }, { code: 'period', label: 'Termina con punto', type: 'punctuation', values: ['.'] }] },
  ],
  L05S01: [
    { id: 'narrative-1', skillId: 'L05S01', title: 'Microrelato', prompt: 'Escribe un microrelato sobre una puerta que aparece donde ayer no había nada. Usa “primero”, “después” y “al final”.', hint: 'Organiza inicio, desarrollo y cierre.', criteria: [{ code: 'words', label: 'Al menos 35 palabras', type: 'min_words', value: 35 }, { code: 'sequence', label: 'Usa los tres conectores', type: 'contains_all', values: ['primero', 'después', 'al final'] }, { code: 'sentences', label: 'Al menos 3 oraciones', type: 'min_sentences', value: 3 }, { code: 'uppercase', label: 'Empieza con mayúscula', type: 'starts_uppercase' }] },
    { id: 'narrative-2', skillId: 'L05S01', title: 'Aventura breve', prompt: 'Narra una aventura que empieza al perder un mapa. Incluye “de repente” y “finalmente”.', hint: 'Haz que ocurra algo y que el conflicto termine.', criteria: [{ code: 'words', label: 'Al menos 35 palabras', type: 'min_words', value: 35 }, { code: 'connectors', label: 'Usa “de repente” y “finalmente”', type: 'contains_all', values: ['de repente', 'finalmente'] }, { code: 'sentences', label: 'Al menos 3 oraciones', type: 'min_sentences', value: 3 }] },
    { id: 'narrative-3', skillId: 'L05S01', title: 'Cambio inesperado', prompt: 'Cuenta una historia corta sobre un día normal que cambia por una noticia inesperada. Usa “entonces” y “por fin”.', hint: 'Presenta situación, cambio y desenlace.', criteria: [{ code: 'words', label: 'Al menos 35 palabras', type: 'min_words', value: 35 }, { code: 'connectors', label: 'Usa “entonces” y “por fin”', type: 'contains_all', values: ['entonces', 'por fin'] }, { code: 'sentences', label: 'Al menos 3 oraciones', type: 'min_sentences', value: 3 }] },
    { id: 'narrative-4', skillId: 'L05S01', title: 'Narración con problema', prompt: 'Narra cómo un grupo resuelve un problema durante una excursión. Incluye “sin embargo” y “por eso”.', hint: 'El problema debe tener una consecuencia y una solución.', criteria: [{ code: 'words', label: 'Al menos 38 palabras', type: 'min_words', value: 38 }, { code: 'connectors', label: 'Usa “sin embargo” y “por eso”', type: 'contains_all', values: ['sin embargo', 'por eso'] }, { code: 'sentences', label: 'Al menos 3 oraciones', type: 'min_sentences', value: 3 }] },
  ],
  L05S02: [
    { id: 'description-1', skillId: 'L05S02', title: 'Lugar misterioso', prompt: 'Describe un lugar misterioso. Incluye al menos dos de estas palabras: “oscuro”, “silencioso”, “estrecho”, “brillante”.', hint: 'Combina rasgos visuales y sensaciones.', criteria: [{ code: 'words', label: 'Al menos 30 palabras', type: 'min_words', value: 30 }, { code: 'adjectives', label: 'Usa al menos 2 adjetivos propuestos', type: 'contains_any', values: ['oscuro', 'silencioso', 'estrecho', 'brillante'], count: 2 }, { code: 'sentences', label: 'Al menos 3 oraciones', type: 'min_sentences', value: 3 }] },
    { id: 'description-2', skillId: 'L05S02', title: 'Personaje', prompt: 'Describe un personaje inventado. Incluye al menos dos de estas palabras: “curioso”, “paciente”, “valiente”, “despistado”.', hint: 'Mezcla aspecto o conducta con personalidad.', criteria: [{ code: 'words', label: 'Al menos 30 palabras', type: 'min_words', value: 30 }, { code: 'adjectives', label: 'Usa al menos 2 adjetivos propuestos', type: 'contains_any', values: ['curioso', 'paciente', 'valiente', 'despistado'], count: 2 }, { code: 'sentences', label: 'Al menos 3 oraciones', type: 'min_sentences', value: 3 }] },
    { id: 'description-3', skillId: 'L05S02', title: 'Objeto especial', prompt: 'Describe un objeto importante para una aventura. Incluye al menos dos de estas palabras: “antiguo”, “ligero”, “rugoso”, “dorado”.', hint: 'Explica cómo es y para qué podría servir.', criteria: [{ code: 'words', label: 'Al menos 30 palabras', type: 'min_words', value: 30 }, { code: 'adjectives', label: 'Usa al menos 2 adjetivos propuestos', type: 'contains_any', values: ['antiguo', 'ligero', 'rugoso', 'dorado'], count: 2 }, { code: 'sentences', label: 'Al menos 3 oraciones', type: 'min_sentences', value: 3 }] },
    { id: 'description-4', skillId: 'L05S02', title: 'Ambiente', prompt: 'Describe cómo cambia un parque antes y después de una tormenta. Usa “antes” y “después”.', hint: 'Contrasta el ambiente en los dos momentos.', criteria: [{ code: 'words', label: 'Al menos 32 palabras', type: 'min_words', value: 32 }, { code: 'contrast', label: 'Usa “antes” y “después”', type: 'contains_all', values: ['antes', 'después'] }, { code: 'sentences', label: 'Al menos 3 oraciones', type: 'min_sentences', value: 3 }] },
  ],
  L05S03: [
    { id: 'exposition-1', skillId: 'L05S03', title: 'Explicación causal', prompt: 'Explica por qué es importante dormir bien antes de un examen. Usa “porque” y “por eso”.', hint: 'Presenta una causa y su consecuencia.', criteria: [{ code: 'words', label: 'Al menos 35 palabras', type: 'min_words', value: 35 }, { code: 'connectors', label: 'Usa “porque” y “por eso”', type: 'contains_all', values: ['porque', 'por eso'] }, { code: 'sentences', label: 'Al menos 3 oraciones', type: 'min_sentences', value: 3 }] },
    { id: 'exposition-2', skillId: 'L05S03', title: 'Cómo funciona', prompt: 'Explica cómo organizar una mochila para una excursión. Usa “primero” y “además”.', hint: 'Ordena la explicación y añade una idea complementaria.', criteria: [{ code: 'words', label: 'Al menos 35 palabras', type: 'min_words', value: 35 }, { code: 'connectors', label: 'Usa “primero” y “además”', type: 'contains_all', values: ['primero', 'además'] }, { code: 'sentences', label: 'Al menos 3 oraciones', type: 'min_sentences', value: 3 }] },
    { id: 'exposition-3', skillId: 'L05S03', title: 'Idea y ejemplo', prompt: 'Explica una ventaja de trabajar en equipo. Usa “por ejemplo” y “además”.', hint: 'Afirma una idea, explíquela y aporta un ejemplo.', criteria: [{ code: 'words', label: 'Al menos 35 palabras', type: 'min_words', value: 35 }, { code: 'connectors', label: 'Usa “por ejemplo” y “además”', type: 'contains_all', values: ['por ejemplo', 'además'] }, { code: 'sentences', label: 'Al menos 3 oraciones', type: 'min_sentences', value: 3 }] },
    { id: 'exposition-4', skillId: 'L05S03', title: 'Comparación explicada', prompt: 'Explica una diferencia entre estudiar solo y estudiar en grupo. Usa “en cambio” y “por tanto”.', hint: 'Compara y termina con una conclusión.', criteria: [{ code: 'words', label: 'Al menos 38 palabras', type: 'min_words', value: 38 }, { code: 'connectors', label: 'Usa “en cambio” y “por tanto”', type: 'contains_all', values: ['en cambio', 'por tanto'] }, { code: 'sentences', label: 'Al menos 3 oraciones', type: 'min_sentences', value: 3 }] },
  ],
  L05S04: [
    { id: 'revision-1', skillId: 'L05S04', title: 'Plan y revisión', prompt: 'Escribe un párrafo sobre tu lugar ideal para estudiar. Debe tener una idea inicial, un detalle con “además” y una conclusión con “en resumen”.', hint: 'Revisa la estructura completa antes de entregar.', criteria: [{ code: 'words', label: 'Al menos 40 palabras', type: 'min_words', value: 40 }, { code: 'structure', label: 'Incluye “además” y “en resumen”', type: 'contains_all', values: ['además', 'en resumen'] }, { code: 'sentences', label: 'Al menos 4 oraciones', type: 'min_sentences', value: 4 }, { code: 'uppercase', label: 'Empieza con mayúscula', type: 'starts_uppercase' }] },
    { id: 'revision-2', skillId: 'L05S04', title: 'Párrafo organizado', prompt: 'Redacta un párrafo para recomendar un libro, juego o película. Usa “primero” para presentar una razón y “finalmente” para cerrar.', hint: 'Comprueba que cada idea tenga un orden lógico.', criteria: [{ code: 'words', label: 'Al menos 40 palabras', type: 'min_words', value: 40 }, { code: 'structure', label: 'Incluye “primero” y “finalmente”', type: 'contains_all', values: ['primero', 'finalmente'] }, { code: 'sentences', label: 'Al menos 4 oraciones', type: 'min_sentences', value: 4 }] },
    { id: 'revision-3', skillId: 'L05S04', title: 'Revisión de cohesión', prompt: 'Escribe un párrafo sobre una actividad que te gustaría aprender. Usa “porque”, “además” y “por eso”.', hint: 'Después de escribir, comprueba que los conectores unan ideas distintas.', criteria: [{ code: 'words', label: 'Al menos 40 palabras', type: 'min_words', value: 40 }, { code: 'connectors', label: 'Usa los tres conectores', type: 'contains_all', values: ['porque', 'además', 'por eso'] }, { code: 'sentences', label: 'Al menos 4 oraciones', type: 'min_sentences', value: 4 }] },
    { id: 'revision-4', skillId: 'L05S04', title: 'Versión final', prompt: 'Redacta una propuesta para mejorar un espacio del colegio. Usa “actualmente”, “propongo” y “por último”.', hint: 'Presenta la situación, la propuesta y el cierre.', criteria: [{ code: 'words', label: 'Al menos 42 palabras', type: 'min_words', value: 42 }, { code: 'structure', label: 'Incluye las tres marcas de estructura', type: 'contains_all', values: ['actualmente', 'propongo', 'por último'] }, { code: 'sentences', label: 'Al menos 4 oraciones', type: 'min_sentences', value: 4 }] },
  ],
}

function normalized(value: string) {
  return value.toLocaleLowerCase('es-ES').replace(/\s+/g, ' ').trim()
}

function wordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0
}

function sentenceCount(value: string) {
  return value.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean).length
}

function includesNeedle(text: string, needle: string) {
  return text.includes(normalized(needle))
}

export function generateSpanishWritingTask(skillId: string, seed: number): SpanishWritingTask {
  const candidates = TASKS[skillId]
  if (!candidates?.length) throw new Error(`No writing task bank for ${skillId}`)
  const index = Math.abs((seed ^ (skillId.charCodeAt(skillId.length - 1) * 2654435761)) >>> 0) % candidates.length
  return candidates[index]
}

export function evaluateSpanishWriting(task: SpanishWritingTask, response: string, difficulty = 1): WritingEvaluation {
  const text = normalized(response)
  const words = wordCount(response)
  const sentences = sentenceCount(response)
  const extraWords = task.id.startsWith('edit-') ? 0 : Math.max(0, Math.min(8, (difficulty - 1) * 2))
  const checks = task.criteria.map((criterion) => {
    let met = false
    if (criterion.type === 'min_words') met = words >= criterion.value + extraWords
    if (criterion.type === 'min_sentences') met = sentences >= criterion.value
    if (criterion.type === 'contains_all') met = criterion.values.every((value) => includesNeedle(text, value))
    if (criterion.type === 'contains_any') met = criterion.values.filter((value) => includesNeedle(text, value)).length >= (criterion.count ?? 1)
    if (criterion.type === 'punctuation') met = criterion.values.every((value) => response.includes(value))
    if (criterion.type === 'starts_uppercase') met = /^[ÁÉÍÓÚÜÑA-Z]/u.test(response.trim())
    if (criterion.type === 'forbid') met = criterion.values.every((value) => !includesNeedle(` ${text} `, value))
    return { code: criterion.code, label: criterion.label, met }
  })
  const met = checks.filter((check) => check.met).length
  return { ok: met === checks.length, met, total: checks.length, wordCount: words, sentenceCount: sentences, checks }
}

export function spanishWritingSkillIds() {
  return Object.keys(TASKS)
}

export function spanishWritingTaskCount() {
  return Object.values(TASKS).reduce((sum, tasks) => sum + tasks.length, 0)
}
