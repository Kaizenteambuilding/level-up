import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = {
  level: number
  prompt: string
  answer: string
  distractors: [string, string, string]
  solution: string
}

const CARDS: Record<string, Card[]> = {
  B02S01: [
    { level: 1, prompt: '¿En qué sistema terrestre se encuentra la mayor parte del agua líquida del planeta?', answer: 'Hidrosfera', distractors: ['Atmósfera', 'Geosfera', 'Biosfera'], solution: 'La hidrosfera incluye océanos, mares, ríos, lagos, aguas subterráneas y hielo.' },
    { level: 1, prompt: 'El aire que rodea la Tierra forma parte principalmente de…', answer: 'La atmósfera', distractors: ['La hidrosfera', 'La geosfera', 'El manto'], solution: 'La atmósfera es la envoltura gaseosa del planeta.' },
    { level: 1, prompt: 'Rocas, minerales y materiales sólidos del planeta pertenecen a…', answer: 'La geosfera', distractors: ['La biosfera', 'La atmósfera', 'La hidrosfera'], solution: 'La geosfera comprende la parte sólida de la Tierra.' },
    { level: 2, prompt: 'Las raíces de una planta abren grietas en una roca. ¿Qué sistemas interactúan?', answer: 'Biosfera y geosfera', distractors: ['Atmósfera e hidrosfera', 'Solo geosfera', 'Hidrosfera y atmósfera'], solution: 'La planta es un ser vivo y actúa sobre la roca, por lo que interactúan biosfera y geosfera.' },
    { level: 2, prompt: 'El vapor de agua se condensa y forma lluvia que cae sobre el suelo. ¿Qué interacción destaca?', answer: 'Atmósfera, hidrosfera y geosfera', distractors: ['Solo biosfera', 'Geosfera y núcleo', 'Solo atmósfera'], solution: 'El agua pasa por la atmósfera, forma parte de la hidrosfera y llega a la superficie sólida.' },
    { level: 2, prompt: 'Un río arrastra sedimentos hasta el mar. ¿Qué dos sistemas intervienen de forma más directa?', answer: 'Hidrosfera y geosfera', distractors: ['Biosfera y atmósfera', 'Atmósfera y núcleo', 'Solo hidrosfera'], solution: 'El agua transporta materiales sólidos procedentes de la geosfera.' },
    { level: 3, prompt: 'Una erupción emite cenizas que reducen temporalmente la luz solar en una región. ¿Qué cadena de interacción es más correcta?', answer: 'Geosfera → atmósfera → biosfera', distractors: ['Biosfera → geosfera → núcleo', 'Hidrosfera → biosfera → manto', 'Atmósfera → núcleo → geosfera'], solution: 'La erupción parte de la geosfera, altera la atmósfera y puede afectar a los seres vivos.' },
    { level: 3, prompt: 'La vegetación reduce la erosión de una ladera durante lluvias intensas. ¿Qué idea muestra?', answer: 'La biosfera puede modificar cómo la hidrosfera actúa sobre la geosfera', distractors: ['La atmósfera no interactúa nunca con otros sistemas', 'La geosfera controla por completo a la biosfera', 'La hidrosfera solo actúa en océanos'], solution: 'Las raíces estabilizan el suelo y reducen el efecto erosivo del agua.' },
    { level: 3, prompt: 'El deshielo de un glaciar deja al descubierto roca desnuda. ¿Qué sistemas participan directamente?', answer: 'Hidrosfera y geosfera', distractors: ['Solo biosfera', 'Atmósfera y biosfera únicamente', 'Núcleo y manto'], solution: 'El hielo pertenece a la hidrosfera y al retirarse expone materiales de la geosfera.' },
    { level: 4, prompt: '¿Qué ejemplo representa mejor una interacción entre los cuatro grandes sistemas terrestres?', answer: 'Lluvia que erosiona suelo con vegetación y transporta sedimentos', distractors: ['Una roca aislada en una vitrina', 'Una corriente de magma profunda sin contacto superficial', 'Un mineral guardado en una caja'], solution: 'Intervienen aire y lluvia, agua, suelo-roca y seres vivos.' },
    { level: 4, prompt: 'Si disminuye mucho la vegetación de una cuenca, ¿qué cambio es razonable esperar tras lluvias fuertes?', answer: 'Mayor escorrentía y erosión del suelo', distractors: ['Desaparición de la gravedad', 'Menor movimiento de agua siempre', 'Conversión de todas las rocas en magma'], solution: 'Menos cubierta vegetal suele dejar el suelo más expuesto a la escorrentía y a la erosión.' },
    { level: 5, prompt: 'En un sistema terrestre, una sequía prolongada reduce vegetación y después aumenta la erosión eólica. ¿Qué interpretación es mejor?', answer: 'Un cambio en atmósfera e hidrosfera puede propagarse a biosfera y geosfera', distractors: ['Cada sistema terrestre funciona de forma independiente', 'Solo cambia la biosfera', 'La erosión eólica pertenece exclusivamente a la hidrosfera'], solution: 'Los sistemas terrestres están conectados y un cambio puede producir efectos encadenados.' },
  ],
  B02S02: [
    { level: 1, prompt: '¿Cuál es una característica propia de un mineral?', answer: 'Es una sustancia natural con composición y propiedades características', distractors: ['Siempre está formado por varios minerales', 'Procede necesariamente de seres vivos', 'Solo existe en forma líquida'], solution: 'Un mineral es una sustancia natural, normalmente inorgánica, con composición y estructura características.' },
    { level: 1, prompt: '¿Qué afirmación distingue mejor roca y mineral?', answer: 'Una roca puede estar formada por uno o varios minerales', distractors: ['Toda roca es un único cristal', 'Todo mineral contiene fósiles', 'Roca y mineral significan exactamente lo mismo'], solution: 'Las rocas son agregados naturales de uno o varios minerales.' },
    { level: 1, prompt: 'El granito contiene cuarzo, feldespato y mica. Por tanto, el granito es…', answer: 'Una roca formada por varios minerales', distractors: ['Un único mineral puro', 'Un fósil', 'Un metal artificial'], solution: 'El granito es una roca compuesta por distintos minerales.' },
    { level: 2, prompt: 'Si un mineral raya al yeso pero no raya al cuarzo, ¿qué propiedad estamos comparando?', answer: 'Dureza', distractors: ['Color de la raya del mapa', 'Densidad del aire', 'Temperatura de fusión de una roca'], solution: 'La capacidad de rayar o ser rayado se relaciona con la dureza.' },
    { level: 2, prompt: '¿Qué propiedad mineral se observa al mirar cómo refleja la luz una superficie?', answer: 'Brillo', distractors: ['Dureza', 'Tenacidad del suelo', 'Erosión'], solution: 'El brillo describe la forma en que la superficie del mineral refleja la luz.' },
    { level: 2, prompt: 'Una muestra se rompe siguiendo superficies planas repetidas. Esa propiedad se llama…', answer: 'Exfoliación', distractors: ['Sedimentación', 'Erosión', 'Fusión'], solution: 'Algunos minerales se separan según planos definidos de su estructura cristalina.' },
    { level: 3, prompt: '¿Cuál de estas observaciones es más útil para identificar un mineral que su color externo?', answer: 'Combinar dureza, brillo, raya y exfoliación', distractors: ['Mirar únicamente el tamaño de la muestra', 'Preguntar dónde se compró', 'Usar solo el color'], solution: 'El color puede variar; varias propiedades juntas permiten una identificación más fiable.' },
    { level: 3, prompt: 'Una roca contiene fragmentos redondeados cementados entre sí. ¿Qué origen es más probable?', answer: 'Sedimentario', distractors: ['Ígneo por enfriamiento directo de magma', 'Metamórfico por recristalización total', 'Artificial'], solution: 'Los fragmentos acumulados, compactados y cementados son propios de muchas rocas sedimentarias detríticas.' },
    { level: 3, prompt: 'Una roca presenta cristales entrelazados formados al enfriarse material fundido. ¿A qué grupo pertenece?', answer: 'Ígneas o magmáticas', distractors: ['Sedimentarias', 'Metamórficas exclusivamente por presión', 'Orgánicas'], solution: 'Las rocas ígneas se forman por solidificación de magma o lava.' },
    { level: 4, prompt: '¿Por qué dos minerales del mismo color pueden ser distintos?', answer: 'Porque el color por sí solo no determina composición ni estructura', distractors: ['Porque todos los minerales cambian de composición cada día', 'Porque el color solo existe en rocas sedimentarias', 'Porque la dureza y el brillo siempre son idénticos'], solution: 'La identificación mineral necesita varias propiedades, no una sola observación.' },
    { level: 4, prompt: 'Una roca cambia su textura y minerales por presión y temperatura, pero no llega a fundirse. ¿Qué tipo de roca resulta?', answer: 'Metamórfica', distractors: ['Ígnea', 'Sedimentaria detrítica', 'Magma'], solution: 'El metamorfismo transforma rocas en estado sólido mediante presión y temperatura.' },
    { level: 5, prompt: 'Para identificar una muestra desconocida, ¿qué estrategia científica es mejor?', answer: 'Medir varias propiedades y comparar el conjunto con referencias', distractors: ['Decidir por el color sin hacer más pruebas', 'Elegir el mineral más común de la zona', 'Nombrarla al azar y mantener la respuesta'], solution: 'La identificación fiable combina evidencias independientes y las contrasta con datos conocidos.' },
  ],
  B02S03: [
    { level: 1, prompt: '¿Qué proceso convierte magma o lava en roca ígnea?', answer: 'Enfriamiento y solidificación', distractors: ['Erosión y transporte', 'Compactación de seres vivos', 'Evaporación del núcleo'], solution: 'Al enfriarse, el material fundido cristaliza y forma roca ígnea.' },
    { level: 1, prompt: 'Sedimentos acumulados pueden formar roca sedimentaria mediante…', answer: 'Compactación y cementación', distractors: ['Fusión completa', 'Fotosíntesis', 'Evaporación de toda la geosfera'], solution: 'La diagénesis compacta y cementa sedimentos hasta formar roca.' },
    { level: 1, prompt: 'Una roca sometida a presión y temperatura sin fundirse puede convertirse en…', answer: 'Metamórfica', distractors: ['Magma', 'Sedimento suelto siempre', 'Agua subterránea'], solution: 'Presión y temperatura producen cambios metamórficos en estado sólido.' },
    { level: 2, prompt: '¿Qué proceso puede iniciar el camino de cualquier roca hacia una roca sedimentaria?', answer: 'Meteorización y erosión', distractors: ['Fusión del núcleo externo', 'Fotosíntesis', 'Cristalización del agua'], solution: 'Las rocas pueden alterarse, erosionarse y producir sedimentos.' },
    { level: 2, prompt: 'Si una roca ígnea se funde, ¿qué material se forma antes de originar otra roca ígnea?', answer: 'Magma', distractors: ['Suelo vegetal', 'Fósil', 'Mineral líquido de agua'], solution: 'La fusión produce magma; al solidificarse puede formar una nueva roca ígnea.' },
    { level: 2, prompt: '¿Puede una roca sedimentaria transformarse directamente en metamórfica?', answer: 'Sí, si aumenta presión y temperatura sin llegar a fundirse', distractors: ['No, debe convertirse antes en ígnea', 'Solo si se evapora', 'Solo si contiene fósiles'], solution: 'Cualquier roca puede sufrir metamorfismo bajo condiciones adecuadas.' },
    { level: 3, prompt: 'Una roca aflora, se fragmenta, sus sedimentos son transportados y después se cementan. ¿Cuál es el resultado final?', answer: 'Una roca sedimentaria', distractors: ['Una roca ígnea plutónica', 'Magma', 'Una roca metamórfica por fusión'], solution: 'La secuencia meteorización-erosión-transporte-sedimentación-diagénesis conduce a roca sedimentaria.' },
    { level: 3, prompt: 'Una roca metamórfica se funde y el magma se enfría lentamente bajo tierra. ¿Qué roca se forma?', answer: 'Una roca ígnea plutónica', distractors: ['Una roca sedimentaria', 'Otra metamórfica sin cambios', 'Solo sedimentos'], solution: 'La fusión genera magma y su enfriamiento lento en profundidad forma roca ígnea plutónica.' },
    { level: 3, prompt: '¿Qué idea central expresa el ciclo de las rocas?', answer: 'Los tres grandes tipos de roca pueden transformarse unos en otros', distractors: ['Cada roca mantiene siempre el mismo tipo', 'Solo las sedimentarias cambian', 'El ciclo ocurre una sola vez'], solution: 'El ciclo describe transformaciones continuas entre rocas ígneas, sedimentarias y metamórficas.' },
    { level: 4, prompt: 'Si una roca se funde por completo, ¿sigue siendo correcto hablar de metamorfismo?', answer: 'No; la fusión produce magma y sale del proceso metamórfico en estado sólido', distractors: ['Sí, todo material fundido es metamórfico', 'Solo si el magma es oscuro', 'Sí, porque metamorfismo significa fusión'], solution: 'El metamorfismo ocurre sin fusión total; al fundirse se forma magma.' },
    { level: 4, prompt: '¿Por qué el ciclo de las rocas no tiene un único punto de inicio?', answer: 'Porque cualquier tipo de roca puede entrar en distintas transformaciones', distractors: ['Porque todas las rocas se forman a la vez', 'Porque nunca interviene energía', 'Porque solo depende del color'], solution: 'El ciclo es una red de procesos, no una secuencia lineal con principio obligatorio.' },
    { level: 5, prompt: 'Una roca sedimentaria se entierra, se metamorfiza, aflora y luego se erosiona. ¿Qué demuestra esta historia?', answer: 'Una misma materia puede recorrer distintas etapas del ciclo de las rocas', distractors: ['Una roca solo puede cambiar una vez', 'La erosión convierte directamente todo en magma', 'El metamorfismo impide cualquier transformación posterior'], solution: 'El material puede pasar por varios tipos de roca y volver a generar sedimentos.' },
  ],
  B02S04: [
    { level: 1, prompt: '¿Qué proceso desgasta y arranca materiales de una roca o del suelo?', answer: 'Erosión', distractors: ['Sedimentación', 'Cristalización', 'Fotosíntesis'], solution: 'La erosión moviliza materiales previamente alterados o los arranca de la superficie.' },
    { level: 1, prompt: '¿Qué proceso deposita materiales transportados cuando el agente pierde energía?', answer: 'Sedimentación', distractors: ['Erosión', 'Fusión', 'Metamorfismo'], solution: 'Los sedimentos se depositan cuando agua, viento o hielo ya no pueden transportarlos.' },
    { level: 1, prompt: 'Un río lleva arena aguas abajo. Ese movimiento corresponde a…', answer: 'Transporte', distractors: ['Sedimentación', 'Metamorfismo', 'Cristalización'], solution: 'El transporte desplaza sedimentos desde una zona a otra.' },
    { level: 2, prompt: '¿Dónde es más probable que un río deposite sedimentos gruesos?', answer: 'Donde disminuye mucho la velocidad de la corriente', distractors: ['Donde la corriente gana energía', 'En cualquier lugar por igual', 'Solo bajo volcanes'], solution: 'Al perder capacidad de transporte, el río deposita primero los materiales más pesados.' },
    { level: 2, prompt: 'El agua se congela dentro de una grieta y la ensancha. ¿Qué proceso es?', answer: 'Meteorización física', distractors: ['Sedimentación marina', 'Metamorfismo', 'Fusión'], solution: 'El hielo ejerce presión y fragmenta la roca sin cambiar su composición química.' },
    { level: 2, prompt: '¿Qué agente puede erosionar, transportar y depositar arena formando dunas?', answer: 'El viento', distractors: ['El núcleo terrestre', 'La fotosíntesis', 'La gravedad lunar exclusivamente'], solution: 'El viento es un agente geológico externo capaz de movilizar sedimentos finos.' },
    { level: 3, prompt: 'Un valle en V profundo suele indicar principalmente la acción prolongada de…', answer: 'Un río que erosiona verticalmente', distractors: ['Un glaciar que forma siempre valles en V', 'Una erupción que deposita ceniza', 'La cristalización de minerales'], solution: 'La erosión fluvial encajada suele originar valles con perfil en V.' },
    { level: 3, prompt: 'Un valle ancho con perfil en U se asocia típicamente a…', answer: 'Erosión glaciar', distractors: ['Erosión fluvial exclusiva', 'Sedimentación eólica', 'Actividad biológica solamente'], solution: 'Los glaciares excavan valles amplios con sección en U.' },
    { level: 3, prompt: '¿Qué relación hay entre meteorización y erosión?', answer: 'La meteorización altera la roca y la erosión puede retirar y movilizar esos materiales', distractors: ['Son exactamente el mismo proceso', 'La erosión ocurre solo antes de la meteorización', 'La meteorización transporta sedimentos a grandes distancias'], solution: 'La meteorización actúa in situ; la erosión implica arranque y desplazamiento.' },
    { level: 4, prompt: 'Tras una lluvia torrencial en una ladera sin vegetación, aparecen surcos y barro al pie. ¿Qué secuencia lo explica mejor?', answer: 'Escorrentía, erosión, transporte y sedimentación', distractors: ['Sedimentación, fusión y cristalización', 'Metamorfismo y vulcanismo', 'Fotosíntesis y evaporación'], solution: 'El agua superficial arranca materiales, los desplaza y finalmente los deposita.' },
    { level: 4, prompt: '¿Por qué construir sobre una llanura de inundación puede aumentar el riesgo?', answer: 'Porque es una zona que el río puede ocupar durante crecidas', distractors: ['Porque allí nunca llega agua', 'Porque todas las rocas se funden durante una crecida', 'Porque el viento desaparece'], solution: 'Las llanuras de inundación forman parte del espacio natural de expansión de un río en crecida.' },
    { level: 5, prompt: 'Dos laderas reciben la misma lluvia: una tiene vegetación densa y otra suelo desnudo. ¿Dónde se espera mayor erosión y por qué?', answer: 'En la ladera desnuda, porque hay menos raíces y cobertura que frenen la escorrentía', distractors: ['En la vegetada, porque las raíces empujan siempre el suelo cuesta abajo', 'Igual en ambas, porque la vegetación no influye', 'En ninguna, porque la lluvia no erosiona'], solution: 'La vegetación protege el suelo, aumenta la infiltración y reduce la velocidad de la escorrentía.' },
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

export function generateGeologyLongTermVariant(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  const cards = CARDS[skill.id]
  if (!cards?.length) return null

  const target = Math.max(1, Math.min(5, difficulty))
  const eligible = cards.filter((card) => Math.abs(card.level - target) <= 1)
  const pool = eligible.length ? eligible : cards
  const index = hash(seed + target * 131 + skill.id.charCodeAt(skill.id.length - 1)) % pool.length
  const card = pool[index]
  const options = rotate([card.answer, ...card.distractors], hash(seed + 977))

  return {
    skillId: skill.id,
    label: skill.name,
    difficulty: target,
    seed,
    prompt: card.prompt,
    options,
    answerIndex: options.indexOf(card.answer),
    solution: card.solution,
    tags: [skill.generator_key, 'geology_long_term', `geology_level:${card.level}`],
  }
}
