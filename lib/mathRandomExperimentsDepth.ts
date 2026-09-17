import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }

type Item = {
  prompt: string
  answer: string
  distractors: [string, string, string]
  solution: string
}

function rotate<T>(items: T[], shift: number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

function finish(skill: SkillMeta, difficulty: number, seed: number, item: Item): GeneratedQuestion {
  const raw = [item.answer, ...item.distractors]
  if (new Set(raw).size !== 4) throw new Error(`Duplicate M15S01 options for seed ${seed}: ${JSON.stringify(raw)}`)
  const options = rotate(raw, seed + difficulty)
  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: item.prompt,
    options,
    answerIndex: options.indexOf(item.answer),
    solution: item.solution,
    tags: [skill.generator_key, 'math', 'random_experiments_depth'],
  }
}

function randomExperiment(seed: number): Item {
  const family = (seed >>> 1) % 20
  const sides = [6, 8, 10, 12][(seed >>> 5) % 4]
  const draws = 2 + ((seed >>> 8) % 5)
  const students = 20 + 5 * ((seed >>> 11) % 7)
  const day = 1 + ((seed >>> 14) % 28)
  const spinner = [6, 8, 10, 12][(seed >>> 17) % 4]
  const red = 1 + ((seed >>> 20) % Math.max(2, spinner - 2))

  if (family === 0) return {
    prompt: `Se lanza un dado de ${sides} caras y se anota el número obtenido. ¿Por qué es un experimento aleatorio?`,
    answer: 'Porque se conocen los resultados posibles pero no cuál ocurrirá antes de realizarlo',
    distractors: ['Porque siempre sale el mismo número', 'Porque no existe ningún resultado posible', 'Porque el resultado puede elegirse después de lanzarlo'],
    solution: 'Un experimento aleatorio tiene resultados posibles conocidos, pero el resultado concreto no puede predecirse con certeza.',
  }
  if (family === 1) return {
    prompt: `Se consulta el número de estudiantes de una clase de ${students} alumnos contando la lista oficial. ¿Es un experimento aleatorio?`,
    answer: 'No, el resultado queda determinado por la lista',
    distractors: ['Sí, porque intervienen números', 'Sí, porque siempre hay más de un alumno', 'No, porque los experimentos aleatorios solo usan dados'],
    solution: 'Contar un dato ya fijado no introduce incertidumbre sobre el resultado.',
  }
  if (family === 2) return {
    prompt: `Se gira una ruleta de ${spinner} sectores iguales. ¿Cuál es el espacio muestral si los sectores están numerados del 1 al ${spinner}?`,
    answer: `{1, 2, ..., ${spinner}}`,
    distractors: [`{${spinner}}`, '{girar}', 'No puede definirse'],
    solution: 'El espacio muestral contiene todos los resultados posibles del experimento.',
  }
  if (family === 3) return {
    prompt: `Se lanza una moneda ${draws} veces. ¿Qué se mantiene igual en cada repetición ideal del experimento?`,
    answer: 'Las condiciones del experimento',
    distractors: ['El resultado concreto', 'La secuencia completa de resultados', 'El número de caras obtenidas'],
    solution: 'Para comparar repeticiones se supone que las condiciones se mantienen, aunque los resultados puedan cambiar.',
  }
  if (family === 4) return {
    prompt: `Una máquina elige al azar un número entero del 1 al ${sides}. Antes de ejecutarla, ¿qué puede afirmarse con certeza?`,
    answer: `El resultado pertenecerá al conjunto {1, ..., ${sides}}`,
    distractors: ['Saldrá necesariamente 1', `Saldrá necesariamente ${sides}`, 'No existe ningún resultado posible'],
    solution: 'No se conoce el resultado concreto, pero sí el conjunto de resultados posibles.',
  }
  if (family === 5) return {
    prompt: `Se extrae una bola de una bolsa, se devuelve y se repite el proceso ${draws} veces. ¿Qué aporta devolver la bola antes de repetir?`,
    answer: 'Ayuda a mantener las mismas condiciones entre repeticiones',
    distractors: ['Hace que siempre salga el mismo color', 'Elimina toda incertidumbre', 'Convierte el experimento en determinista'],
    solution: 'Reponer la bola restaura la composición inicial de la bolsa.',
  }
  if (family === 6) return {
    prompt: `Se registra la temperatura exterior a las 12:00 del día ${day} de un mes futuro. ¿Por qué puede tratarse como resultado incierto?`,
    answer: 'Porque antes de medirla no se conoce con certeza su valor exacto',
    distractors: ['Porque toda temperatura es aleatoria por definición', 'Porque no puede medirse', 'Porque el día del mes determina exactamente la temperatura'],
    solution: 'La incertidumbre previa a la observación distingue este caso de un dato ya fijado.',
  }
  if (family === 7) return {
    prompt: '¿Cuál de estas situaciones es determinista?',
    answer: 'Calcular 7×8 con las reglas habituales de aritmética',
    distractors: ['Lanzar una moneda', 'Extraer una carta al azar', 'Girar una ruleta equilibrada'],
    solution: 'Un procedimiento determinista produce el mismo resultado dadas las mismas condiciones.',
  }
  if (family === 8) return {
    prompt: `En una ruleta con ${spinner} sectores iguales, ${red} son rojos. Antes de girarla una vez, ¿qué se sabe?`,
    answer: 'Se conocen los posibles colores, pero no el resultado concreto',
    distractors: ['Se sabe con certeza que saldrá rojo', 'No se conoce ningún resultado posible', 'El resultado deja de ser aleatorio porque hay sectores iguales'],
    solution: 'En un experimento aleatorio conocemos las posibilidades, no la realización concreta.',
  }
  if (family === 9) return {
    prompt: `Un programa genera al azar uno de ${sides} iconos. Si se ejecuta dos veces en las mismas condiciones, ¿debe dar el mismo icono?`,
    answer: 'No, puede producir resultados distintos',
    distractors: ['Sí, necesariamente', 'Sí, salvo que el programa esté mal hecho', 'No puede ejecutarse dos veces'],
    solution: 'Repetir un experimento aleatorio no obliga a repetir el resultado.',
  }
  if (family === 10) return {
    prompt: '¿Qué condición es esencial para hablar de espacio muestral?',
    answer: 'Definir claramente cuáles son todos los resultados posibles',
    distractors: ['Conocer de antemano cuál ocurrirá', 'Tener exactamente dos resultados', 'Usar siempre números'],
    solution: 'El espacio muestral es el conjunto de todos los resultados posibles.',
  }
  if (family === 11) return {
    prompt: `Se elige al azar un estudiante de una clase de ${students}. ¿Cuál es un resultado elemental del experimento?`,
    answer: 'Seleccionar a un estudiante concreto',
    distractors: ['Seleccionar a todos los estudiantes', 'No seleccionar a nadie y terminar el experimento', 'El número total de estudiantes de la clase'],
    solution: 'Un resultado elemental describe una única realización posible del experimento.',
  }
  if (family === 12) return {
    prompt: `Un dado de ${sides} caras se lanza 100 veces. ¿Que aparezcan varias veces resultados distintos contradice que el experimento sea repetible?`,
    answer: 'No, repetible significa que puede realizarse de nuevo bajo condiciones comparables',
    distractors: ['Sí, repetir exige obtener siempre lo mismo', 'Sí, porque un dado solo puede lanzarse una vez', 'No, porque los resultados no importan nunca'],
    solution: 'Repetibilidad se refiere al procedimiento, no a que el resultado sea idéntico.',
  }
  if (family === 13) return {
    prompt: '¿Qué distingue mejor un experimento aleatorio de uno determinista?',
    answer: 'En el aleatorio no puede saberse con certeza el resultado concreto antes de realizarlo',
    distractors: ['El aleatorio carece de resultados posibles', 'El determinista usa siempre números', 'El aleatorio no puede repetirse'],
    solution: 'La diferencia central es la incertidumbre previa sobre el resultado concreto.',
  }
  if (family === 14) return {
    prompt: `Se escoge una tarjeta numerada del 1 al ${sides}. Si antes de elegir ya sabemos cuál tarjeta está marcada para salir, ¿sigue siendo aleatorio para quien conoce esa información?`,
    answer: 'No, para esa persona el resultado ya está determinado',
    distractors: ['Sí, porque hay varias tarjetas', 'Sí, porque los números siempre implican azar', 'No, porque las tarjetas no pueden formar experimentos'],
    solution: 'Si el resultado está fijado y conocido de antemano, desaparece la incertidumbre para ese observador.',
  }
  if (family === 15) return {
    prompt: `Se lanza una moneda ${draws} veces. ¿Qué describe mejor una realización del experimento completo?`,
    answer: `Una secuencia concreta de ${draws} caras o cruces`,
    distractors: ['Solo el número total de lanzamientos posibles', 'La regla de lanzar una moneda', 'El nombre del experimento'],
    solution: 'Una realización completa especifica qué resultado ocurrió en cada repetición.',
  }
  if (family === 16) return {
    prompt: '¿Por qué “elegir al azar” necesita un procedimiento bien definido?',
    answer: 'Para saber qué resultados son posibles y cómo se realiza la selección',
    distractors: ['Para garantizar siempre el mismo resultado', 'Para eliminar todos los resultados posibles', 'Porque azar significa elegir sin reglas de ningún tipo'],
    solution: 'El azar no elimina la necesidad de definir el experimento y su conjunto de resultados.',
  }
  if (family === 17) return {
    prompt: `Se extrae una bola, no se devuelve y se vuelve a extraer. ¿Por qué la segunda extracción no está exactamente en las mismas condiciones que la primera?`,
    answer: 'Porque ha cambiado la composición de la bolsa',
    distractors: ['Porque la segunda extracción deja de ser aleatoria', 'Porque siempre saldrá el mismo color', 'Porque una bolsa no puede usarse dos veces'],
    solution: 'Sin reposición, el primer resultado modifica el conjunto disponible para la segunda extracción.',
  }
  if (family === 18) return {
    prompt: `Una ruleta tiene ${spinner} sectores, pero algunos son más grandes que otros. ¿Sigue siendo un experimento aleatorio al girarla?`,
    answer: 'Sí, aunque los resultados no sean equiprobables',
    distractors: ['No, solo hay azar si todos los resultados son equiprobables', 'No, porque una ruleta debe tener exactamente 6 sectores', 'Sí, y todos los sectores tienen necesariamente la misma probabilidad'],
    solution: 'Aleatoriedad no exige equiprobabilidad; solo incertidumbre sobre qué resultado ocurrirá.',
  }
  return {
    prompt: `En un experimento con resultados posibles numerados del 1 al ${sides}, se repite el procedimiento muchas veces. ¿Qué afirmación es correcta?`,
    answer: 'Cada repetición produce un resultado posible del mismo experimento, aunque pueda variar',
    distractors: ['Todas las repeticiones deben coincidir', 'Después de la primera repetición deja de haber azar', 'Los resultados posibles cambian obligatoriamente en cada intento'],
    solution: 'Repetir un experimento aleatorio conserva el procedimiento y permite resultados distintos entre realizaciones.',
  }
}

export function generateMathRandomExperimentsDepth(
  skill: SkillMeta,
  difficulty: number,
  seed: number,
): GeneratedQuestion | null {
  if (skill.id !== 'M15S01') return null
  const normalized = seed >>> 0
  if ((normalized & 1) === 1) return null
  return finish(skill, difficulty, normalized, randomExperiment(normalized))
}
