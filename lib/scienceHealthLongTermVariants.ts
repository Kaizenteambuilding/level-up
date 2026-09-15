import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = { prompt: string; answer: string; distractors: [string,string,string]; solution: string; level: number }

const BANK: Record<string, Card[]> = {
  B06S01: [
    { level:1, prompt:'¿Qué hábito favorece mejor la recuperación física y la atención durante la semana?', answer:'Dormir suficientes horas con horarios regulares', distractors:['Dormir muy poco entre semana y compensarlo solo el fin de semana','Acostarse cada día a una hora muy distinta','Eliminar toda actividad física'], solution:'El sueño suficiente y regular favorece recuperación, memoria y atención.' },
    { level:1, prompt:'¿Qué combinación contribuye de forma más completa a una buena salud?', answer:'Sueño, actividad física, higiene y alimentación equilibrada', distractors:['Solo ejercicio intenso','Solo beber mucha agua','Dormir poco y hacer ejercicio ocasional'], solution:'La salud depende de varios hábitos que actúan conjuntamente.' },
    { level:2, prompt:'Una persona duerme cinco horas cada noche y se siente somnolienta en clase. ¿Qué cambio sería prioritario?', answer:'Aumentar y regularizar las horas de sueño', distractors:['Tomar más bebidas energéticas','Eliminar el desayuno','Hacer ejercicio justo antes de dormir cada noche'], solution:'La somnolencia persistente puede relacionarse con falta de sueño y horarios irregulares.' },
    { level:2, prompt:'¿Por qué lavarse las manos antes de comer es un hábito saludable?', answer:'Reduce la probabilidad de llevar microorganismos potencialmente dañinos a la boca', distractors:['Elimina para siempre todos los microorganismos del cuerpo','Sustituye cualquier otra medida de higiene','Evita todas las enfermedades sin excepción'], solution:'El lavado reduce la transmisión de microorganismos, aunque no elimina todo riesgo.' },
    { level:3, prompt:'Un estudiante entrena a diario pero duerme poco y come de forma muy irregular. ¿Qué valoración es más adecuada?', answer:'El ejercicio ayuda, pero otros hábitos pueden limitar su bienestar y recuperación', distractors:['El ejercicio compensa cualquier otro hábito','Dormir no influye si se hace deporte','La alimentación no afecta al rendimiento'], solution:'Los hábitos de salud interactúan y ninguno compensa por completo déficits importantes de otros.' },
    { level:3, prompt:'¿Qué estrategia favorece mantener un hábito saludable a largo plazo?', answer:'Elegir cambios realistas, medibles y sostenibles', distractors:['Cambiar todo de forma extrema durante dos días','Depender solo de la motivación del momento','Abandonar si un día no se cumple'], solution:'Los cambios graduales y sostenibles suelen ser más fáciles de mantener.' },
    { level:4, prompt:'Dos personas siguen el mismo plan de ejercicio, pero una mejora menos porque duerme poco y está continuamente fatigada. ¿Qué explica mejor la diferencia?', answer:'La recuperación también depende del sueño y otros hábitos, no solo del ejercicio', distractors:['El sueño nunca influye en la recuperación','Solo importa la intensidad del entrenamiento','La fatiga demuestra que necesita duplicar el ejercicio'], solution:'El rendimiento y la recuperación son procesos multifactoriales.' },
    { level:4, prompt:'¿Por qué una recomendación de salud debe evitar afirmaciones absolutas como “este hábito evita todas las enfermedades”?', answer:'Porque la salud depende de múltiples factores y ningún hábito ofrece protección total', distractors:['Porque los hábitos nunca influyen en la salud','Porque todas las enfermedades tienen una única causa','Porque solo la genética determina la salud'], solution:'Las recomendaciones responsables reconocen límites, probabilidades y múltiples causas.' },
  ],
  B06S02: [
    { level:1, prompt:'¿Qué nutriente aporta energía de forma habitual al organismo?', answer:'Los hidratos de carbono', distractors:['El agua','Las vitaminas','Las sales minerales'], solution:'Los carbohidratos son una fuente energética importante.' },
    { level:1, prompt:'¿Qué nutriente tiene una función destacada en construcción y reparación de tejidos?', answer:'Las proteínas', distractors:['El agua únicamente','Las vitaminas como material estructural principal','Las sales minerales como única fuente energética'], solution:'Las proteínas aportan aminoácidos para construir y reparar estructuras corporales.' },
    { level:2, prompt:'¿Qué opción describe mejor una alimentación equilibrada?', answer:'Variedad de alimentos en proporciones adecuadas a las necesidades', distractors:['Consumir un único alimento completo','Eliminar todos los hidratos de carbono','Tomar suplementos en lugar de alimentos variados'], solution:'El equilibrio depende de variedad, proporción y necesidades individuales.' },
    { level:2, prompt:'Una etiqueta indica mucho azúcar añadido y poca fibra. ¿Qué conclusión prudente puede hacerse?', answer:'Conviene compararlo con otras opciones y moderar su consumo habitual', distractors:['Es venenoso por definición','Nunca puede consumirse','Es automáticamente saludable si tiene pocas grasas'], solution:'Las etiquetas ayudan a comparar productos y valorar su lugar en el patrón alimentario.' },
    { level:3, prompt:'¿Por qué no es correcto clasificar un alimento aislado como “perfecto” o “prohibido” sin contexto?', answer:'Porque importa el patrón global, la frecuencia, la cantidad y las necesidades personales', distractors:['Porque todos los alimentos tienen exactamente el mismo valor nutricional','Porque las cantidades nunca importan','Porque una dieta equilibrada depende de un solo nutriente'], solution:'La calidad de la alimentación se evalúa en conjunto, no por etiquetas absolutas aisladas.' },
    { level:3, prompt:'Un deportista adolescente elimina casi todos los hidratos de carbono porque cree que siempre son perjudiciales. ¿Qué error hay?', answer:'Generaliza y elimina una fuente energética importante sin valorar tipo, cantidad y necesidad', distractors:['Los hidratos no aportan energía','Todos los hidratos son vitaminas','El ejercicio elimina la necesidad de comer'], solution:'Los carbohidratos cumplen funciones relevantes; su calidad y cantidad importan.' },
    { level:4, prompt:'Dos productos tienen igual energía, pero uno aporta más fibra, vitaminas y menos azúcares añadidos. ¿Qué valoración es razonable?', answer:'La calidad nutricional puede diferir aunque la energía total sea similar', distractors:['Son nutricionalmente idénticos','El que tiene más azúcar es siempre mejor','Las vitaminas no aportan ninguna información útil'], solution:'La energía es solo una dimensión del valor nutricional.' },
    { level:4, prompt:'¿Qué límite tiene usar solo las calorías para comparar alimentos?', answer:'No informa por sí solo de fibra, proteínas, micronutrientes o grado de procesamiento', distractors:['Las calorías indican todos los nutrientes','La energía no tiene ninguna utilidad','Solo sirve para comparar agua'], solution:'Una valoración completa requiere más información que la energía total.' },
  ],
  B06S03: [
    { level:1, prompt:'¿Cómo puede afectar la contaminación del aire a la salud?', answer:'Puede aumentar problemas respiratorios y cardiovasculares', distractors:['Mejora la capacidad pulmonar','Solo afecta a edificios','No tiene relación con organismos vivos'], solution:'Diversos contaminantes atmosféricos pueden perjudicar la salud humana.' },
    { level:1, prompt:'¿Qué medida mejora a la vez salud ambiental y humana en una ciudad?', answer:'Reducir emisiones contaminantes del transporte y otras fuentes', distractors:['Aumentar motores al ralentí','Quemar residuos al aire libre','Eliminar zonas verdes'], solution:'Menos emisiones reduce exposición a contaminantes y presión ambiental.' },
    { level:2, prompt:'Un río contaminado se usa para riego y ocio. ¿Por qué el problema puede afectar a personas y ecosistemas?', answer:'Los contaminantes pueden circular por agua, organismos y actividades humanas', distractors:['El agua contaminada solo afecta a las rocas','Los ecosistemas no influyen en la salud humana','La contaminación desaparece al cambiar de uso'], solution:'La salud humana y ambiental están conectadas por exposición y cadenas ecológicas.' },
    { level:2, prompt:'¿Qué relación existe entre olas de calor y salud?', answer:'Temperaturas extremas pueden aumentar deshidratación y estrés térmico', distractors:['El calor extremo mejora siempre el rendimiento físico','La temperatura no afecta al cuerpo','Solo afecta a plantas'], solution:'El cuerpo puede tener dificultad para regular su temperatura durante episodios extremos.' },
    { level:3, prompt:'¿Por qué proteger zonas verdes urbanas puede aportar beneficios de salud?', answer:'Puede reducir calor, favorecer actividad física y mejorar calidad ambiental', distractors:['Porque elimina cualquier enfermedad','Porque sustituye hospitales','Porque impide toda contaminación'], solution:'Los espacios verdes pueden aportar varios beneficios, aunque no son una solución única.' },
    { level:3, prompt:'Una población vive cerca de una fuente de contaminación. ¿Qué dato ayudaría más a evaluar riesgo?', answer:'Nivel de exposición, duración y efectos observados en salud', distractors:['Solo el color de los edificios','La marca de los vehículos de la zona','El número de calles sin medir contaminantes'], solution:'El riesgo depende de dosis, tiempo de exposición y efectos biológicos.' },
    { level:4, prompt:'¿Por qué la salud ambiental se considera un problema interdisciplinar?', answer:'Porque conecta contaminación, ecosistemas, exposición humana, hábitos y políticas públicas', distractors:['Porque solo depende de la medicina','Porque solo depende de la meteorología','Porque los ecosistemas no tienen relación con personas'], solution:'Comprender y reducir riesgos requiere integrar varias disciplinas.' },
    { level:4, prompt:'Si disminuye un contaminante pero los efectos en salud tardan años en mejorar, ¿qué explicación es plausible?', answer:'Puede haber exposiciones acumuladas y efectos con recuperación lenta', distractors:['La reducción nunca sirve','Los contaminantes no afectan a la salud','Toda respuesta biológica es inmediata'], solution:'Algunos efectos dependen de exposición prolongada y procesos de recuperación temporalmente lentos.' },
  ],
  B06S04: [
    { level:1, prompt:'Para un trayecto urbano corto, ¿qué opción suele tener menor impacto ambiental directo?', answer:'Caminar o ir en bicicleta cuando es seguro', distractors:['Usar un coche vacío para recorrer pocas calles','Mantener un motor encendido durante la espera','Elegir siempre el vehículo más pesado'], solution:'Los desplazamientos activos evitan emisiones directas y pueden aportar beneficios de salud.' },
    { level:1, prompt:'¿Qué hábito reduce residuos?', answer:'Reutilizar objetos y evitar productos de un solo uso cuando sea posible', distractors:['Desechar objetos útiles después de un uso','Comprar envases innecesarios','Mezclar todos los residuos siempre'], solution:'Reutilizar prolonga la vida útil y reduce demanda de materiales y residuos.' },
    { level:2, prompt:'¿Qué criterio ayuda a elegir entre dos productos similares de forma más sostenible?', answer:'Considerar duración, materiales, transporte, reparación y residuos', distractors:['Elegir solo por el color','Comprar siempre el de mayor tamaño','Ignorar cuánto dura el producto'], solution:'La sostenibilidad requiere valorar varias etapas del ciclo de vida.' },
    { level:2, prompt:'¿Por qué reparar un aparato puede ser más sostenible que sustituirlo inmediatamente?', answer:'Puede alargar su vida útil y evitar fabricar y desechar otro producto', distractors:['Porque reparar no consume nunca recursos','Porque fabricar productos no tiene impacto','Porque todos los aparatos reparados duran para siempre'], solution:'Extender la vida útil puede reducir materiales, energía y residuos asociados a sustitución.' },
    { level:3, prompt:'Un producto local usa mucho material desechable y otro más lejano dura diez veces más. ¿Qué conclusión es adecuada?', answer:'No basta un único criterio; hay que comparar varios impactos del ciclo de vida', distractors:['Lo local siempre gana automáticamente','La duración nunca importa','El transporte es el único impacto relevante'], solution:'Las decisiones sostenibles suelen implicar compensaciones entre factores.' },
    { level:3, prompt:'¿Qué cambio doméstico reduce consumo energético sin eliminar un servicio necesario?', answer:'Mejorar aislamiento y evitar pérdidas de calefacción o refrigeración', distractors:['Dejar ventanas abiertas con calefacción encendida','Mantener luces innecesarias encendidas','Sustituir equipos eficientes por otros menos eficientes'], solution:'La eficiencia permite mantener el servicio usando menos energía.' },
    { level:4, prompt:'¿Por qué “reciclar” no debería ser la única estrategia frente a los residuos?', answer:'Porque reducir y reutilizar pueden evitar consumo de materiales antes de generar el residuo', distractors:['Porque reciclar siempre empeora el ambiente','Porque todos los residuos son imposibles de reciclar','Porque reducir materiales aumenta residuos'], solution:'La jerarquía de residuos prioriza prevenir y reutilizar antes de gestionar el residuo final.' },
    { level:4, prompt:'Una medida ambiental reduce emisiones pero aumenta mucho consumo de agua. ¿Cómo debería evaluarse?', answer:'Comparando beneficios y costes en varios indicadores ambientales', distractors:['Mirando solo las emisiones','Descartándola siempre sin medir','Suponiendo que toda medida ambiental es positiva en cualquier aspecto'], solution:'La sostenibilidad requiere analizar impactos múltiples y evitar trasladar el problema de un recurso a otro.' },
  ],
}

const FRAMES = [
  (prompt: string) => prompt,
  (prompt: string) => `Valora esta situación: ${prompt}`,
  (prompt: string) => `Aplica criterios de salud y sostenibilidad: ${prompt}`,
  (prompt: string) => `Reto de decisión responsable: ${prompt}`,
] as const

function rotate<T>(items: T[], shift: number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

export function generateScienceHealthLongTermVariant(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
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
    tags: [skill.generator_key, 'biology', 'health_sustainability_long_term'],
  }
}

export function scienceHealthVariantCount(skillId: string) {
  return (BANK[skillId]?.length ?? 0) * FRAMES.length
}

export function scienceHealthVariantSkillIds() {
  return Object.keys(BANK)
}
