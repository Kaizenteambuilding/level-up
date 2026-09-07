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

const EXTRA_VARIANTS: Record<string, Variant[]> = {
  G01S01: [
    { prompt:'Un barco pasa de 10° N a 30° N sin cambiar de longitud. ¿En qué dirección general se desplaza?', answer:'Hacia el norte', distractors:['Hacia el sur','Hacia el este','Hacia el oeste'], solution:'Aumentar la latitud norte indica desplazamiento hacia el norte.' },
    { prompt:'¿Qué coordenada cambia principalmente al desplazarse de este a oeste?', answer:'La longitud', distractors:['La latitud','La altitud','La escala'], solution:'La longitud mide la posición este-oeste respecto al meridiano de Greenwich.' },
    { prompt:'Una ciudad está a 0° de latitud. ¿Sobre qué línea se encuentra?', answer:'Sobre el ecuador', distractors:['Sobre Greenwich','Sobre un trópico necesariamente','Sobre el polo norte'], solution:'La latitud 0° corresponde al ecuador.' },
    { prompt:'¿Qué par de coordenadas puede identificar con precisión un punto de la superficie terrestre?', answer:'Latitud y longitud', distractors:['Altitud y escala','Clima y relieve','Norte y leyenda'], solution:'Latitud y longitud forman el sistema básico de coordenadas geográficas.' },
  ],
  G02S01: [
    { prompt:'¿Cómo se llama una alineación extensa de montañas conectadas?', answer:'Cordillera', distractors:['Llanura','Delta','Península'], solution:'Una cordillera es un conjunto de montañas enlazadas.' },
    { prompt:'Una zona casi plana y de poca altitud respecto al nivel del mar es una…', answer:'Llanura', distractors:['Meseta','Cordillera','Fosa oceánica'], solution:'Las llanuras son superficies amplias con escaso desnivel y baja altitud relativa.' },
    { prompt:'¿Qué relieve se forma con frecuencia en la desembocadura de un río al acumular sedimentos?', answer:'Delta', distractors:['Meseta','Cordillera','Acantilado'], solution:'Los deltas se forman por depósito de sedimentos en la desembocadura.' },
    { prompt:'¿Qué elemento del relieve separa a menudo dos vertientes hidrográficas?', answer:'Una divisoria de aguas en zonas elevadas', distractors:['Un delta costero','Una playa','Un acuífero'], solution:'Las zonas elevadas pueden actuar como divisorias entre cuencas.' },
  ],
  G03S01: [
    { prompt:'¿Qué factor suele hacer bajar la temperatura al ascender por una montaña?', answer:'El aumento de altitud', distractors:['La longitud geográfica','La escala del mapa','El nombre del lugar'], solution:'En general, la temperatura disminuye con la altitud.' },
    { prompt:'En un climograma, ¿qué representan normalmente las barras?', answer:'Las precipitaciones', distractors:['La latitud','La población','La altitud'], solution:'En los climogramas, las barras suelen mostrar la precipitación mensual.' },
    { prompt:'¿Qué diferencia principal hay entre tiempo y clima?', answer:'El tiempo describe condiciones momentáneas y el clima patrones de largo plazo', distractors:['Son exactamente lo mismo','El clima dura solo unas horas','El tiempo se estudia durante décadas únicamente'], solution:'El tiempo es inmediato; el clima se define a partir de tendencias prolongadas.' },
    { prompt:'Una ciudad costera suele tener temperaturas más moderadas que otra interior a igual latitud. ¿Qué factor ayuda a explicarlo?', answer:'La influencia del mar', distractors:['La leyenda del mapa','La longitud por sí sola','El color de las rocas'], solution:'El mar amortigua los cambios térmicos y suaviza las temperaturas.' },
  ],
  G04S01: [
    { prompt:'¿Qué ocurrió antes: 700 a. C. o 150 a. C.?', answer:'700 a. C.', distractors:['150 a. C.','Ocurrieron a la vez','Depende del calendario actual'], solution:'En a. C., las cifras mayores corresponden a fechas más antiguas.' },
    { prompt:'¿Cuál es el orden correcto: 300 d. C., 50 a. C., 120 d. C.?', answer:'50 a. C. → 120 d. C. → 300 d. C.', distractors:['300 d. C. → 120 d. C. → 50 a. C.','120 d. C. → 50 a. C. → 300 d. C.','50 a. C. → 300 d. C. → 120 d. C.'], solution:'Las fechas a. C. son anteriores a las d. C.; entre las d. C., aumenta el número con el tiempo.' },
    { prompt:'Si una civilización floreció hacia 1200 a. C., ¿es anterior o posterior al año 400 a. C.?', answer:'Anterior', distractors:['Posterior','Es el mismo año','No puede compararse'], solution:'1200 a. C. está más alejado del presente que 400 a. C.' },
    { prompt:'¿Qué herramienta ayuda a representar visualmente el orden de acontecimientos históricos?', answer:'Una línea del tiempo', distractors:['Una escala cartográfica','Un climograma','Una brújula'], solution:'La línea del tiempo organiza hechos según su secuencia cronológica.' },
  ],
  G05S02: [
    { prompt:'¿Qué recurso permitió aumentar la producción agrícola en Mesopotamia pese a un clima seco?', answer:'Los sistemas de riego', distractors:['El abandono de los ríos','La eliminación de canales','La ausencia de cultivos'], solution:'Los canales distribuían el agua de los ríos hacia los campos.' },
    { prompt:'¿Por qué eran importantes los excedentes agrícolas en las primeras ciudades?', answer:'Permitían alimentar a población no dedicada directamente al campo', distractors:['Impedían cualquier comercio','Eliminaban la necesidad de organización','Hacían innecesario almacenar alimentos'], solution:'Los excedentes sostuvieron especialización de tareas, intercambio y crecimiento urbano.' },
    { prompt:'¿Qué función cumplía la escritura en muchos primeros Estados?', answer:'Registrar impuestos, leyes y administración', distractors:['Sustituir toda agricultura','Eliminar el comercio','Evitar cualquier gobierno'], solution:'La escritura facilitó la gestión de recursos, normas y territorios.' },
    { prompt:'Egipto y Mesopotamia compartieron una característica clave. ¿Cuál?', answer:'Se desarrollaron en torno a grandes sistemas fluviales', distractors:['Fueron democracias modernas','Surgieron en América','Carecieron de agricultura'], solution:'Ambas civilizaciones aprovecharon grandes ríos para agricultura y organización.' },
  ],
  G06S01: [
    { prompt:'¿Qué era una polis en la antigua Grecia?', answer:'Una ciudad-Estado con instituciones propias', distractors:['Una provincia romana','Una pirámide','Un imperio unificado'], solution:'Las polis eran comunidades políticas independientes como Atenas o Esparta.' },
    { prompt:'¿Qué legado se asocia especialmente a la Grecia clásica?', answer:'Filosofía, teatro y reflexión política', distractors:['Escritura cuneiforme','Pirámides faraónicas','Feudalismo medieval'], solution:'La cultura griega dejó una fuerte herencia filosófica, artística y política.' },
    { prompt:'¿Qué etapa de Roma fue posterior a la República?', answer:'El Imperio', distractors:['El Paleolítico','El Neolítico','La polis arcaica'], solution:'La secuencia política tradicional de Roma pasa de Monarquía a República y luego Imperio.' },
    { prompt:'¿Qué significa romanización?', answer:'La difusión de lengua, instituciones y formas de vida romanas', distractors:['La desaparición de todas las ciudades','La invención de la agricultura','La independencia total de las provincias'], solution:'La romanización extendió elementos culturales y políticos romanos por los territorios conquistados.' },
  ],
  B01S01: [
    { prompt:'En un experimento, ¿qué es la variable independiente?', answer:'La que se modifica deliberadamente', distractors:['La que se mide como resultado','La conclusión final','Una condición que siempre cambia al azar'], solution:'La variable independiente es la que el investigador manipula.' },
    { prompt:'Si quieres saber si un fertilizante influye en el crecimiento, ¿qué debes comparar?', answer:'Plantas similares con y sin fertilizante manteniendo lo demás constante', distractors:['Plantas distintas cambiando todas las condiciones','Una sola planta sin medir nada','Dos especies en ambientes totalmente diferentes'], solution:'Un buen diseño compara grupos y controla otras variables.' },
    { prompt:'¿Qué resultado aporta mejor evidencia en una investigación?', answer:'Medidas repetidas y registradas de forma sistemática', distractors:['Una impresión personal','Un rumor','Una observación sin anotar'], solution:'La evidencia mejora cuando los datos son medibles, repetibles y documentados.' },
    { prompt:'Si los datos contradicen la hipótesis inicial, ¿qué debe hacerse?', answer:'Revisar la hipótesis a la luz de la evidencia', distractors:['Cambiar los datos','Ignorar los resultados','Dar la hipótesis por cierta igualmente'], solution:'La ciencia ajusta sus explicaciones según la evidencia disponible.' },
  ],
  B02S01: [
    { prompt:'¿Qué parte del planeta incluye rocas, minerales y materiales sólidos de la Tierra?', answer:'Geosfera', distractors:['Atmósfera','Hidrosfera','Biosfera solamente'], solution:'La geosfera comprende la parte sólida del planeta.' },
    { prompt:'¿Qué proceso puede desgastar y transportar fragmentos de roca?', answer:'La erosión', distractors:['La fotosíntesis','La digestión','La reproducción'], solution:'La erosión desgasta y moviliza materiales de la superficie.' },
    { prompt:'Una roca sometida a presión y temperatura sin llegar a fundirse puede convertirse en…', answer:'Roca metamórfica', distractors:['Agua subterránea','Roca sedimentaria por evaporación siempre','Suelo orgánico'], solution:'El metamorfismo transforma las rocas mediante presión y temperatura.' },
    { prompt:'¿Qué afirmación describe mejor la relación entre roca y mineral?', answer:'Una roca puede estar formada por uno o varios minerales', distractors:['Toda roca es un único átomo','Los minerales están formados por animales','No existe ninguna diferencia'], solution:'Los minerales tienen composición y propiedades definidas; las rocas son agregados de minerales.' },
  ],
  B03S01: [
    { prompt:'¿Qué estructura delimita la célula y regula el intercambio con el exterior?', answer:'La membrana plasmática', distractors:['El esqueleto','Una raíz','El tejido óseo'], solution:'La membrana plasmática separa el interior celular y controla intercambios.' },
    { prompt:'¿Qué diferencia básica distingue a una célula eucariota de una procariota?', answer:'La eucariota posee núcleo delimitado', distractors:['La procariota siempre tiene cloroplastos','La eucariota carece de ADN','La procariota es siempre pluricelular'], solution:'Las células eucariotas tienen un núcleo rodeado por membrana.' },
    { prompt:'¿Qué nivel de organización está formado por células similares que trabajan juntas?', answer:'Tejido', distractors:['Órgano completo','Sistema planetario','Mineral'], solution:'Un tejido reúne células semejantes especializadas en una función.' },
    { prompt:'¿Cuál de estos seres está formado por células?', answer:'Una bacteria', distractors:['Una roca','Una nube','Un cristal de sal'], solution:'Las bacterias son seres vivos unicelulares.' },
  ],
  B04S01: [
    { prompt:'Obtener materia y energía del entorno corresponde principalmente a la función de…', answer:'Nutrición', distractors:['Relación','Sedimentación','Cristalización'], solution:'La nutrición permite incorporar y utilizar materia y energía.' },
    { prompt:'Producir descendencia corresponde a la función vital de…', answer:'Reproducción', distractors:['Relación','Erosión','Evaporación'], solution:'La reproducción permite generar nuevos individuos.' },
    { prompt:'¿Qué nivel de organización está formado por varios órganos que colaboran?', answer:'Sistema o aparato', distractors:['Célula','Mineral','Molécula de agua únicamente'], solution:'Los órganos se coordinan formando sistemas o aparatos.' },
    { prompt:'¿Qué característica comparten todos los seres vivos?', answer:'Están formados por células y realizan funciones vitales', distractors:['Todos vuelan','Todos hacen fotosíntesis','Todos viven en tierra'], solution:'La organización celular y las funciones vitales son rasgos generales de los seres vivos.' },
  ],
  B05S01: [
    { prompt:'En una cadena alimentaria, ¿qué organismo suele actuar como productor?', answer:'Una planta', distractors:['Un lobo','Un águila','Un consumidor secundario'], solution:'Los productores fabrican materia orgánica, normalmente mediante fotosíntesis.' },
    { prompt:'¿Qué papel cumple un hongo descomponedor en un ecosistema?', answer:'Reciclar materia orgánica y devolver nutrientes al medio', distractors:['Producir luz solar','Eliminar toda materia','Convertirse siempre en depredador'], solution:'Los descomponedores transforman restos orgánicos y reciclan nutrientes.' },
    { prompt:'¿Qué es la biodiversidad?', answer:'La variedad de genes, especies y ecosistemas', distractors:['Solo el número de árboles','Solo los animales domésticos','La temperatura media anual'], solution:'La biodiversidad incluye diversidad genética, de especies y de ecosistemas.' },
    { prompt:'¿Qué efecto puede tener fragmentar un hábitat con muchas barreras?', answer:'Dificultar el movimiento y aislamiento de poblaciones', distractors:['Aumentar siempre la biodiversidad','Eliminar toda competencia sin efectos','Crear alimento automáticamente'], solution:'La fragmentación puede reducir conectividad y aislar poblaciones.' },
  ],
  B06S01: [
    { prompt:'¿Qué hábito ayuda especialmente a mantener una buena hidratación?', answer:'Beber agua regularmente', distractors:['Evitar líquidos todo el día','Tomar solo bebidas azucaradas','Esperar siempre a tener mucha sed'], solution:'Beber agua de forma regular favorece una hidratación adecuada.' },
    { prompt:'¿Qué práctica favorece la salud cardiovascular?', answer:'Realizar actividad física con regularidad', distractors:['Evitar cualquier movimiento','Dormir cada día muy pocas horas','Fumar'], solution:'La actividad física regular mejora la capacidad cardiovascular y otros aspectos de la salud.' },
    { prompt:'¿Qué elección reduce residuos de forma directa?', answer:'Reutilizar objetos cuando sea posible', distractors:['Usar más productos de un solo uso','Tirar objetos aún útiles','Comprar envases innecesarios'], solution:'Reutilizar alarga la vida de los productos y evita generar nuevos residuos.' },
    { prompt:'¿Qué medida ayuda a reducir el consumo energético doméstico?', answer:'Apagar luces y aparatos cuando no se necesitan', distractors:['Dejar todo encendido','Abrir ventanas con la calefacción al máximo','Usar aparatos sin necesidad'], solution:'Reducir consumos innecesarios disminuye gasto energético y emisiones asociadas.' },
  ],
}

function rotate<T>(items:T[], shift:number){ return items.slice(shift).concat(items.slice(0,shift)) }
function allVariants(skillId:string){ return [...(VARIANTS[skillId] ?? []), ...(EXTRA_VARIANTS[skillId] ?? [])] }

export function generateKnowledgeQuestionWithCriticalVariants(skill:SkillMeta,difficulty:number,seed:number):GeneratedQuestion {
  const variants = allVariants(skill.id)
  if (!variants.length || (seed & 1) === 0) {
    const base = generateKnowledgeSubjectQuestion(skill,difficulty,seed)
    if (!base) throw new Error(`No knowledge generator for ${skill.id}`)
    return base
  }
  const index = ((Math.floor(seed / 2) + difficulty) % variants.length + variants.length) % variants.length
  const variant = variants[index]
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
export function criticalVariantCount(skillId:string){ return allVariants(skillId).length }
