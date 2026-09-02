import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = { prompt: string; answer: string; distractors: [string, string, string]; solution: string }

const BANK: Record<string, Card[]> = {
  G02S01: [
    {prompt:'¿Qué forma del relieve es una extensión amplia y relativamente llana a poca altitud?',answer:'Llanura',distractors:['Valle','Cordillera','Acantilado'],solution:'Una llanura es una superficie extensa con poco desnivel.'},
    {prompt:'¿Cómo se llama un conjunto extenso de montañas enlazadas entre sí?',answer:'Cordillera',distractors:['Meseta','Delta','Llanura'],solution:'Una cordillera agrupa montañas conectadas formando una alineación extensa.'},
    {prompt:'¿Qué forma del relieve es una zona baja situada entre montañas?',answer:'Valle',distractors:['Meseta','Cabo','Cordillera'],solution:'Los valles son depresiones alargadas entre zonas más elevadas, a menudo recorridas por ríos.'},
    {prompt:'Una superficie bastante llana situada a elevada altitud se denomina…',answer:'Meseta',distractors:['Llanura','Golfo','Valle'],solution:'Una meseta es una superficie llana o suavemente ondulada situada a cierta altitud.'},
    {prompt:'¿Qué forma costera es una pared rocosa alta y abrupta junto al mar?',answer:'Acantilado',distractors:['Delta','Llanura','Meseta'],solution:'Un acantilado es una costa rocosa con una pendiente muy pronunciada.'},
    {prompt:'¿Qué nombre recibe una elevación natural del terreno de gran altura y pendiente?',answer:'Montaña',distractors:['Llanura','Valle','Golfo'],solution:'Una montaña destaca sobre el terreno circundante por su altitud y pendientes.'},
    {prompt:'Si un territorio presenta poca pendiente y escasa diferencia de altura, predomina un relieve de…',answer:'Llanura',distractors:['Alta montaña','Acantilado','Cordillera'],solution:'Las llanuras se caracterizan por pendientes suaves y poco desnivel.'},
    {prompt:'¿Qué diferencia principal hay entre una meseta y una llanura?',answer:'La meseta se encuentra a mayor altitud',distractors:['La llanura siempre está bajo el mar','La meseta es siempre una montaña aislada','La llanura no puede tener ríos'],solution:'Ambas pueden ser relativamente planas, pero la meseta se sitúa a una altitud elevada.'},
  ],
  G02S02: [
    {prompt:'¿Qué océano se encuentra entre América y Europa-África?',answer:'Atlántico',distractors:['Índico','Ártico','Pacífico'],solution:'El Atlántico separa América de Europa y África.'},
    {prompt:'¿Cuál es el continente de mayor extensión?',answer:'Asia',distractors:['Europa','Oceanía','Antártida'],solution:'Asia es el continente con mayor superficie terrestre.'},
    {prompt:'¿Qué océano separa principalmente América de Asia y Oceanía?',answer:'Pacífico',distractors:['Atlántico','Índico','Ártico'],solution:'El océano Pacífico se extiende entre América al este y Asia-Oceanía al oeste.'},
    {prompt:'España forma parte del continente de…',answer:'Europa',distractors:['Asia','África','Oceanía'],solution:'España se localiza en el suroeste de Europa.'},
    {prompt:'¿Qué continente se encuentra alrededor del Polo Sur?',answer:'Antártida',distractors:['Europa','África','Oceanía'],solution:'La Antártida rodea geográficamente el Polo Sur.'},
    {prompt:'¿Qué océano baña la costa oriental de África y la occidental de Australia?',answer:'Índico',distractors:['Atlántico','Pacífico','Ártico'],solution:'El Índico se sitúa entre África, Asia y Australia.'},
    {prompt:'¿Qué continente está atravesado tanto por el ecuador como por el meridiano de Greenwich?',answer:'África',distractors:['Europa','Oceanía','Antártida'],solution:'Ambas líneas de referencia atraviesan el continente africano.'},
    {prompt:'¿Cuál es el océano de menor extensión y situado alrededor del Polo Norte?',answer:'Ártico',distractors:['Atlántico','Índico','Pacífico'],solution:'El océano Ártico rodea el Polo Norte y es el menor de los grandes océanos.'},
  ],
  G02S03: [
    {prompt:'¿Cómo se llama el territorio cuyas aguas desembocan en un mismo río principal?',answer:'Cuenca hidrográfica',distractors:['Delta','Acuífero','Península'],solution:'La cuenca reúne las aguas que drenan hacia un mismo sistema fluvial.'},
    {prompt:'¿Cómo se denomina el lugar donde nace un río?',answer:'Nacimiento',distractors:['Desembocadura','Delta','Estuario'],solution:'El nacimiento es el punto o zona donde se origina el curso de un río.'},
    {prompt:'¿Qué nombre recibe el lugar donde un río vierte sus aguas al mar, lago u otro río?',answer:'Desembocadura',distractors:['Nacimiento','Divisoria','Meandro'],solution:'La desembocadura es el final del curso fluvial.'},
    {prompt:'Un río que desemboca en otro río mayor es un…',answer:'Afluente',distractors:['Acuífero','Estuario','Delta'],solution:'Un afluente aporta sus aguas a otro río principal.'},
    {prompt:'¿Qué es el caudal de un río?',answer:'La cantidad de agua que transporta',distractors:['La altura de su nacimiento','La longitud de su nombre','La anchura de su cuenca únicamente'],solution:'El caudal expresa el volumen de agua que pasa por un punto del río en un tiempo determinado.'},
    {prompt:'¿Qué formación puede aparecer en una desembocadura cuando se acumulan muchos sedimentos?',answer:'Delta',distractors:['Cordillera','Meseta','Acuífero'],solution:'La acumulación de sedimentos en ciertas desembocaduras puede formar un delta.'},
    {prompt:'¿Dónde se almacena agua subterránea en materiales permeables?',answer:'En un acuífero',distractors:['En una cordillera','En un cabo','En una divisoria de aguas'],solution:'Los acuíferos almacenan y transmiten agua bajo la superficie terrestre.'},
    {prompt:'¿Qué línea del relieve separa dos cuencas hidrográficas?',answer:'Divisoria de aguas',distractors:['Meandro','Delta','Estuario'],solution:'La divisoria de aguas marca el límite desde el que el agua fluye hacia cuencas diferentes.'},
  ],
  G02S04: [
    {prompt:'¿Por qué los grandes valles fluviales han favorecido históricamente el poblamiento?',answer:'Por el acceso al agua y a suelos fértiles',distractors:['Porque siempre tienen clima polar','Porque impiden la agricultura','Porque carecen de vías naturales'],solution:'Agua, suelos y comunicaciones han favorecido asentamientos y agricultura.'},
    {prompt:'¿Qué dificultad puede imponer una cordillera a las comunicaciones?',answer:'Obliga a buscar pasos y aumenta el coste de las rutas',distractors:['Hace innecesarias las carreteras','Elimina cualquier diferencia de altitud','Convierte todos los ríos en mares'],solution:'Las fuertes pendientes y altitudes dificultan el transporte y concentran las rutas en pasos naturales.'},
    {prompt:'¿Por qué muchas ciudades se han desarrollado cerca de costas y puertos?',answer:'Facilitan transporte, comercio y acceso a recursos marinos',distractors:['Porque no existe riesgo costero','Porque las costas impiden el intercambio','Porque allí nunca vive población'],solution:'La accesibilidad marítima favorece intercambios, actividades económicas y concentración de población.'},
    {prompt:'¿Qué ventaja suele ofrecer una llanura para construir infraestructuras?',answer:'Menores pendientes y mayor facilidad de construcción',distractors:['Mayor necesidad de túneles','Ausencia total de suelo','Pendientes siempre extremas'],solution:'Un relieve poco accidentado suele facilitar carreteras, ferrocarriles y expansión urbana.'},
    {prompt:'Construir viviendas en una llanura de inundación puede aumentar el riesgo de…',answer:'Inundaciones',distractors:['Erupciones volcánicas necesariamente','Glaciaciones','Tornados por definición'],solution:'Las llanuras próximas a los cauces pueden inundarse cuando el río supera su capacidad.'},
    {prompt:'¿Qué actividad humana puede acelerar la erosión en una ladera?',answer:'Eliminar la cubierta vegetal',distractors:['Reforestar con especies adecuadas','Mantener terrazas agrícolas','Proteger el suelo'],solution:'La vegetación protege y fija el suelo; eliminarla aumenta su exposición al agua y al viento.'},
    {prompt:'¿Por qué los pasos de montaña son importantes?',answer:'Permiten atravesar cordilleras por zonas relativamente accesibles',distractors:['Son desembocaduras de ríos','Crean océanos','Eliminan toda pendiente'],solution:'Los pasos aprovechan puntos más bajos o accesibles para comunicar ambos lados de una montaña.'},
    {prompt:'¿Qué medida reduce el impacto de construir en zonas con fuerte pendiente?',answer:'Planificar el uso del suelo y evitar áreas inestables',distractors:['Retirar toda vegetación','Construir sin estudiar el terreno','Aumentar la erosión'],solution:'Evaluar pendientes, estabilidad y drenaje permite reducir riesgos y daños ambientales.'},
  ],
  G03S01: [
    {prompt:'“Hoy llueve y hay 9 °C” describe principalmente…',answer:'El tiempo atmosférico',distractors:['El clima','La latitud','Una estación climática'],solution:'El tiempo describe condiciones atmosféricas en un momento concreto.'},
    {prompt:'¿Qué concepto describe las condiciones atmosféricas habituales de una zona durante muchos años?',answer:'El clima',distractors:['El tiempo de esta tarde','La longitud','El relieve únicamente'],solution:'El clima resume patrones atmosféricos observados durante periodos largos.'},
    {prompt:'Una tormenta que dura dos horas es un fenómeno de…',answer:'Tiempo atmosférico',distractors:['Clima regional','Latitud','Continente'],solution:'Un episodio de corta duración pertenece al tiempo atmosférico, no define por sí solo el clima.'},
    {prompt:'Para caracterizar el clima de una ciudad necesitamos datos de…',answer:'Muchos años',distractors:['Una sola mañana','Una única tormenta','Un solo día'],solution:'El clima se establece a partir de series prolongadas de temperatura, precipitación y otras variables.'},
    {prompt:'Que un día de invierno sea excepcionalmente cálido…',answer:'No demuestra por sí solo un cambio del clima local',distractors:['Define automáticamente el clima','Elimina las estaciones','Demuestra que nunca hará frío'],solution:'Un día aislado es tiempo atmosférico; las tendencias climáticas requieren observaciones prolongadas.'},
    {prompt:'Temperatura, viento y precipitación medidos ahora describen…',answer:'El estado actual de la atmósfera',distractors:['La tectónica de placas','La población','La longitud geográfica'],solution:'Esas variables permiten describir el tiempo atmosférico de un lugar y momento.'},
    {prompt:'¿Cuál sería un dato climático?',answer:'La precipitación media anual calculada durante décadas',distractors:['La lluvia de esta mañana','La temperatura a las 15:00 de hoy','Una ráfaga de viento puntual'],solution:'Una media de muchos años caracteriza el clima, mientras los datos puntuales describen el tiempo.'},
    {prompt:'¿Cuál de estas frases habla de clima?',answer:'Los veranos suelen ser secos y calurosos',distractors:['Ahora mismo hay 18 °C','Ayer cayó granizo','Esta tarde sopla viento fuerte'],solution:'La palabra “suelen” expresa un patrón habitual y prolongado propio del clima.'},
  ],
  G03S02: [
    {prompt:'A igual latitud, ¿qué suele ocurrir con la temperatura al aumentar la altitud?',answer:'Disminuye',distractors:['Aumenta siempre','No cambia nunca','Se duplica'],solution:'En general, la temperatura desciende con la altitud.'},
    {prompt:'¿Por qué las zonas cercanas al ecuador reciben generalmente más energía solar?',answer:'Los rayos solares llegan más perpendiculares',distractors:['Están siempre a mayor altitud','No tienen atmósfera','Están más cerca de la Luna'],solution:'La incidencia más directa concentra la energía solar sobre una superficie menor.'},
    {prompt:'¿Qué efecto suele tener el mar sobre las temperaturas de las costas?',answer:'Suaviza las diferencias térmicas',distractors:['Las hace siempre extremas','Impide cualquier precipitación','Elimina las estaciones'],solution:'El agua se calienta y enfría lentamente, moderando las temperaturas próximas al litoral.'},
    {prompt:'Dos lugares están a la misma latitud, pero uno está a 1 500 m más de altitud. ¿Cuál suele ser más fresco?',answer:'El situado a mayor altitud',distractors:['El más bajo necesariamente','Ambos siempre idénticos','El que tenga más longitud'],solution:'La temperatura suele disminuir a medida que aumenta la altitud.'},
    {prompt:'¿Qué factor climático está relacionado con la distancia al ecuador?',answer:'La latitud',distractors:['La leyenda del mapa','El caudal','La escala'],solution:'La latitud condiciona el ángulo con el que llega la radiación solar.'},
    {prompt:'Una cordillera puede hacer que una ladera reciba más lluvia que la opuesta debido a…',answer:'El efecto del relieve sobre las masas de aire',distractors:['La escala cartográfica','La longitud del río','La densidad urbana únicamente'],solution:'El aire húmedo asciende, se enfría y puede precipitar en la ladera expuesta, dejando una sombra pluviométrica detrás.'},
    {prompt:'¿Qué zona suele presentar menor amplitud térmica: una costa o un interior continental?',answer:'La costa',distractors:['El interior siempre','Ambas necesariamente igual','La de mayor longitud geográfica'],solution:'La influencia reguladora del mar reduce normalmente las diferencias entre temperaturas extremas.'},
    {prompt:'¿Qué combinación puede explicar diferencias de clima entre dos lugares?',answer:'Latitud, altitud, relieve y distancia al mar',distractors:['Solo el nombre de la ciudad','Solo el color del mapa','Únicamente el huso horario'],solution:'El clima resulta de la interacción de varios factores geográficos y atmosféricos.'},
  ],
  G03S03: [
    {prompt:'En un climograma, las barras suelen representar…',answer:'Las precipitaciones',distractors:['La longitud','La población','La presión política'],solution:'Habitualmente las barras muestran precipitación y la línea, temperatura.'},
    {prompt:'En un climograma escolar, la línea suele representar…',answer:'La temperatura media mensual',distractors:['Las fronteras','La altitud de montañas','La población absoluta'],solution:'La convención habitual representa temperaturas con una línea y precipitaciones con barras.'},
    {prompt:'Si las barras de julio y agosto son casi cero, esos meses son…',answer:'Muy secos',distractors:['Necesariamente muy fríos','Los más poblados','De máxima altitud'],solution:'Barras muy bajas indican precipitaciones mensuales escasas.'},
    {prompt:'Si la línea de temperatura alcanza su máximo en julio, ¿qué podemos afirmar?',answer:'Julio es uno de los meses más cálidos del gráfico',distractors:['Es el mes más lluvioso necesariamente','Es el de menor altitud','No se puede comparar temperaturas'],solution:'La altura de la línea permite comparar la temperatura media entre meses.'},
    {prompt:'¿Cómo obtenemos aproximadamente la amplitud térmica anual de un climograma?',answer:'Restando la temperatura media del mes más frío a la del más cálido',distractors:['Sumando todas las precipitaciones','Dividiendo la lluvia entre doce','Midiendo la altitud'],solution:'La amplitud térmica es la diferencia entre las temperaturas medias mensuales máxima y mínima.'},
    {prompt:'¿Qué cálculo permite estimar la precipitación anual a partir del climograma?',answer:'Sumar las precipitaciones de los doce meses',distractors:['Restar enero a diciembre','Sumar solo temperaturas','Multiplicar la altitud por la latitud'],solution:'La precipitación anual es la suma de las cantidades registradas en todos los meses.'},
    {prompt:'Un climograma muestra temperaturas suaves y lluvia repartida todo el año. ¿Qué información estamos interpretando?',answer:'El patrón climático anual',distractors:['Una frontera política','Una escala cartográfica','Un único episodio meteorológico'],solution:'El conjunto mensual permite reconocer cómo se distribuyen temperatura y precipitación a lo largo del año.'},
    {prompt:'¿Por qué conviene observar conjuntamente línea y barras en un climograma?',answer:'Para relacionar temperatura y precipitación a lo largo del año',distractors:['Para localizar coordenadas','Para medir distancias de carreteras','Para conocer fronteras'],solution:'La lectura conjunta permite identificar estaciones cálidas, frías, húmedas o secas y caracterizar el clima.'},
  ],
  G03S04: [
    {prompt:'¿Qué medida reduce la vulnerabilidad ante una sequía prolongada?',answer:'Ahorrar y gestionar eficientemente el agua',distractors:['Aumentar las fugas de la red','Eliminar toda vegetación','Impermeabilizar todos los suelos'],solution:'La gestión eficiente reduce presión sobre reservas limitadas.'},
    {prompt:'¿Qué actuación ayuda a reducir daños por inundaciones en zonas de riesgo?',answer:'Evitar construir en áreas inundables y mejorar la prevención',distractors:['Ocupar todos los cauces','Eliminar sistemas de alerta','Bloquear el drenaje'],solution:'La ordenación territorial y la prevención reducen la exposición de personas y bienes.'},
    {prompt:'Durante una ola de calor, ¿qué medida protege mejor a la población?',answer:'Hidratación, sombra y atención a personas vulnerables',distractors:['Hacer ejercicio intenso al mediodía','Cerrar todos los puntos de agua','Ignorar las alertas'],solution:'Reducir la exposición al calor y mantener hidratación disminuye el riesgo para la salud.'},
    {prompt:'¿Qué práctica urbana puede ayudar frente a temperaturas extremas?',answer:'Aumentar zonas verdes y sombra',distractors:['Eliminar árboles','Cubrir todo con asfalto oscuro','Reducir espacios de sombra'],solution:'La vegetación y la sombra ayudan a moderar el calentamiento local y ofrecen refugio térmico.'},
    {prompt:'¿Qué significa adaptarse a un riesgo climático?',answer:'Prepararse para reducir sus daños y vulnerabilidad',distractors:['Negar que pueda ocurrir','Aumentar deliberadamente la exposición','Eliminar todos los datos meteorológicos'],solution:'La adaptación busca anticipar impactos y reducir exposición y vulnerabilidad.'},
    {prompt:'Ante lluvias torrenciales previstas, ¿qué acción es más prudente?',answer:'Seguir avisos oficiales y evitar zonas inundables',distractors:['Cruzar cauces con agua','Aparcar en ramblas','Ignorar alertas'],solution:'Los cauces y zonas bajas pueden inundarse rápidamente; atender alertas reduce la exposición.'},
    {prompt:'¿Qué medida hace más resiliente el abastecimiento ante sequías?',answer:'Reducir pérdidas y diversificar fuentes de agua',distractors:['Aumentar fugas','Depender de una única fuente sin reservas','Desperdiciar agua potable'],solution:'La eficiencia y la diversidad de recursos reducen la vulnerabilidad del suministro.'},
    {prompt:'¿Por qué son útiles los sistemas de alerta temprana ante fenómenos extremos?',answer:'Permiten prepararse antes de que llegue el peligro',distractors:['Evitan que exista cualquier fenómeno','Sustituyen toda planificación','Aumentan la exposición'],solution:'Una alerta con antelación permite activar medidas de protección y reducir daños.'},
  ],
}

function rotate<T>(items:T[],shift:number){return items.slice(shift).concat(items.slice(0,shift))}

export function generateGeographyPhysicalQuestion(skill:SkillMeta,difficulty:number,seed:number):GeneratedQuestion|null{
  const cards=BANK[skill.id]
  if(!cards?.length)return null
  const card=cards[Math.abs(seed)%cards.length]
  const options=[card.answer,...card.distractors]
  const rotated=rotate(options,(Math.abs(seed)+difficulty)%options.length)
  return {skillId:skill.id,label:skill.name,difficulty,seed,prompt:card.prompt,options:rotated,answerIndex:rotated.indexOf(card.answer),solution:card.solution,tags:[skill.generator_key,'geography_history','physical_geography_variety']}
}

export function geographyPhysicalQuestionCounts(){return Object.fromEntries(Object.entries(BANK).map(([skillId,cards])=>[skillId,cards.length]))}
