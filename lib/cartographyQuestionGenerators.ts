import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = { prompt: string; answer: string; distractors: [string, string, string]; solution: string }

const BANK: Record<string, Card[]> = {
  G01S01: [
    { prompt: '¿Qué coordenada indica la distancia al norte o al sur del ecuador?', answer: 'La latitud', distractors: ['La longitud', 'La altitud', 'La escala'], solution: 'La latitud mide la posición norte-sur respecto al ecuador.' },
    { prompt: 'Un punto está a 25° N y 40° O. ¿Qué dato expresa su posición norte-sur?', answer: '25° N', distractors: ['40° O', 'La escala', 'La altitud'], solution: 'La latitud expresa la posición norte-sur; aquí es 25° N.' },
    { prompt: 'Si un lugar está a 18° S, ¿en qué hemisferio se encuentra?', answer: 'Hemisferio sur', distractors: ['Hemisferio norte', 'Hemisferio oriental', 'Hemisferio occidental'], solution: 'La letra S indica latitud al sur del ecuador.' },
    { prompt: '¿Qué línea imaginaria sirve como referencia de 0° de latitud?', answer: 'El ecuador', distractors: ['El meridiano de Greenwich', 'El trópico de Cáncer', 'El círculo polar ártico'], solution: 'El ecuador divide los hemisferios norte y sur y corresponde a 0° de latitud.' },
    { prompt: '¿Qué coordenada cambia al desplazarnos principalmente de este a oeste?', answer: 'La longitud', distractors: ['La latitud', 'La altitud', 'La escala'], solution: 'La longitud mide la posición este-oeste respecto al meridiano de Greenwich.' },
    { prompt: 'Un punto situado a 12° E está…', answer: 'Al este del meridiano de Greenwich', distractors: ['Al oeste del meridiano de Greenwich', 'Al norte del ecuador necesariamente', 'A 12 km del ecuador'], solution: 'La E indica longitud este respecto al meridiano de Greenwich.' },
    { prompt: '¿Qué par forma unas coordenadas geográficas completas?', answer: 'Latitud y longitud', distractors: ['Altitud y escala', 'Leyenda y orientación', 'Distancia y relieve'], solution: 'Una localización absoluta sobre la Tierra se expresa combinando latitud y longitud.' },
    { prompt: '¿Cuál de estas coordenadas podría corresponder a un lugar del hemisferio norte y occidental?', answer: '42° N, 8° O', distractors: ['42° S, 8° O', '42° N, 8° E', '8° S, 42° E'], solution: 'N sitúa el punto al norte del ecuador y O al oeste de Greenwich.' },
  ],
  G01S02: [
    { prompt: 'En un mapa a escala 1:100 000, 1 cm representa…', answer: '1 km', distractors: ['100 m', '10 km', '100 km'], solution: '100 000 cm reales equivalen a 1 km.' },
    { prompt: 'En un mapa a escala 1:50 000, 2 cm representan en la realidad…', answer: '1 km', distractors: ['100 m', '5 km', '10 km'], solution: 'Cada centímetro representa 50 000 cm, es decir 500 m; 2 cm representan 1 km.' },
    { prompt: 'Si 1 cm en el mapa equivale a 2 km reales, ¿cuánto representan 3 cm?', answer: '6 km', distractors: ['1,5 km', '5 km', '9 km'], solution: 'Se multiplican los 3 cm del mapa por 2 km reales por centímetro: 6 km.' },
    { prompt: 'Dos pueblos están separados 4 cm en un mapa donde 1 cm equivale a 5 km. ¿Qué distancia real hay?', answer: '20 km', distractors: ['9 km', '10 km', '25 km'], solution: '4 cm × 5 km por centímetro = 20 km.' },
    { prompt: '¿Para qué sirve principalmente la escala de un mapa?', answer: 'Para relacionar distancias del mapa con distancias reales', distractors: ['Para indicar el norte', 'Para explicar símbolos', 'Para señalar la altitud máxima'], solution: 'La escala expresa la proporción entre una medida cartográfica y su equivalente real.' },
    { prompt: '¿Qué escala muestra más detalle de una misma zona?', answer: '1:10 000', distractors: ['1:100 000', '1:500 000', '1:1 000 000'], solution: 'Una escala con denominador menor representa una zona más reducida con mayor detalle.' },
    { prompt: 'A escala 1:200 000, 1 cm del mapa equivale a…', answer: '2 km', distractors: ['200 m', '20 km', '200 km'], solution: '200 000 cm son 2 000 m, es decir 2 km.' },
    { prompt: 'Si una ruta real mide 15 km y la escala indica 1 cm = 5 km, ¿cuánto medirá en el mapa?', answer: '3 cm', distractors: ['5 cm', '10 cm', '75 cm'], solution: '15 km ÷ 5 km por centímetro = 3 cm.' },
  ],
  G01S03: [
    { prompt: '¿Qué mapa representa principalmente montañas, ríos y relieve?', answer: 'Un mapa físico', distractors: ['Un mapa político', 'Un mapa electoral', 'Un plano urbano'], solution: 'El mapa físico representa elementos naturales y relieve.' },
    { prompt: '¿Qué tipo de mapa usarías para localizar fronteras entre países?', answer: 'Un mapa político', distractors: ['Un mapa físico', 'Un climograma', 'Un mapa topográfico de relieve únicamente'], solution: 'Los mapas políticos muestran divisiones territoriales como países y fronteras.' },
    { prompt: 'Para comparar las precipitaciones de distintas zonas, conviene consultar…', answer: 'Un mapa climático', distractors: ['Un mapa político', 'Un plano de metro', 'Un mapa histórico de fronteras'], solution: 'Los mapas climáticos representan variables como precipitación o temperatura.' },
    { prompt: '¿Qué mapa temático sería más útil para estudiar dónde vive más población?', answer: 'Un mapa de densidad de población', distractors: ['Un mapa físico de ríos', 'Un mapa de carreteras', 'Un mapa de husos horarios'], solution: 'La densidad de población es una variable temática que puede representarse espacialmente.' },
    { prompt: 'Quieres estudiar alturas y formas del terreno con detalle. ¿Qué recurso cartográfico elegirías?', answer: 'Un mapa topográfico', distractors: ['Un mapa político', 'Un mapa lingüístico', 'Un plano del metro'], solution: 'Los mapas topográficos representan el relieve y las alturas de forma detallada.' },
    { prompt: 'Un mapa que colorea provincias según su producción agrícola es…', answer: 'Un mapa temático', distractors: ['Un mapa físico exclusivamente', 'Una fotografía aérea', 'Una escala gráfica'], solution: 'Un mapa temático representa la distribución espacial de una variable concreta.' },
    { prompt: '¿Qué representación es más adecuada para orientarse por las calles de un barrio?', answer: 'Un plano urbano', distractors: ['Un mapamundi físico', 'Un mapa climático mundial', 'Un mapa de placas tectónicas'], solution: 'Un plano urbano ofrece el detalle necesario de calles y elementos de una ciudad.' },
    { prompt: 'Si necesitas identificar océanos, cordilleras y grandes ríos del mundo, elegirías…', answer: 'Un mapamundi físico', distractors: ['Un mapa electoral', 'Un plano catastral', 'Un mapa de población'], solution: 'Un mapa físico mundial muestra los grandes elementos naturales del planeta.' },
  ],
  G01S04: [
    { prompt: '¿Para qué sirve la leyenda de un mapa?', answer: 'Para explicar el significado de símbolos y colores', distractors: ['Para indicar únicamente el norte', 'Para calcular la edad del mapa', 'Para sustituir la escala'], solution: 'La leyenda permite interpretar la simbología cartográfica.' },
    { prompt: 'En un mapa, una línea azul aparece definida como “río” en la leyenda. ¿Qué representa esa línea?', answer: 'Un río', distractors: ['Una frontera', 'Una carretera', 'Una curva de nivel'], solution: 'La leyenda establece el significado de cada símbolo o color usado en el mapa.' },
    { prompt: '¿Qué elemento del mapa ayuda a saber hacia dónde está el norte?', answer: 'La orientación o rosa de los vientos', distractors: ['La escala', 'La leyenda por sí sola', 'El título únicamente'], solution: 'La flecha del norte o rosa de los vientos indica la orientación del mapa.' },
    { prompt: 'Si un símbolo ★ significa “capital” según la leyenda, ¿qué indica una ★ junto a una ciudad?', answer: 'Que esa ciudad es una capital', distractors: ['Que es la ciudad más alta', 'Que está al norte', 'Que tiene mayor escala'], solution: 'Los símbolos deben interpretarse usando la clave proporcionada por la leyenda.' },
    { prompt: '¿Qué elemento debería consultarse para saber qué significa una zona coloreada de verde?', answer: 'La leyenda', distractors: ['La escala numérica', 'El meridiano de Greenwich', 'La latitud'], solution: 'La leyenda explica qué representa cada color, trama o símbolo.' },
    { prompt: 'Una flecha con la letra N en un mapa permite…', answer: 'Orientar el mapa respecto al norte', distractors: ['Calcular la distancia real', 'Conocer la población', 'Identificar la escala'], solution: 'La indicación N establece la dirección norte y permite deducir los demás puntos cardinales.' },
    { prompt: 'Si el norte está arriba en un mapa, ¿en qué dirección queda el este?', answer: 'A la derecha', distractors: ['A la izquierda', 'Abajo', 'Arriba'], solution: 'Con el norte arriba, el este queda a la derecha, el oeste a la izquierda y el sur abajo.' },
    { prompt: '¿Qué combinación permite interpretar correctamente un símbolo y medir una distancia?', answer: 'Leyenda y escala', distractors: ['Latitud y título', 'Norte y fecha', 'Longitud y color'], solution: 'La leyenda explica el símbolo y la escala permite convertir la distancia del mapa a la realidad.' },
  ],
}

function rotate<T>(items: T[], shift: number) { return items.slice(shift).concat(items.slice(0, shift)) }

export function generateCartographyQuestion(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  const cards = BANK[skill.id]
  if (!cards?.length) return null
  const card = cards[Math.abs(seed) % cards.length]
  const options = [card.answer, ...card.distractors]
  const rotated = rotate(options, (Math.abs(seed) + difficulty) % options.length)
  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: card.prompt,
    options: rotated,
    answerIndex: rotated.indexOf(card.answer),
    solution: card.solution,
    tags: [skill.generator_key, 'geography_history', 'cartography_variety'],
  }
}

export function cartographyQuestionCounts() {
  return Object.fromEntries(Object.entries(BANK).map(([skillId, cards]) => [skillId, cards.length]))
}
