import type { GeneratedQuestion } from './firstEvaluationGenerators'
import { generateKnowledgeSubjectQuestion } from './knowledgeSubjectGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Variant = { prompt: string; answer: string; distractors: [string,string,string]; solution: string }

const VARIANTS: Record<string, Variant[]> = {
  G01S01: [
    { prompt:'Un punto está a 25° N y 40° O. ¿Qué dato expresa su posición norte-sur?', answer:'25° N', distractors:['40° O','La escala','La altitud'], solution:'La latitud expresa la posición norte-sur; aquí es 25° N.' },
    { prompt:'Si un lugar está en 15° S, ¿respecto a qué línea se mide esa coordenada?', answer:'Respecto al ecuador', distractors:['Respecto al meridiano de Greenwich','Respecto al nivel del mar','Respecto al trópico de Cáncer'], solution:'La latitud se mide desde el ecuador hacia el norte o el sur.' },
    { prompt:'Dos ciudades tienen la misma latitud pero distinta longitud. ¿Qué comparten?', answer:'Su posición norte-sur', distractors:['La misma hora solar exacta','La misma altitud','La misma distancia al mar'], solution:'Compartir latitud significa ocupar una posición norte-sur equivalente respecto al ecuador.' },
  ],
  G02S01: [
    { prompt:'¿Qué forma del relieve es una zona baja y alargada entre áreas más elevadas?', answer:'Valle', distractors:['Meseta','Cordillera','Acantilado'], solution:'Un valle es una depresión alargada entre zonas de mayor altitud.' },
    { prompt:'Una superficie extensa, elevada y relativamente llana se denomina…', answer:'Meseta', distractors:['Delta','Valle','Acantilado'], solution:'Una meseta es una llanura situada a una altitud elevada respecto a su entorno.' },
    { prompt:'¿Qué forma del relieve costero presenta una pared rocosa abrupta junto al mar?', answer:'Acantilado', distractors:['Llanura','Meseta','Cuenca'], solution:'El acantilado es una costa alta y escarpada formada por una pendiente rocosa pronunciada.' },
  ],
  G03S01: [
    { prompt:'“Los inviernos suelen ser fríos y los veranos suaves” describe…', answer:'El clima', distractors:['El tiempo de esta tarde','La longitud','La presión de un día concreto'], solution:'El clima resume patrones atmosféricos habituales a largo plazo.' },
    { prompt:'“Hoy hay 18 °C y llueve” es un dato de…', answer:'Tiempo atmosférico', distractors:['Clima de varias décadas','Latitud','Relieve'], solution:'El tiempo atmosférico describe condiciones concretas en un momento y lugar determinados.' },
    { prompt:'Para estudiar el clima de una ciudad, ¿qué información es más útil?', answer:'Registros de temperatura y lluvia de muchos años', distractors:['La temperatura de una sola tarde','Una fotografía de una nube','La hora de salida del sol de un día'], solution:'El clima se analiza con series largas de datos, no con una observación aislada.' },
  ],
  G04S01: [
    { prompt:'Ordena de más antiguo a más reciente: 500 a. C., 200 a. C., 100 d. C.', answer:'500 a. C. → 200 a. C. → 100 d. C.', distractors:['200 a. C. → 500 a. C. → 100 d. C.','100 d. C. → 200 a. C. → 500 a. C.','500 a. C. → 100 d. C. → 200 a. C.'], solution:'En fechas a. C., los números mayores son más antiguos; después llegan las fechas d. C.' },
    { prompt:'¿Qué fecha es más antigua?', answer:'900 a. C.', distractors:['300 a. C.','50 d. C.','400 d. C.'], solution:'Entre fechas a. C., cuanto mayor es el número, más lejos está del presente.' },
    { prompt:'Un hecho ocurrió en 250 a. C. y otro en 80 a. C. ¿Cuál sucedió primero?', answer:'El de 250 a. C.', distractors:['El de 80 a. C.','Ocurrieron a la vez','No se puede comparar'], solution:'En la cronología a. C., 250 a. C. es anterior a 80 a. C.' },
  ],
  G05S02: [
    { prompt:'¿Qué relación explica mejor la importancia del Nilo para Egipto?', answer:'Sus crecidas aportaban agua y sedimentos fértiles', distractors:['Impedía toda agricultura','Separaba completamente a las ciudades','Sustituía la necesidad de caminos'], solution:'El Nilo permitió regadío y fertilidad agrícola, base de la economía egipcia.' },
    { prompt:'¿Por qué muchas primeras civilizaciones surgieron junto a grandes ríos?', answer:'Facilitaban agua, agricultura y transporte', distractors:['Porque eliminaban todos los conflictos','Porque impedían cultivar','Porque aislaban completamente a la población'], solution:'Los grandes ríos aportaban recursos agrícolas y vías de comunicación.' },
    { prompt:'¿Qué ventaja ofrecía controlar canales y sistemas de riego en las primeras ciudades?', answer:'Organizar mejor el uso del agua y la producción agrícola', distractors:['Evitar cualquier necesidad de trabajo','Eliminar las estaciones del año','Hacer innecesario almacenar alimentos'], solution:'Gestionar el agua permitía sostener cultivos, excedentes y poblaciones mayores.' },
  ],
  G06S01: [
    { prompt:'¿Qué rasgo distingue a la democracia ateniense de una monarquía?', answer:'La participación política de una parte de los ciudadanos', distractors:['El poder hereditario de un rey','La ausencia total de instituciones','El gobierno directo de Roma'], solution:'Atenas desarrolló instituciones de participación ciudadana, aunque limitada a una parte de la población.' },
    { prompt:'En una polis griega, ¿qué significa que existieran instituciones propias?', answer:'Que la ciudad-Estado organizaba su propio gobierno y leyes', distractors:['Que dependía siempre del faraón','Que no tenía normas','Que formaba parte del Imperio romano desde su origen'], solution:'Las polis eran comunidades políticas con autonomía e instituciones propias.' },
    { prompt:'¿Qué afirmación describe mejor una limitación de la democracia ateniense?', answer:'No toda la población podía participar como ciudadanía política', distractors:['Todas las personas adultas votaban sin excepción','No existían asambleas','Atenas era una monarquía hereditaria'], solution:'La participación estaba restringida y excluía, entre otros grupos, a mujeres, esclavos y extranjeros.' },
  ],
  B01S01: [
    { prompt:'¿Cuál de estas preguntas puede investigarse con un experimento escolar?', answer:'¿Influye la cantidad de agua en el crecimiento de una planta?', distractors:['¿Cuál es la planta más bonita?','¿Es perfecta la naturaleza?','¿Qué color me gusta más?'], solution:'La primera puede medirse y contrastarse modificando una variable.' },
    { prompt:'Para comprobar si la luz influye en la germinación, ¿qué conviene mantener igual entre grupos?', answer:'El resto de condiciones, como agua y tipo de semilla', distractors:['Cambiar también el agua y la temperatura','Usar especies distintas en cada grupo','Modificar todas las variables a la vez'], solution:'Controlar las demás variables permite atribuir mejor el efecto a la luz.' },
    { prompt:'Una hipótesis científica útil debería ser…', answer:'Comprobable mediante observaciones o medidas', distractors:['Imposible de poner a prueba','Solo una opinión personal','Verdadera por definición'], solution:'Una hipótesis debe poder contrastarse con evidencia.' },
  ],
  B02S01: [
    { prompt:'¿A qué sistema terrestre pertenece el aire que rodea el planeta?', answer:'Atmósfera', distractors:['Hidrosfera','Geosfera','Biosfera únicamente'], solution:'La atmósfera es la envoltura gaseosa de la Tierra.' },
    { prompt:'Los océanos, ríos y aguas subterráneas forman principalmente la…', answer:'Hidrosfera', distractors:['Atmósfera','Geosfera','Litosfera exclusivamente'], solution:'La hidrosfera reúne el agua presente en la Tierra.' },
    { prompt:'Una erupción volcánica afecta directamente a la geosfera y también puede alterar…', answer:'La atmósfera al liberar gases y partículas', distractors:['Solo la longitud geográfica','Únicamente las coordenadas de los mapas','Nada fuera del volcán'], solution:'Los sistemas terrestres interactúan: una erupción puede modificar el aire y otros componentes del entorno.' },
  ],
  B03S01: [
    { prompt:'¿Qué afirmación coincide con la teoría celular?', answer:'Los seres vivos están formados por una o más células', distractors:['Solo los animales tienen células','Las células aparecen únicamente en plantas','Las rocas están formadas por células vivas'], solution:'La teoría celular establece que la célula es la unidad básica de los seres vivos.' },
    { prompt:'¿Qué estructura contiene la mayor parte del material genético en una célula eucariota?', answer:'El núcleo', distractors:['La membrana como única estructura','La pared celular en todos los seres vivos','El citoplasma sin orgánulos'], solution:'En células eucariotas, el núcleo alberga la mayor parte del ADN.' },
    { prompt:'¿Qué estructura permite a muchas células vegetales realizar la fotosíntesis?', answer:'Los cloroplastos', distractors:['Los huesos','Las neuronas','Los glóbulos rojos'], solution:'Los cloroplastos contienen pigmentos y estructuras necesarias para la fotosíntesis.' },
  ],
  B04S01: [
    { prompt:'¿Cuál de estas opciones corresponde a una función vital?', answer:'Nutrición', distractors:['Oxidación de una roca','Evaporación de un charco','Sedimentación'], solution:'Nutrición, relación y reproducción son funciones vitales.' },
    { prompt:'Detectar un estímulo y responder ante él forma parte de la función de…', answer:'Relación', distractors:['Sedimentación','Erosión','Cristalización'], solution:'La función de relación permite captar cambios del entorno y responder.' },
    { prompt:'¿Qué secuencia va de menor a mayor nivel de organización?', answer:'Célula → tejido → órgano → sistema → organismo', distractors:['Órgano → célula → tejido → sistema → organismo','Sistema → órgano → célula → organismo → tejido','Tejido → planeta → órgano → célula → organismo'], solution:'Las células forman tejidos; los tejidos forman órganos, y estos se integran en sistemas y organismos.' },
  ],
  B05S01: [
    { prompt:'En un bosque, ¿cuál de estos elementos es abiótico?', answer:'La luz solar', distractors:['Un pino','Un zorro','Un hongo'], solution:'La luz es un componente no vivo del ecosistema.' },
    { prompt:'Si disminuye mucho una población de presas, ¿qué puede ocurrir con un depredador muy dependiente de ellas?', answer:'Puede disminuir por falta de alimento', distractors:['Aumentará siempre sin límite','Se transformará en productor','No puede verse afectado'], solution:'Las poblaciones de una red alimentaria están conectadas entre sí.' },
    { prompt:'¿Qué acción favorece más directamente la biodiversidad de un hábitat degradado?', answer:'Restaurar vegetación y reducir la fragmentación', distractors:['Eliminar especies autóctonas','Aumentar vertidos','Construir barreras innecesarias'], solution:'Restaurar hábitats y mejorar su conectividad favorece la conservación de especies.' },
  ],
  B06S01: [
    { prompt:'¿Qué hábito favorece de forma directa la recuperación física y la atención?', answer:'Dormir suficientes horas con regularidad', distractors:['Dormir muy poco entre semana','Saltarse comidas a diario','Evitar toda actividad física'], solution:'El descanso suficiente ayuda a recuperación, regulación y atención.' },
    { prompt:'¿Qué opción describe mejor una alimentación equilibrada?', answer:'Combinar variedad de alimentos y agua de forma regular', distractors:['Tomar siempre el mismo alimento','Sustituir todas las comidas por bebidas azucaradas','Eliminar cualquier fuente de fibra'], solution:'La variedad y el equilibrio ayudan a cubrir distintas necesidades nutricionales.' },
    { prompt:'Para un trayecto urbano corto, ¿qué opción suele reducir más las emisiones si es viable y segura?', answer:'Caminar o usar bicicleta', distractors:['Usar un coche para una sola persona siempre','Dejar el motor encendido al esperar','Dar un rodeo en vehículo sin necesidad'], solution:'Los desplazamientos activos evitan emisiones directas y además aportan actividad física.' },
  ],
}

function rotate<T>(items:T[], shift:number){ return items.slice(shift).concat(items.slice(0,shift)) }

export function generateKnowledgeQuestionWithCriticalVariants(skill:SkillMeta,difficulty:number,seed:number):GeneratedQuestion {
  const variants = VARIANTS[skill.id]
  if (!variants || (seed & 1) === 0) {
    const base = generateKnowledgeSubjectQuestion(skill,difficulty,seed)
    if (!base) throw new Error(`No knowledge generator for ${skill.id}`)
    return base
  }
  const variant = variants[Math.abs(seed + difficulty) % variants.length]
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
export function criticalVariantCount(skillId:string){ return VARIANTS[skillId]?.length ?? 0 }
