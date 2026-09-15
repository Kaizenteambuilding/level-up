import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = { level: number; prompt: string; answer: string; distractors: [string,string,string]; solution: string }

const BANK: Record<string, Card[]> = {
  B06S02: [
    { level:1, prompt:'¿Qué nutriente aporta aminoácidos necesarios para construir y reparar tejidos?', answer:'Las proteínas', distractors:['Los hidratos de carbono','Las grasas','El agua'], solution:'Las proteínas aportan aminoácidos, utilizados en construcción y reparación de tejidos.' },
    { level:1, prompt:'¿Qué opción describe mejor una alimentación equilibrada?', answer:'Combinar alimentos variados en cantidades acordes a las necesidades', distractors:['Priorizar alimentos energéticos aunque falten otros nutrientes','Elegir siempre los productos con menos calorías','Mantener las mismas cantidades independientemente de actividad y edad'], solution:'El equilibrio depende de variedad, proporción y necesidades, no de un único indicador.' },
    { level:2, prompt:'Dos cereales aportan calorías similares. Uno tiene más fibra y menos azúcares añadidos. ¿Qué dato favorece al segundo?', answer:'Su perfil aporta más fibra y menos azúcar añadido', distractors:['Que ambos tengan una energía parecida','Que la caja tenga un tamaño diferente','Que uno incluya más texto publicitario'], solution:'Con energía similar, fibra y azúcares añadidos son datos útiles para comparar calidad nutricional.' },
    { level:2, prompt:'Una etiqueta muestra 8 g de fibra y otra 2 g por la misma cantidad de producto. ¿Qué puede concluirse?', answer:'El primero aporta más fibra en esa porción comparable', distractors:['El primero tiene necesariamente más vitaminas','El segundo tiene necesariamente menos calorías','Ambos tienen la misma composición nutricional'], solution:'La comparación permite afirmar únicamente lo que muestran los datos de fibra.' },
    { level:3, prompt:'Un adolescente deportista elimina casi todos los hidratos de carbono para “comer mejor”. ¿Qué valoración es más adecuada?', answer:'La decisión debe valorar tipo, cantidad y necesidades energéticas, no eliminar el grupo sin más', distractors:['Reducir cualquier fuente de hidratos mejora necesariamente el rendimiento','Las proteínas pueden sustituir cualquier función energética sin consecuencias','La actividad física hace irrelevante la distribución de nutrientes'], solution:'Los hidratos cumplen funciones energéticas importantes; la calidad y cantidad deben ajustarse al contexto.' },
    { level:3, prompt:'Un alimento tiene menos grasa total pero bastante más azúcar añadido que otro. ¿Qué comparación es más rigurosa?', answer:'Valorar el conjunto de nutrientes y la frecuencia de consumo', distractors:['Elegir automáticamente el que tenga menos grasa total','Elegir automáticamente el que tenga menos azúcar aunque cambien mucho los demás nutrientes','Decidir solo por el nutriente destacado en la parte frontal'], solution:'Una comparación nutricional responsable considera varios indicadores y el contexto de consumo.' },
    { level:4, prompt:'Dos productos tienen la misma energía. A aporta más fibra y micronutrientes; B aporta menos fibra y más azúcares añadidos. ¿Qué conclusión es razonable?', answer:'La calidad nutricional puede ser distinta aunque las calorías coincidan', distractors:['La igualdad energética permite considerarlos equivalentes en todos los aspectos','La diferencia de fibra basta para conocer por completo cuál conviene en cualquier dieta','El contenido de azúcar permite ignorar el resto de la etiqueta'], solution:'La energía total es un dato, pero no resume composición, calidad ni adecuación individual.' },
    { level:4, prompt:'¿Por qué comparar alimentos solo por sus calorías puede llevar a una conclusión incompleta?', answer:'Porque no refleja por sí sola fibra, proteínas, micronutrientes, azúcares añadidos ni grado de procesamiento', distractors:['Porque las calorías solo son comparables cuando los productos pesan distinto','Porque la energía es útil únicamente en alimentos ricos en proteínas','Porque conocer la energía permite deducir aproximadamente todos los demás nutrientes'], solution:'La energía es relevante, pero necesita interpretarse junto con otros componentes y el contexto dietético.' },
  ],
  B06S04: [
    { level:1, prompt:'Para un desplazamiento corto y seguro, ¿qué opción reduce más las emisiones directas del trayecto?', answer:'Caminar o ir en bicicleta', distractors:['Compartir un coche de combustión','Usar un coche híbrido','Usar transporte motorizado para ahorrar tiempo'], solution:'Caminar y pedalear no generan emisiones directas durante el trayecto.' },
    { level:1, prompt:'¿Qué decisión reduce la generación de residuos desde el principio?', answer:'Elegir un objeto reutilizable en lugar de uno de un solo uso', distractors:['Separar el residuo después de usarlo una vez','Comprar el mismo producto en un envase mayor de usar y tirar','Cambiar un objeto funcional por uno nuevo más eficiente'], solution:'Prevenir el residuo suele ser preferible a gestionarlo después de generarlo.' },
    { level:2, prompt:'Un aparato puede repararse por un coste razonable y seguir funcionando varios años. ¿Qué ventaja ambiental puede tener repararlo?', answer:'Evita parte de los materiales y residuos asociados a fabricar otro', distractors:['Garantiza que consumirá menos energía que cualquier aparato nuevo','Hace innecesario valorar su eficiencia durante los años siguientes','Reduce únicamente el transporte, pero no materiales ni residuos'], solution:'Alargar la vida útil puede reducir fabricación y residuos, aunque conviene valorar también eficiencia y uso.' },
    { level:2, prompt:'Al comparar dos productos similares, ¿qué conjunto de datos ayuda más a valorar sostenibilidad?', answer:'Duración, reparabilidad, materiales, transporte y fin de vida', distractors:['Precio y color del envase','Distancia de transporte como único criterio','Cantidad de publicidad ambiental del fabricante'], solution:'La sostenibilidad requiere considerar varias etapas del ciclo de vida.' },
    { level:3, prompt:'Un producto local dura un año; otro fabricado más lejos dura diez y es reparable. ¿Qué decisión es más rigurosa?', answer:'Comparar el impacto total durante su vida útil antes de decidir', distractors:['Elegir el local únicamente por la distancia','Elegir el duradero únicamente por los años de uso','Considerar que transporte y durabilidad se compensan siempre exactamente'], solution:'Distancia, materiales, fabricación, duración y reparación pueden cambiar el balance global.' },
    { level:3, prompt:'¿Qué medida doméstica mejora eficiencia sin renunciar al servicio de calefacción?', answer:'Reducir pérdidas mediante aislamiento y ajustar la temperatura de uso', distractors:['Cambiar a un equipo más potente manteniendo las mismas pérdidas','Apagar la calefacción en todas las situaciones independientemente del clima','Calentar más horas para evitar arranques del sistema'], solution:'La eficiencia busca el mismo servicio con menor consumo, reduciendo pérdidas y optimizando el uso.' },
    { level:4, prompt:'¿Por qué reciclar no basta como única estrategia para reducir impactos de los residuos?', answer:'Porque prevenir y reutilizar pueden evitar extracción, fabricación y residuo antes del reciclaje', distractors:['Porque reutilizar siempre consume menos energía que cualquier reciclaje','Porque los materiales reciclados pierden necesariamente toda utilidad','Porque reducir residuos solo afecta a la fase de transporte'], solution:'La jerarquía de residuos prioriza prevención y reutilización porque evitan impactos antes de la gestión final.' },
    { level:4, prompt:'Una tecnología reduce mucho CO₂ pero usa bastante más agua y materiales críticos. ¿Cómo debería evaluarse?', answer:'Con varios indicadores para comprobar beneficios, costes y posibles desplazamientos de impacto', distractors:['Solo por la reducción de CO₂, ya que resume el impacto total','Solo por el consumo de agua, porque es el recurso más importante en cualquier lugar','Sumando indicadores sin considerar contexto, escala ni vida útil'], solution:'La sostenibilidad exige análisis multicriterio y contexto para evitar trasladar impactos de un ámbito a otro.' },
  ],
  L05S04: [
    { level:1, prompt:'Al revisar un borrador, ¿qué conviene comprobar antes de corregir detalles de puntuación?', answer:'Que las ideas principales se entienden y siguen un orden lógico', distractors:['Que todas las oraciones tengan una longitud parecida','Que el texto use suficientes palabras poco frecuentes','Que cada párrafo termine con la misma estructura'], solution:'Primero se revisan contenido y organización; después pueden pulirse aspectos formales.' },
    { level:1, prompt:'Un párrafo repite cinco veces la misma idea con palabras parecidas. ¿Qué revisión mejora más el texto?', answer:'Eliminar repeticiones y conservar la formulación que aporte la idea con mayor claridad', distractors:['Añadir un ejemplo a cada repetición','Cambiar algunas palabras por sinónimos sin eliminar ninguna frase','Separar cada repetición en un párrafo distinto'], solution:'La revisión debe reducir redundancia sin perder información relevante.' },
    { level:2, prompt:'Un texto pasa de explicar una causa a presentar una consecuencia sin conexión explícita. ¿Qué mejora ayuda más?', answer:'Añadir un conector causal o consecutivo adecuado', distractors:['Añadir un adjetivo al inicio de cada frase','Cambiar el tiempo verbal de todo el párrafo','Sustituir los sustantivos por pronombres aunque haya ambigüedad'], solution:'Los conectores hacen visible la relación lógica entre ideas.' },
    { level:2, prompt:'Un pronombre puede referirse a dos personas mencionadas antes. ¿Qué revisión evita la ambigüedad?', answer:'Sustituirlo por el nombre o grupo nominal necesario para identificar el referente', distractors:['Añadir otro pronombre junto al primero','Eliminar la oración anterior','Cambiar todos los nombres por pronombres'], solution:'Cuando el referente no es claro, conviene explicitarlo.' },
    { level:3, prompt:'Un texto argumenta una idea antes de explicar el problema al que responde. ¿Qué revisión puede mejorar su estructura?', answer:'Presentar primero el problema y después desarrollar la respuesta o argumento', distractors:['Mantener el orden y añadir más adjetivos','Mover la conclusión al principio sin contexto','Intercalar datos de otro tema para dar variedad'], solution:'El orden debe facilitar que el lector entienda por qué aparece cada argumento.' },
    { level:3, prompt:'Dos párrafos consecutivos tratan exactamente el mismo aspecto y ninguno desarrolla una idea distinta. ¿Qué revisión es razonable?', answer:'Fusionarlos o redistribuir la información para que cada párrafo tenga una función clara', distractors:['Mantener ambos y repetir una frase clave al final','Acortar únicamente el segundo sin revisar contenido','Añadir títulos distintos aunque el contenido siga duplicado'], solution:'La organización por párrafos mejora cuando cada unidad desarrolla una idea o función identificable.' },
    { level:4, prompt:'Un informe tiene datos correctos, pero la conclusión introduce una afirmación que no se ha justificado. ¿Qué revisión es mejor?', answer:'Aportar evidencia suficiente o limitar la conclusión a lo que permiten los datos', distractors:['Hacer la conclusión más categórica para que parezca convincente','Mover la afirmación al título sin añadir evidencia','Añadir una cita decorativa que no apoye la afirmación'], solution:'Una conclusión debe estar respaldada por la información desarrollada.' },
    { level:4, prompt:'Al revisar un texto informativo, ¿qué estrategia distingue mejor una revisión profunda de una corrección superficial?', answer:'Comprobar propósito, orden, relaciones entre ideas y evidencias antes de pulir ortografía y estilo', distractors:['Corregir primero cada coma y dar por terminado el texto si no hay faltas','Sustituir palabras comunes por otras más formales sin revisar el contenido','Aumentar la extensión para que el texto parezca más completo'], solution:'La revisión profunda afecta a contenido, estructura y coherencia; la corrección formal es una fase posterior.' },
  ],
}

const FRAMES = [
  (prompt: string) => prompt,
  (prompt: string) => `Analiza con cuidado: ${prompt}`,
  (prompt: string) => `Compara las opciones antes de decidir: ${prompt}`,
  (prompt: string) => `Reto de razonamiento: ${prompt}`,
] as const

function rotate<T>(items: T[], shift: number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

export function generateCourseDepthDistractorPolish(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  const cards = BANK[skill.id]
  if (!cards?.length) return null
  const eligible = cards.filter((card) => Math.abs(card.level - difficulty) <= 1)
  const pool = eligible.length ? eligible : cards
  const normalized = seed >>> 0
  const card = pool[normalized % pool.length]
  const frame = FRAMES[Math.floor(normalized / pool.length) % FRAMES.length]
  const options = rotate([card.answer, ...card.distractors], normalized + difficulty)
  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: frame(card.prompt),
    options,
    answerIndex: options.indexOf(card.answer),
    solution: card.solution,
    tags: [skill.generator_key, 'course_depth_distractor_polish'],
  }
}
