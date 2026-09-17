import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Item = { prompt: string; answer: string; distractors: [string, string, string]; solution: string }

function rotate<T>(items: T[], shift: number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

function finish(skill: SkillMeta, difficulty: number, seed: number, item: Item): GeneratedQuestion {
  const raw = [item.answer, ...item.distractors]
  if (new Set(raw).size !== 4) throw new Error(`Duplicate M13S03 options for seed ${seed}: ${JSON.stringify(raw)}`)
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
    tags: [skill.generator_key, 'math', 'graph_representation_depth'],
  }
}

const HORIZONTAL = ['día', 'mes', 'hora', 'distancia (km)', 'número de ensayo', 'edad (años)']
const VERTICAL = ['temperatura (°C)', 'ventas', 'altura (cm)', 'tiempo (min)', 'consumo (L)', 'puntuación']
const CATEGORIES = ['A, B, C y D', 'rojo, azul, verde y amarillo', 'fútbol, baloncesto, tenis y natación', 'enero, febrero, marzo y abril']

function graph(seed: number): Item {
  const family = (seed >>> 2) % 22
  const x = HORIZONTAL[(seed >>> 5) % HORIZONTAL.length]
  const y = VERTICAL[(seed >>> 9) % VERTICAL.length]
  const categories = CATEGORIES[(seed >>> 13) % CATEGORIES.length]
  const a = 2 + ((seed >>> 16) % 8)
  const b = a + 1 + ((seed >>> 20) % 5)
  const c = b + 1 + ((seed >>> 24) % 5)
  const scale = [1, 2, 5, 10][(seed >>> 28) % 4]

  if (family === 0) return { prompt:`Una tabla relaciona ${x} con ${y}. Al pasarla a una gráfica cartesiana, ¿qué conviene colocar en el eje horizontal?`, answer:x, distractors:[y,'La suma de todos los valores','La escala vertical'], solution:'La variable independiente o de referencia de la tabla se coloca habitualmente en el eje horizontal.' }
  if (family === 1) return { prompt:`Una tabla relaciona ${x} con ${y}. ¿Qué magnitud debe aparecer en el eje vertical de la gráfica?`, answer:y, distractors:[x,'El título de la tabla','El número de filas'], solution:'La magnitud asociada a cada valor horizontal se representa en el eje vertical.' }
  if (family === 2) return { prompt:`La tabla contiene el par (${a}, ${b}). ¿Qué punto debe marcarse en la gráfica?`, answer:`(${a}, ${b})`, distractors:[`(${b}, ${a})`,`(${a + b}, 0)`,`(0, ${a + b})`], solution:'El primer valor del par es la coordenada horizontal y el segundo la vertical.' }
  if (family === 3) return { prompt:`Para representar el par (${a}, ${c}), un alumno marca (${c}, ${a}). ¿Qué error ha cometido?`, answer:'Ha intercambiado los ejes', distractors:['Ha usado una escala demasiado grande','Ha calculado una media','Ha omitido el título únicamente'], solution:'Cambiar el orden de las coordenadas intercambia la variable horizontal y la vertical.' }
  if (family === 4) return { prompt:`Los datos se registran en ${x} consecutivos y muestran ${y}. ¿Qué representación ayuda a mostrar su evolución?`, answer:'Un gráfico de líneas con los puntos en orden', distractors:['Un diagrama de sectores sin orden','Una lista de valores desordenada','Un único punto sin ejes'], solution:'Cuando interesa la evolución ordenada, una línea conecta los valores respetando la secuencia horizontal.' }
  if (family === 5) return { prompt:`Una tabla contiene frecuencias para las categorías ${categories}. ¿Qué gráfica es adecuada para compararlas?`, answer:'Un gráfico de barras', distractors:['Una recta numérica sin categorías','Un único sector circular','Un diagrama de dispersión sin pares numéricos'], solution:'Las barras permiten representar y comparar valores asociados a categorías distintas.' }
  if (family === 6) return { prompt:`En un gráfico de barras, una categoría tiene valor ${b}. Si cada división vertical vale ${scale}, ¿qué debe respetarse al dibujar su barra?`, answer:`Que alcance el valor ${b} usando la escala indicada`, distractors:[`Que mida siempre ${b * scale} divisiones`,'Que todas las barras tengan la misma altura','Que el eje vertical no muestre unidades'], solution:'La altura debe corresponder al dato según la escala del eje, no al número escrito de forma aislada.' }
  if (family === 7) return { prompt:`Una gráfica usa divisiones de ${scale} en ${scale}. ¿Dónde debe situarse un valor ${scale * a}?`, answer:`En la marca ${scale * a}`, distractors:[`En la marca ${a}`,`En la marca ${scale * a + scale}`,`Entre 0 y ${scale} siempre`], solution:'La escala determina el valor representado por cada marca del eje.' }
  if (family === 8) return { prompt:`Antes de representar una tabla de ${x} y ${y}, ¿qué información debe aparecer para que los ejes sean interpretables?`, answer:'El nombre o magnitud y sus unidades cuando correspondan', distractors:['Solo el color de la línea','Únicamente el número de puntos','La respuesta correcta de la actividad'], solution:'Etiquetar magnitudes y unidades permite saber qué representa cada eje.' }
  if (family === 9) return { prompt:`Una tabla da los puntos (${a}, ${b}) y (${a + 1}, ${c}). ¿Cuántos puntos distintos hay que situar inicialmente?`, answer:'2', distractors:['1','3',String(a + b + c)], solution:'Cada fila o par ordenado de la tabla corresponde a un punto de la representación.' }
  if (family === 10) return { prompt:`Si una tabla tiene ${a} filas de datos, cada una con un par (x, y), ¿cuántos puntos representa?`, answer:String(a), distractors:[String(a * 2),String(a + 1),'1'], solution:'Cada fila con un par ordenado produce un punto en el plano.' }
  if (family === 11) return { prompt:`Los valores verticales de una tabla llegan hasta ${c * 10}. ¿Qué escala es razonable para aprovechar el gráfico sin cambiar los datos?`, answer:'Una escala uniforme que incluya el máximo', distractors:['Cambiar de escala entre dos marcas consecutivas','Omitir los valores altos','Colocar todos los valores a la misma altura'], solution:'La escala debe ser uniforme y abarcar el rango de datos que se quiere representar.' }
  if (family === 12) return { prompt:'¿Por qué las marcas de un eje deben mantener una escala uniforme?', answer:'Para que distancias iguales representen incrementos iguales', distractors:['Para que todos los datos sean iguales','Para evitar escribir unidades','Para convertir categorías en porcentajes'], solution:'Una escala uniforme conserva la correspondencia entre distancia gráfica y diferencia numérica.' }
  if (family === 13) return { prompt:`Una tabla registra ${y} para ${x}. ¿Qué acción debe hacerse antes de unir puntos con una línea?`, answer:'Situar correctamente cada par de datos en los ejes', distractors:['Ordenar siempre los valores verticales de menor a mayor','Sumar todos los valores','Intercambiar las columnas'], solution:'Primero se representan los pares; solo después se unen cuando el contexto justifica mostrar continuidad o evolución.' }
  if (family === 14) return { prompt:'¿Cuándo no conviene unir automáticamente con una línea las barras o puntos de categorías independientes?', answer:'Cuando las categorías no representan una secuencia continua', distractors:['Cuando existen más de dos categorías','Cuando los valores son positivos','Cuando el gráfico tiene título'], solution:'Unir categorías independientes puede sugerir valores intermedios o continuidad que no existen.' }
  if (family === 15) return { prompt:`En una tabla, ${x} toma ${a}, ${a + 1} y ${a + 2}; ${y} toma ${b}, ${c} y ${c + 2}. ¿Qué pares deben representarse?`, answer:`(${a}, ${b}), (${a + 1}, ${c}) y (${a + 2}, ${c + 2})`, distractors:[`(${b}, ${a}), (${c}, ${a + 1}) y (${c + 2}, ${a + 2})`,`(${a}, ${c}), (${a + 1}, ${c + 2}) y (${a + 2}, ${b})`,`(${a + b}, 0), (${a + 1 + c}, 0) y (${a + c + 4}, 0)`], solution:'Cada fila empareja un valor horizontal con el valor vertical de la misma fila.' }
  if (family === 16) return { prompt:'¿Qué diferencia esencial hay entre un gráfico de barras y uno de líneas al representar una tabla?', answer:'Las barras comparan valores; la línea destaca una evolución u orden entre puntos', distractors:['Las barras no pueden tener escala','Las líneas solo admiten un dato','Ambos obligan a intercambiar los ejes'], solution:'La elección depende de si se comparan categorías o se quiere mostrar una secuencia o evolución.' }
  if (family === 17) return { prompt:`Una barra representa valor ${b}, pero llega hasta ${c}. ¿Qué debe corregirse?`, answer:`La altura de la barra para que corresponda a ${b}`, distractors:['El dato de la tabla para que pase a valer el dibujo','Todas las demás barras para que lleguen a la misma altura','El nombre de la categoría únicamente'], solution:'La gráfica debe representar fielmente los datos de la tabla, no modificar los datos para ajustarlos al dibujo.' }
  if (family === 18) return { prompt:`Un punto representa ${x}=${a} y ${y}=${b}. ¿Qué lectura confirma que está bien colocado?`, answer:`Coordenada horizontal ${a} y vertical ${b}`, distractors:[`Horizontal ${b} y vertical ${a}`,`Ambas coordenadas ${a + b}`,`Horizontal 0 y vertical ${a}`], solution:'La posición horizontal corresponde al primer dato y la vertical al segundo.' }
  if (family === 19) return { prompt:'Al pasar una tabla a una gráfica, ¿qué elemento ayuda a identificar rápidamente qué se está representando?', answer:'Un título descriptivo', distractors:['Eliminar las etiquetas de los ejes','Usar escalas distintas sin indicarlo','Ordenar los datos al azar'], solution:'El título aporta contexto, mientras los ejes y sus unidades precisan las variables.' }
  if (family === 20) return { prompt:`Dos valores consecutivos de ${x} tienen ${y}=${b} y ${y}=${c}. ¿Qué debe mostrar una gráfica de líneas?`, answer:`Dos puntos a alturas ${b} y ${c}, unidos en el orden horizontal`, distractors:[`Dos puntos a alturas ${c} y ${b} con los ejes intercambiados`,'Una sola barra con altura igual a la suma','Dos puntos colocados en el mismo lugar'], solution:'Cada dato conserva su coordenada y el orden horizontal permite visualizar el cambio entre ambos.' }
  return { prompt:'¿Cuál es una comprobación útil después de construir una gráfica desde una tabla?', answer:'Verificar que cada fila corresponde al punto o barra correcto y que la escala es coherente', distractors:['Comprobar que todos los valores tengan la misma altura','Eliminar los ceros de los ejes','Intercambiar los ejes para obtener otra figura'], solution:'Revisar correspondencia, ejes y escala detecta errores de transcripción y representación.' }
}

export function generateMathGraphRepresentationDepth(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  if (skill.id !== 'M13S03') return null
  const normalized = seed >>> 0
  // Keep one in four seeds on established material for spaced review.
  if ((normalized & 3) === 3) return null
  return finish(skill, difficulty, normalized, graph(normalized))
}
