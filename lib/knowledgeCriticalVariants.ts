import type { GeneratedQuestion } from './firstEvaluationGenerators'
import { generateKnowledgeSubjectQuestion } from './knowledgeSubjectGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Variant = { prompt: string; answer: string; distractors: [string,string,string]; solution: string }

const VARIANTS: Record<string, Variant> = {
  G01S01: { prompt:'Un punto está a 25° N y 40° O. ¿Qué dato expresa su posición norte-sur?', answer:'25° N', distractors:['40° O','La escala','La altitud'], solution:'La latitud expresa la posición norte-sur; aquí es 25° N.' },
  G02S01: { prompt:'¿Qué forma del relieve es una zona baja y alargada entre áreas más elevadas?', answer:'Valle', distractors:['Meseta','Cordillera','Acantilado'], solution:'Un valle es una depresión alargada entre zonas de mayor altitud.' },
  G03S01: { prompt:'“Los inviernos suelen ser fríos y los veranos suaves” describe…', answer:'El clima', distractors:['El tiempo de esta tarde','La longitud','La presión de un día concreto'], solution:'El clima resume patrones atmosféricos habituales a largo plazo.' },
  G04S01: { prompt:'Ordena de más antiguo a más reciente: 500 a. C., 200 a. C., 100 d. C.', answer:'500 a. C. → 200 a. C. → 100 d. C.', distractors:['200 a. C. → 500 a. C. → 100 d. C.','100 d. C. → 200 a. C. → 500 a. C.','500 a. C. → 100 d. C. → 200 a. C.'], solution:'En fechas a. C., los números mayores son más antiguos; después llegan las fechas d. C.' },
  G05S02: { prompt:'¿Qué relación explica mejor la importancia del Nilo para Egipto?', answer:'Sus crecidas aportaban agua y sedimentos fértiles', distractors:['Impedía toda agricultura','Separaba completamente a las ciudades','Sustituía la necesidad de caminos'], solution:'El Nilo permitió regadío y fertilidad agrícola, base de la economía egipcia.' },
  G06S01: { prompt:'¿Qué rasgo distingue a la democracia ateniense de una monarquía?', answer:'La participación política de una parte de los ciudadanos', distractors:['El poder hereditario de un rey','La ausencia total de instituciones','El gobierno directo de Roma'], solution:'Atenas desarrolló instituciones de participación ciudadana, aunque limitada a una parte de la población.' },
  B01S01: { prompt:'¿Cuál de estas preguntas puede investigarse con un experimento escolar?', answer:'¿Influye la cantidad de agua en el crecimiento de una planta?', distractors:['¿Cuál es la planta más bonita?','¿Es perfecta la naturaleza?','¿Qué color me gusta más?'], solution:'La primera puede medirse y contrastarse modificando una variable.' },
  B02S01: { prompt:'¿A qué sistema terrestre pertenece el aire que rodea el planeta?', answer:'Atmósfera', distractors:['Hidrosfera','Geosfera','Biosfera únicamente'], solution:'La atmósfera es la envoltura gaseosa de la Tierra.' },
  B03S01: { prompt:'¿Qué afirmación coincide con la teoría celular?', answer:'Los seres vivos están formados por una o más células', distractors:['Solo los animales tienen células','Las células aparecen únicamente en plantas','Las rocas están formadas por células vivas'], solution:'La teoría celular establece que la célula es la unidad básica de los seres vivos.' },
  B04S01: { prompt:'¿Cuál de estas opciones corresponde a una función vital?', answer:'Nutrición', distractors:['Oxidación de una roca','Evaporación de un charco','Sedimentación'], solution:'Nutrición, relación y reproducción son funciones vitales.' },
  B05S01: { prompt:'En un bosque, ¿cuál de estos elementos es abiótico?', answer:'La luz solar', distractors:['Un pino','Un zorro','Un hongo'], solution:'La luz es un componente no vivo del ecosistema.' },
  B06S01: { prompt:'¿Qué hábito favorece de forma directa la recuperación física y la atención?', answer:'Dormir suficientes horas con regularidad', distractors:['Dormir muy poco entre semana','Saltarse comidas a diario','Evitar toda actividad física'], solution:'El descanso suficiente ayuda a recuperación, regulación y atención.' },
}

function rotate<T>(items:T[], shift:number){ return items.slice(shift).concat(items.slice(0,shift)) }

export function generateKnowledgeQuestionWithCriticalVariants(skill:SkillMeta,difficulty:number,seed:number):GeneratedQuestion {
  const variant = VARIANTS[skill.id]
  if (!variant || (seed & 1) === 0) {
    const base = generateKnowledgeSubjectQuestion(skill,difficulty,seed)
    if (!base) throw new Error(`No knowledge generator for ${skill.id}`)
    return base
  }
  const options = [variant.answer,...variant.distractors]
  const rotated = rotate(options,(seed + difficulty) % 4)
  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: variant.prompt,
    options: rotated,
    answerIndex: rotated.indexOf(variant.answer),
    solution: variant.solution,
    tags: [skill.generator_key, skill.id.startsWith('G') ? 'geography_history' : 'biology_geology', 'critical_variant'],
  }
}

export function criticalVariantSkillIds(){ return Object.keys(VARIANTS) }
