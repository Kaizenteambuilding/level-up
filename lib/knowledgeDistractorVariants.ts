import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = { prompt: string; answer: string; distractors: [string, string, string]; solution: string }

const CARDS: Record<string, Card[]> = {
  G05S02: [
    { prompt:'¿Qué explica mejor por qué el Nilo favoreció el desarrollo del antiguo Egipto?', answer:'Aportaba agua, limo fértil y una vía de transporte', distractors:['Aportaba agua, pero hacía imposible cultivar sus orillas','Servía sobre todo como frontera y apenas se utilizaba para transportar','Permitía cultivar sin organizar canales ni prever las crecidas'], solution:'El Nilo combinaba agua, fertilidad y comunicación, aunque exigía organización para aprovechar sus crecidas.' },
    { prompt:'¿Por qué muchas primeras ciudades crecieron cerca de grandes ríos?', answer:'Porque facilitaban agua, regadío, excedentes agrícolas y transporte', distractors:['Porque garantizaban cosechas sin necesidad de trabajo ni organización','Porque evitaban por completo inundaciones y conflictos por el agua','Porque sustituían la agricultura por el comercio fluvial'], solution:'Los ríos favorecieron agricultura, excedentes y comunicación; no eliminaban riesgos ni trabajo.' },
    { prompt:'¿Qué ventaja daba controlar canales y sistemas de riego?', answer:'Regular mejor el agua y sostener una producción agrícola más estable', distractors:['Evitar cualquier dependencia de las estaciones','Eliminar la necesidad de almacenar excedentes','Hacer innecesaria la coordinación entre comunidades'], solution:'Gestionar el agua ayudaba a estabilizar cultivos y requería organización colectiva.' },
  ],
  G06S01: [
    { prompt:'¿Qué diferencia esencial había entre la democracia ateniense y una monarquía hereditaria?', answer:'Parte de los ciudadanos participaba directamente en decisiones políticas', distractors:['Los ciudadanos elegían a un rey hereditario para gobernar de por vida','Toda la población residente participaba con los mismos derechos políticos','Las leyes dependían de un emperador nombrado fuera de la polis'], solution:'La democracia ateniense incluía participación directa de ciudadanos, aunque la ciudadanía estaba restringida.' },
    { prompt:'¿Cuál fue una limitación importante de la democracia ateniense?', answer:'La ciudadanía política excluía a amplios grupos de población', distractors:['Los ciudadanos no podían intervenir en ninguna asamblea','Las magistraturas eran siempre hereditarias dentro de una familia','Las decisiones políticas las tomaba exclusivamente el ejército'], solution:'Mujeres, esclavos y extranjeros, entre otros, quedaban fuera de la ciudadanía política.' },
    { prompt:'Decir que una polis tenía instituciones propias significa que…', answer:'Organizaba su gobierno y sus leyes con autonomía política', distractors:['Dependía de un único rey común para todas las polis griegas','Aplicaba obligatoriamente las mismas leyes que cualquier otra polis','Carecía de órganos políticos porque las decisiones eran solo religiosas'], solution:'Las polis eran comunidades políticas autónomas con instituciones y leyes propias.' },
  ],
  B02S01: [
    { prompt:'Una erupción volcánica libera cenizas y gases. ¿Qué interacción entre sistemas terrestres describe mejor?', answer:'La geosfera puede modificar la atmósfera', distractors:['La atmósfera puede modificar la geosfera únicamente porque cambia la presión del aire alrededor del volcán','La hidrosfera es el sistema que origina las cenizas y gases expulsados durante la erupción','La biosfera recibe materiales de la erupción, pero la atmósfera no participa en ese intercambio'], solution:'Materiales procedentes de la geosfera pueden incorporarse a la atmósfera y afectar también a otros sistemas.' },
    { prompt:'¿Qué conjunto pertenece principalmente a la hidrosfera?', answer:'Océanos, ríos, lagos, hielo y aguas subterráneas', distractors:['Océanos, ríos, nubes, vapor de agua y todo el suelo húmedo','Ríos, lagos, aguas subterráneas y las rocas que contienen esos acuíferos','Océanos, hielo, seres vivos acuáticos y vapor de agua atmosférico'], solution:'La hidrosfera reúne el agua terrestre en sus distintos estados y reservas; no incluye los materiales sólidos ni los seres vivos que la contienen o rodean.' },
    { prompt:'Tras varios días de lluvia intensa aumenta el caudal de un río y se erosiona una ladera. ¿Qué interacción describe mejor?', answer:'La hidrosfera puede modificar la geosfera', distractors:['La geosfera modifica la hidrosfera porque la lluvia se forma dentro de las rocas','La biosfera modifica la atmósfera porque el río transporta sedimentos','La atmósfera modifica directamente la biosfera sin intervenir agua ni suelo'], solution:'El agua en movimiento puede erosionar y transportar materiales de la geosfera.' },
  ],
  B03S01: [
    { prompt:'¿Qué afirmación representa correctamente la teoría celular?', answer:'Todos los seres vivos están formados por una o más células', distractors:['Solo los seres vivos microscópicos están formados por células','Los organismos complejos tienen tejidos, pero no están formados por células','Las células aparecen únicamente en organismos que realizan fotosíntesis'], solution:'La célula es la unidad estructural básica de todos los seres vivos.' },
    { prompt:'¿Qué diferencia permite distinguir una célula vegetal típica de una animal?', answer:'La vegetal puede presentar pared celular y cloroplastos', distractors:['La animal presenta pared celular y cloroplastos, pero la vegetal no','La vegetal carece de membrana plasmática y la animal sí la posee','La animal tiene núcleo y la vegetal nunca tiene material genético organizado'], solution:'Las células vegetales típicas poseen pared celular y, en tejidos fotosintéticos, cloroplastos.' },
  ],
  B04S01: [
    { prompt:'¿Cuál de estas situaciones corresponde principalmente a la función de relación?', answer:'Una planta orienta su crecimiento hacia la luz', distractors:['Una planta fabrica materia orgánica mediante fotosíntesis','Una planta forma semillas tras la reproducción','Una planta absorbe agua y sales minerales por las raíces'], solution:'La función de relación implica captar estímulos y responder; orientarse hacia la luz es una respuesta a un estímulo.' },
    { prompt:'¿Qué secuencia ordena correctamente los niveles de organización de menor a mayor?', answer:'Célula → tejido → órgano → sistema → organismo', distractors:['Célula → órgano → tejido → sistema → organismo','Tejido → célula → órgano → organismo → sistema','Célula → tejido → sistema → órgano → organismo'], solution:'Las células forman tejidos; los tejidos, órganos; los órganos se integran en sistemas y estos en el organismo.' },
  ],
  B04S02: [
    { prompt:'Una clave dicotómica pregunta primero si un organismo tiene columna vertebral. ¿Qué criterio está utilizando?', answer:'Una característica anatómica observable', distractors:['El tipo de reproducción del organismo','El medio en el que fue observado','La etapa concreta de su ciclo vital'], solution:'La presencia de columna vertebral es una característica anatómica observable y útil para clasificar.' },
    { prompt:'Dos organismos tienen alas, pero uno tiene plumas y otro una cubierta dura externa. ¿Qué rasgo ayuda mejor a separarlos en una clave?', answer:'El tipo de cubierta corporal', distractors:['La presencia de alas','La capacidad de desplazarse','El tamaño corporal del ejemplar'], solution:'Un buen criterio distingue grupos mediante rasgos observables que no comparten todos los organismos comparados.' },
    { prompt:'¿Cuál es el mejor criterio para separar primero estos organismos: pez, rana, lagarto y gorrión?', answer:'Presencia o ausencia de aletas', distractors:['Presencia o ausencia de ojos','Capacidad de desplazarse','Presencia o ausencia de boca'], solution:'Las aletas separan al pez del resto; los otros rasgos propuestos son compartidos por todos.' },
    { prompt:'En una clave, una pregunta útil debe permitir…', answer:'Separar organismos según rasgos observables y definidos', distractors:['Separar organismos solo por el hábitat donde fueron encontrados','Agrupar organismos según un único parecido superficial','Cambiar el criterio según el ejemplar que se quiera identificar'], solution:'Las claves funcionan con criterios claros, observables y reproducibles.' },
    { prompt:'Quieres distinguir dos plantas muy parecidas. ¿Qué dato sería más útil para una clave de identificación?', answer:'La forma y disposición de sus hojas', distractors:['La altura del ejemplar en un único momento','La cantidad de agua recibida esa semana','El lugar exacto donde fue fotografiada'], solution:'La morfología de las hojas es un rasgo observable y comparable entre ejemplares.' },
    { prompt:'Si una clave pregunta “¿tiene seis patas?”, ¿qué tipo de información está usando?', answer:'Un carácter morfológico cuantificable', distractors:['Un carácter fisiológico difícil de observar','Un dato ecológico del hábitat','Un rasgo de comportamiento variable'], solution:'El número de patas es una característica corporal observable y medible.' },
    { prompt:'¿Qué mejora una clasificación científica de organismos?', answer:'Usar varios rasgos consistentes y observables', distractors:['Usar un único rasgo aunque varíe mucho entre individuos','Cambiar de criterio al comparar cada pareja de organismos','Priorizar el hábitat sobre cualquier característica del organismo'], solution:'Combinar rasgos consistentes reduce errores y hace la clasificación reproducible.' },
    { prompt:'Un alumno agrupa delfines y tiburones juntos solo porque ambos nadan. ¿Qué problema tiene ese criterio?', answer:'Usa una semejanza funcional y omite rasgos anatómicos que los diferencian', distractors:['Da demasiado peso a la forma del cuerpo, que basta para clasificarlos juntos','Ignora que ambos viven en agua, el criterio principal para clasificarlos','Debería usar únicamente el tamaño para decidir si pertenecen al mismo grupo'], solution:'Para clasificar hay que considerar rasgos diagnósticos relevantes, no una única semejanza superficial.' },
  ],
  B05S01: [
    { prompt:'En un bosque, ¿qué opción representa un factor abiótico?', answer:'La disponibilidad de agua en el suelo', distractors:['La cobertura de hojarasca producida por los árboles','La cantidad de hongos que descomponen materia orgánica','La densidad de raíces que compiten por agua en el suelo'], solution:'El agua es un componente físico no vivo; hojarasca, hongos y raíces dependen directamente de organismos vivos.' },
    { prompt:'Si disminuye mucho una especie de presa, ¿qué efecto es más razonable sobre un depredador muy especializado en ella?', answer:'Su población puede disminuir al reducirse el alimento disponible', distractors:['Su población puede aumentar porque cada depredador encuentra más territorio libre aunque haya menos alimento','Su población tenderá a mantenerse si la presa sigue presente, aunque sea mucho menos abundante','Su población aumentará mientras disminuya la competencia entre individuos de la propia especie'], solution:'En una red trófica, la disponibilidad de presas condiciona a los depredadores que dependen de ellas.' },
    { prompt:'En una laguna aumenta mucho el fitoplancton tras un aporte de nutrientes. ¿Qué cambio puede ocurrir después?', answer:'Puede disminuir el oxígeno disuelto cuando gran cantidad de materia orgánica se descompone', distractors:['Puede aumentar indefinidamente el oxígeno porque todo el fitoplancton produce más fotosíntesis','Puede desaparecer la descomposición porque los nutrientes sustituyen la actividad de bacterias y hongos','Puede mantenerse igual el oxígeno porque productores y descomponedores no influyen unos en otros'], solution:'Un exceso de nutrientes puede provocar proliferaciones y, después, consumo de oxígeno durante la descomposición.' },
  ],
  B06S01: [
    { prompt:'¿Qué hábito favorece mejor la recuperación física y la atención durante la semana?', answer:'Mantener horarios regulares y dormir suficientes horas', distractors:['Dormir muy poco entre semana y compensarlo solo el fin de semana','Acostarse cada día a una hora muy distinta aunque se duerma bastante','Reducir el sueño para disponer de más tiempo de estudio por la noche'], solution:'La cantidad y la regularidad del sueño favorecen la recuperación y la atención sostenida.' },
    { prompt:'¿Qué describe mejor una alimentación equilibrada?', answer:'Variar alimentos y ajustar cantidades y frecuencia a las necesidades', distractors:['Eliminar por completo un grupo de alimentos sin motivo médico','Repetir siempre los mismos alimentos mientras se mantengan las calorías','Sustituir comidas completas por bebidas azucaradas cuando haya poco tiempo'], solution:'Una alimentación equilibrada combina variedad, proporción y regularidad.' },
  ],
}

function hash(seed: number) {
  let x = seed >>> 0
  x ^= x >>> 16
  x = Math.imul(x, 0x7feb352d) >>> 0
  x ^= x >>> 15
  x = Math.imul(x, 0x846ca68b) >>> 0
  x ^= x >>> 16
  return x >>> 0
}

function rotate<T>(items: T[], shift: number) {
  const n = ((shift % items.length) + items.length) % items.length
  return items.slice(n).concat(items.slice(0, n))
}

export function generateKnowledgeDistractorVariant(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  if (difficulty < 3) return null
  const cards = CARDS[skill.id]
  if (!cards?.length) return null

  const index = hash(seed + difficulty * 173) % cards.length
  const card = cards[index]
  const options = rotate([card.answer, ...card.distractors], seed + difficulty)

  return {
    skillId: skill.id,
    label: skill.name,
    difficulty,
    seed,
    prompt: card.prompt,
    options,
    answerIndex: options.indexOf(card.answer),
    solution: card.solution,
    tags: [skill.generator_key, 'plausible_distractors', `family:knowledge-distractor:${skill.id}:d${difficulty}:f${index}`],
  }
}