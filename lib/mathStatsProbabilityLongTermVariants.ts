import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = { level: number; prompt: string; answer: string; distractors: [string,string,string]; solution: string }

const BANK: Record<string, Card[]> = {
  M14S01: [
    { level:1, prompt:'En un instituto se quiere conocer la opinión de todo el alumnado. ¿Qué es la población?', answer:'Todo el alumnado del instituto', distractors:['Solo quienes contestan primero','Solo el profesorado','Una clase elegida al azar'], solution:'La población es el conjunto completo sobre el que se quiere estudiar una característica.' },
    { level:1, prompt:'Para estudiar la altura del alumnado se mide a 40 estudiantes elegidos al azar. ¿Qué son esos 40 estudiantes?', answer:'Una muestra', distractors:['La población completa','Una variable cualitativa','Un gráfico'], solution:'La muestra es el subconjunto de la población que se observa directamente.' },
    { level:2, prompt:'¿Qué muestra representa mejor a un colegio de 600 alumnos?', answer:'60 alumnos elegidos al azar de distintos cursos', distractors:['Los 60 primeros de la lista de un solo curso','Solo quienes practican fútbol','Solo alumnado de sexto'], solution:'Una muestra representativa debe reducir sesgos y reflejar la diversidad de la población.' },
    { level:2, prompt:'Se encuesta sobre transporte escolar únicamente a quienes llegan en autobús. ¿Qué problema aparece?', answer:'La muestra está sesgada', distractors:['La población desaparece','La variable deja de existir','El tamaño siempre es suficiente'], solution:'Elegir solo usuarios de autobús excluye sistemáticamente otras formas de transporte.' },
    { level:3, prompt:'Dos muestras tienen el mismo tamaño. Una es aleatoria y otra la forman voluntarios. ¿Cuál suele reducir mejor el sesgo de selección?', answer:'La muestra aleatoria', distractors:['La de voluntarios siempre','Ambas garantizan exactamente el mismo resultado','Ninguna puede estudiar una población'], solution:'La selección aleatoria reduce la influencia de quién decide participar.' },
    { level:3, prompt:'¿Por qué aumentar el tamaño de una muestra sesgada no elimina necesariamente el sesgo?', answer:'Porque el método de selección sigue excluyendo o favoreciendo ciertos grupos', distractors:['Porque las muestras grandes nunca sirven','Porque el tamaño no influye jamás','Porque toda muestra grande se convierte en población'], solution:'Un gran tamaño mejora precisión, pero no corrige una selección sistemáticamente sesgada.' },
    { level:4, prompt:'Un municipio quiere estimar hábitos de lectura y encuesta solo en bibliotecas. ¿Qué mejora sería más adecuada?', answer:'Muestrear personas de distintos lugares y perfiles mediante un procedimiento planificado', distractors:['Duplicar únicamente el número de usuarios de biblioteca','Preguntar solo a bibliotecarios','Eliminar todas las respuestas distintas'], solution:'Diversificar el marco muestral reduce el sesgo ligado a acudir ya a bibliotecas.' },
    { level:4, prompt:'¿Qué diferencia hay entre error muestral y sesgo?', answer:'El error muestral varía por azar; el sesgo desplaza sistemáticamente los resultados', distractors:['Son exactamente lo mismo','El sesgo solo aparece en poblaciones pequeñas','El error muestral implica siempre fraude'], solution:'La variabilidad aleatoria y el error sistemático son problemas distintos.' },
  ],
  M14S02: [
    { level:1, prompt:'¿Qué tipo de variable es el color de ojos?', answer:'Cualitativa', distractors:['Cuantitativa discreta','Cuantitativa continua','Frecuencia acumulada'], solution:'El color de ojos describe categorías no numéricas.' },
    { level:1, prompt:'¿Qué tipo de variable es el número de hermanos?', answer:'Cuantitativa discreta', distractors:['Cualitativa','Cuantitativa continua','Nominal no numérica'], solution:'Es numérica y toma valores contables enteros.' },
    { level:2, prompt:'¿Qué tipo de variable es la estatura medida en centímetros con decimales?', answer:'Cuantitativa continua', distractors:['Cualitativa','Cuantitativa discreta','Ordinal exclusivamente'], solution:'Puede tomar valores dentro de un intervalo, no solo enteros aislados.' },
    { level:2, prompt:'La satisfacción se registra como baja, media o alta. ¿Qué tipo de variable es?', answer:'Cualitativa ordinal', distractors:['Cuantitativa continua','Cuantitativa discreta','Cualitativa sin ningún orden'], solution:'Las categorías no son cantidades, pero sí tienen un orden natural.' },
    { level:3, prompt:'Un código postal usa números. ¿Por qué no es una variable cuantitativa en sentido estadístico?', answer:'Porque los números funcionan como etiquetas, no como cantidades medibles', distractors:['Porque contiene demasiados dígitos','Porque toda variable numérica es continua','Porque solo puede tomar un valor'], solution:'Operar aritméticamente con códigos postales no tiene significado cuantitativo.' },
    { level:3, prompt:'La temperatura registrada con precisión decimal es una variable…', answer:'Cuantitativa continua', distractors:['Cualitativa nominal','Cuantitativa discreta','Cualitativa ordinal'], solution:'La temperatura puede asumir muchos valores dentro de intervalos.' },
    { level:4, prompt:'¿Por qué “curso escolar” puede tratarse como cualitativa ordinal aunque se escriba 1.º, 2.º, 3.º?', answer:'Porque los valores representan categorías ordenadas más que una medida aritmética', distractors:['Porque no existe orden entre cursos','Porque todo número ordinal es continuo','Porque curso escolar es siempre una frecuencia'], solution:'Hay orden, pero diferencias y operaciones aritméticas no tienen el mismo sentido que en una medida.' },
    { level:4, prompt:'Una variable registra tiempo de espera redondeado a minutos enteros. Conceptualmente, ¿qué es?', answer:'Continua aunque se haya registrado con redondeo', distractors:['Cualitativa por estar redondeada','Discreta por naturaleza necesariamente','Una frecuencia'], solution:'El tiempo puede variar continuamente; el redondeo afecta al registro, no a su naturaleza.' },
  ],
  M14S03: [
    { level:1, prompt:'En una encuesta, “bicicleta” aparece 7 veces. ¿Cuál es su frecuencia absoluta?', answer:'7', distractors:['1/7','70%','0'], solution:'La frecuencia absoluta cuenta cuántas veces aparece un valor.' },
    { level:1, prompt:'En 20 respuestas, 5 eligen “rojo”. ¿Cuál es su frecuencia relativa?', answer:'5/20 = 0,25', distractors:['5','15/20','0,75'], solution:'La frecuencia relativa es frecuencia absoluta dividida por el total.' },
    { level:2, prompt:'Las frecuencias absolutas son 4, 6 y 10. ¿Cuántos datos hay en total?', answer:'20', distractors:['10','16','24'], solution:'El total es 4 + 6 + 10 = 20.' },
    { level:2, prompt:'En una tabla de 50 datos, una categoría tiene frecuencia relativa 0,30. ¿Cuál es su frecuencia absoluta?', answer:'15', distractors:['30','20','5'], solution:'0,30 × 50 = 15.' },
    { level:3, prompt:'Las frecuencias acumuladas son 3, 8, 14 y 20. ¿Cuál es la frecuencia absoluta de la tercera categoría?', answer:'6', distractors:['14','8','11'], solution:'La tercera frecuencia absoluta es 14 - 8 = 6.' },
    { level:3, prompt:'Una categoría tiene frecuencia 12 de un total de 48. ¿Qué porcentaje representa?', answer:'25%', distractors:['12%','36%','48%'], solution:'12/48 = 0,25 = 25%.' },
    { level:4, prompt:'En una tabla, las frecuencias relativas suman 0,96. ¿Qué indica?', answer:'Probablemente hay un error o redondeos que deben revisarse', distractors:['La tabla es necesariamente perfecta','El total real es 96 datos','Las frecuencias nunca deben sumar 1'], solution:'Las frecuencias relativas deben sumar aproximadamente 1; una diferencia grande exige revisión.' },
    { level:4, prompt:'¿Qué ventaja ofrece la frecuencia relativa frente a la absoluta al comparar dos grupos de tamaños distintos?', answer:'Permite comparar proporciones independientemente del tamaño total', distractors:['Siempre produce números enteros','Elimina la necesidad de contar','Hace iguales todos los grupos'], solution:'Las proporciones permiten comparaciones justas entre muestras de diferente tamaño.' },
  ],
  M14S04: [
    { level:1, prompt:'¿Qué gráfico es adecuado para comparar frecuencias de categorías como deportes preferidos?', answer:'Gráfico de barras', distractors:['Histograma obligatorio','Diagrama de dispersión','Recta numérica'], solution:'Las barras separadas permiten comparar categorías.' },
    { level:1, prompt:'¿Qué gráfico muestra bien cómo se reparte un total en pocas categorías?', answer:'Gráfico de sectores', distractors:['Diagrama de dispersión','Histograma de una variable continua','Plano cartesiano sin datos'], solution:'Los sectores representan partes de un total.' },
    { level:2, prompt:'¿Qué gráfico conviene para una variable continua agrupada en intervalos?', answer:'Histograma', distractors:['Gráfico de barras con huecos como regla esencial','Pictograma únicamente','Diagrama de sectores siempre'], solution:'El histograma representa intervalos contiguos de una variable cuantitativa continua.' },
    { level:2, prompt:'Para mostrar cómo cambia la temperatura cada hora, ¿qué gráfico es especialmente útil?', answer:'Gráfico de líneas', distractors:['Gráfico de sectores','Pictograma sin eje temporal','Tabla sin ordenar'], solution:'Una línea permite observar evolución a lo largo del tiempo.' },
    { level:3, prompt:'Dos barras parecen muy distintas porque el eje vertical empieza en 95 en vez de 0. ¿Qué riesgo hay?', answer:'Exagerar visualmente diferencias pequeñas', distractors:['Hacer imposible leer cualquier número','Convertir datos cualitativos en continuos','Cambiar automáticamente las frecuencias reales'], solution:'Un eje truncado puede magnificar diferencias visuales.' },
    { level:3, prompt:'¿Qué gráfico usarías para estudiar relación entre horas de estudio y nota?', answer:'Diagrama de dispersión', distractors:['Gráfico de sectores','Pictograma','Histograma de una sola variable'], solution:'Dos variables cuantitativas pueden representarse mediante pares de puntos.' },
    { level:4, prompt:'Un gráfico de sectores usa ángulos que suman 330°. ¿Qué problema tiene?', answer:'No representa un círculo completo y está incompleto o mal calculado', distractors:['Es correcto porque basta superar 300°','Demuestra que faltan 330 datos','Los sectores no usan ángulos'], solution:'Los sectores de un círculo completo deben sumar 360°.' },
    { level:4, prompt:'¿Por qué un gráfico puede ser técnicamente correcto pero inducir a una interpretación engañosa?', answer:'Por escalas, recortes o diseño que alteran la percepción de las diferencias', distractors:['Porque los datos dejan de existir','Porque todo gráfico engaña','Porque los ejes nunca deben tener unidades'], solution:'La presentación visual influye en cómo se perciben datos aun sin cambiarlos.' },
  ],
  M14S05: [
    { level:1, prompt:'¿Cuál es la media de 4, 6 y 8?', answer:'6', distractors:['5','7','18'], solution:'(4 + 6 + 8) / 3 = 6.' },
    { level:1, prompt:'¿Cuál es la media de 10, 10, 20 y 20?', answer:'15', distractors:['10','20','60'], solution:'La suma es 60 y 60/4 = 15.' },
    { level:2, prompt:'Tres notas tienen media 7 y suman 21. Si añadimos una nota 9, ¿cuál es la nueva media?', answer:'7,5', distractors:['8','9','6'], solution:'(21 + 9) / 4 = 30/4 = 7,5.' },
    { level:2, prompt:'La media de cinco números es 12. ¿Cuál es su suma?', answer:'60', distractors:['17','48','12'], solution:'Suma = media × cantidad = 12 × 5 = 60.' },
    { level:3, prompt:'La media de cuatro valores es 8. Tres son 6, 7 y 9. ¿Cuál es el cuarto?', answer:'10', distractors:['8','12','6'], solution:'La suma total debe ser 32; 32 - (6 + 7 + 9) = 10.' },
    { level:3, prompt:'Un valor extremo muy alto se añade a un conjunto. ¿Qué suele ocurrir con la media?', answer:'Tiende a aumentar y puede quedar muy influida por ese extremo', distractors:['Siempre permanece igual','Se convierte en la mediana','Desaparece'], solution:'La media usa todos los valores y es sensible a extremos.' },
    { level:4, prompt:'Dos grupos tienen la misma media. ¿Significa que sus datos están distribuidos igual?', answer:'No, pueden tener distinta dispersión y forma', distractors:['Sí, necesariamente son idénticos','Sí, deben tener el mismo número de datos','No, porque la media nunca se calcula'], solution:'La media resume el centro, no toda la distribución.' },
    { level:4, prompt:'¿Cuándo puede ser poco representativa la media?', answer:'Cuando hay valores extremos o una distribución muy asimétrica', distractors:['Solo cuando todos los valores son iguales','Nunca, siempre es perfecta','Únicamente con dos datos'], solution:'Los extremos pueden desplazar la media lejos de la mayoría de observaciones.' },
  ],
  M14S06: [
    { level:1, prompt:'¿Cuál es la mediana de 2, 4, 7, 9, 12?', answer:'7', distractors:['4','9','6,8'], solution:'Con cinco datos ordenados, la mediana es el valor central.' },
    { level:1, prompt:'¿Cuál es la mediana de 3, 5, 8 y 10?', answer:'6,5', distractors:['5','8','26'], solution:'Con cuatro datos se promedian los dos centrales: (5 + 8)/2 = 6,5.' },
    { level:2, prompt:'Antes de calcular la mediana, ¿qué paso es esencial?', answer:'Ordenar los datos', distractors:['Sumarlos todos obligatoriamente','Multiplicarlos','Convertirlos en porcentajes'], solution:'La posición central solo tiene sentido una vez ordenados.' },
    { level:2, prompt:'En 9 datos ordenados, ¿en qué posición está la mediana?', answer:'Quinta', distractors:['Cuarta','Novena','Primera'], solution:'Con 9 datos, quedan 4 a cada lado del quinto.' },
    { level:3, prompt:'Si añadimos un valor extremadamente grande, ¿qué medida suele cambiar menos: media o mediana?', answer:'La mediana', distractors:['La media siempre','Cambian exactamente igual','Ninguna puede calcularse'], solution:'La mediana depende de posiciones centrales y es robusta frente a extremos.' },
    { level:3, prompt:'La mediana de 1, 4, x, 10, 12 es 7. Si los datos están ordenados, ¿cuánto vale x?', answer:'7', distractors:['4','10','12'], solution:'En cinco valores ordenados, el tercero es la mediana.' },
    { level:4, prompt:'Dos conjuntos tienen igual mediana. ¿Pueden tener medias distintas?', answer:'Sí, porque los valores alejados del centro pueden ser diferentes', distractors:['No, media y mediana siempre coinciden','Solo si tienen distinto nombre','No, la mediana determina todos los datos'], solution:'La mediana no fija los valores extremos ni, por tanto, la media.' },
    { level:4, prompt:'¿Qué medida de centro suele describir mejor salarios cuando unos pocos son extremadamente altos?', answer:'La mediana', distractors:['La media necesariamente','La suma total','La frecuencia absoluta del máximo'], solution:'La mediana es menos sensible a salarios extremos.' },
  ],
  M14S07: [
    { level:1, prompt:'¿Cuál es la moda de 2, 3, 3, 5, 7?', answer:'3', distractors:['2','5','7'], solution:'La moda es el valor que aparece con mayor frecuencia.' },
    { level:1, prompt:'En rojo, azul, azul, verde, azul, ¿cuál es la moda?', answer:'azul', distractors:['rojo','verde','No hay moda'], solution:'Azul aparece tres veces, más que las demás categorías.' },
    { level:2, prompt:'En 1, 1, 2, 2, 3, ¿qué ocurre con la moda?', answer:'Hay dos modas: 1 y 2', distractors:['La moda es 3','No puede haber dos modas','La moda es 1,5'], solution:'Dos valores comparten la frecuencia máxima.' },
    { level:2, prompt:'En 4, 5, 6, 7 todos aparecen una vez. ¿Qué podemos decir?', answer:'No hay una moda única', distractors:['La moda es 5,5','La moda es 4','La moda es 7'], solution:'Ningún valor aparece más que otro.' },
    { level:3, prompt:'¿Por qué la moda puede usarse con variables cualitativas?', answer:'Porque depende de cuál categoría es más frecuente, no de operaciones numéricas', distractors:['Porque todas las categorías tienen números','Porque exige calcular una media','Porque solo funciona con datos continuos'], solution:'Basta contar frecuencias de las categorías.' },
    { level:3, prompt:'Una tienda quiere saber qué talla vender más. ¿Qué medida es especialmente útil?', answer:'La moda', distractors:['La media de los nombres','La mediana de colores','La suma de etiquetas'], solution:'La moda identifica la categoría más frecuente.' },
    { level:4, prompt:'¿Puede haber tres modas en un conjunto?', answer:'Sí, si tres valores comparten la frecuencia máxima', distractors:['No, siempre hay exactamente una','Solo en datos continuos','Solo si la media es cero'], solution:'Una distribución puede ser multimodal.' },
    { level:4, prompt:'¿Qué limitación tiene resumir un conjunto solo con la moda?', answer:'Puede ignorar gran parte de la distribución y no ser única', distractors:['Siempre coincide con la media','Nunca existe en datos cualitativos','Obliga a ordenar numéricamente categorías'], solution:'La moda informa sobre el valor más frecuente, pero no describe el resto de la distribución.' },
  ],
  M15S01: [
    { level:1, prompt:'Lanzar una moneda y observar cara o cruz es un experimento…', answer:'Aleatorio', distractors:['Determinista','Imposible','Sin resultados'], solution:'No puede predecirse con certeza qué resultado concreto aparecerá.' },
    { level:1, prompt:'¿Cuál es un experimento aleatorio?', answer:'Lanzar un dado y anotar el resultado', distractors:['Sumar 2 + 3','Medir exactamente 1 metro definido','Escribir la fecha de hoy'], solution:'El resultado del dado no se conoce con certeza antes de lanzarlo.' },
    { level:2, prompt:'¿Cuál es el espacio muestral al lanzar una moneda una vez?', answer:'{cara, cruz}', distractors:['{cara}','{1,2,3,4,5,6}','{sí,no,quizá}'], solution:'Son todos los resultados posibles del experimento.' },
    { level:2, prompt:'Al lanzar un dado de seis caras, ¿cuántos resultados elementales posibles hay?', answer:'6', distractors:['2','3','12'], solution:'El espacio muestral es {1,2,3,4,5,6}.' },
    { level:3, prompt:'Se extrae una bola, se devuelve y se repite. ¿Por qué los dos ensayos pueden considerarse en las mismas condiciones?', answer:'Porque la devolución restaura la composición inicial', distractors:['Porque garantiza repetir el mismo color','Porque elimina el azar','Porque reduce el espacio muestral a uno'], solution:'Con reposición, las probabilidades vuelven a ser las mismas en cada extracción.' },
    { level:3, prompt:'¿Qué diferencia hay entre experimento determinista y aleatorio?', answer:'En el aleatorio no se conoce con certeza el resultado concreto aunque se conozcan los posibles', distractors:['El determinista no tiene resultado','El aleatorio no tiene espacio muestral','Son exactamente iguales'], solution:'El azar afecta a cuál de los resultados posibles ocurre.' },
    { level:4, prompt:'¿Por qué repetir muchas veces un experimento aleatorio es útil?', answer:'Permite estudiar patrones de frecuencia aunque cada ensayo sea incierto', distractors:['Hace que cada resultado futuro sea seguro','Elimina todos los resultados posibles menos uno','Convierte el experimento en determinista'], solution:'La regularidad estadística emerge en repeticiones, no en la certeza de cada ensayo.' },
    { level:4, prompt:'Un dado está trucado. ¿Sigue siendo aleatorio lanzarlo?', answer:'Sí, aunque los resultados no sean equiprobables', distractors:['No, porque aleatorio significa equiprobable','No, porque solo puede salir un número','Sí, y todas las caras siguen teniendo exactamente la misma probabilidad'], solution:'Aleatoriedad no implica necesariamente probabilidades iguales.' },
  ],
  M15S02: [
    { level:1, prompt:'Al lanzar un dado, “obtener un número par” es un…', answer:'Suceso', distractors:['Espacio muestral completo necesariamente','Experimento determinista','Dato imposible de definir'], solution:'Un suceso es un conjunto de resultados del espacio muestral.' },
    { level:1, prompt:'Al lanzar un dado, ¿qué resultados forman el suceso “mayor que 4”?', answer:'{5, 6}', distractors:['{4, 5}','{1, 2, 3, 4}','{6}'], solution:'Los resultados mayores que 4 son 5 y 6.' },
    { level:2, prompt:'¿Qué es un suceso seguro al lanzar un dado estándar?', answer:'Obtener un número del 1 al 6', distractors:['Obtener 7','Obtener siempre 6','Obtener un número mayor que 3'], solution:'Todo resultado posible pertenece al conjunto 1-6.' },
    { level:2, prompt:'¿Qué es un suceso imposible al lanzar una moneda?', answer:'Obtener un 3', distractors:['Obtener cara','Obtener cruz','Obtener cara o cruz'], solution:'El 3 no pertenece al espacio muestral de una moneda.' },
    { level:3, prompt:'Al lanzar un dado, A = “par” y B = “mayor que 3”. ¿Qué resultados pertenecen a A y B a la vez?', answer:'{4, 6}', distractors:['{2, 4, 6}','{4, 5, 6}','{2, 5}'], solution:'La intersección de {2,4,6} y {4,5,6} es {4,6}.' },
    { level:3, prompt:'Al lanzar un dado, ¿cuál es el complementario de “obtener 1 o 2”?', answer:'{3, 4, 5, 6}', distractors:['{1, 2}','{2, 3}','{1, 6}'], solution:'El complementario contiene los resultados del espacio muestral que no están en el suceso.' },
    { level:4, prompt:'Dos sucesos son incompatibles si…', answer:'No pueden ocurrir a la vez en un mismo ensayo', distractors:['Tienen siempre la misma probabilidad','Contienen todos los resultados','Uno contiene necesariamente al otro'], solution:'Su intersección es vacía.' },
    { level:4, prompt:'¿Qué diferencia hay entre suceso elemental y compuesto?', answer:'El elemental contiene un resultado; el compuesto contiene varios', distractors:['El compuesto es siempre imposible','El elemental contiene todo el espacio','No existe diferencia'], solution:'La distinción depende del número de resultados elementales que incluye.' },
  ],
  M15S03: [
    { level:1, prompt:'En una bolsa hay 3 bolas rojas y 2 azules. Para sacar roja, ¿cuántos casos favorables hay?', answer:'3', distractors:['2','5','1'], solution:'Hay tres resultados favorables asociados a bolas rojas de las cinco posibles.' },
    { level:1, prompt:'Un dado tiene 6 caras. ¿Cuántos casos posibles hay al lanzarlo?', answer:'6', distractors:['1','3','12'], solution:'Cada cara representa un resultado posible.' },
    { level:2, prompt:'Al lanzar un dado, ¿cuántos casos favorables tiene el suceso “múltiplo de 3”?', answer:'2', distractors:['1','3','6'], solution:'Los múltiplos de 3 son 3 y 6.' },
    { level:2, prompt:'Al elegir una letra de la palabra CASA, contando posiciones, ¿cuántos casos favorables hay para obtener A?', answer:'2', distractors:['1','3','4'], solution:'A aparece en dos de las cuatro posiciones.' },
    { level:3, prompt:'Se lanzan dos monedas. ¿Cuántos resultados ordenados posibles hay?', answer:'4', distractors:['2','3','8'], solution:'Son CC, CX, XC y XX.' },
    { level:3, prompt:'Al lanzar dos dados, ¿cuántos pares ordenados posibles hay?', answer:'36', distractors:['12','6','18'], solution:'Hay 6 posibilidades para cada dado: 6 × 6 = 36.' },
    { level:4, prompt:'Al lanzar dos dados, ¿cuántos casos favorables hay para que la suma sea 7?', answer:'6', distractors:['7','5','12'], solution:'Los pares son (1,6),(2,5),(3,4),(4,3),(5,2),(6,1).' },
    { level:4, prompt:'Una ruleta tiene sectores iguales numerados 1 a 8. ¿Cuántos casos favorables hay para obtener primo?', answer:'4', distractors:['3','5','8'], solution:'Los primos entre 1 y 8 son 2, 3, 5 y 7.' },
  ],
  M15S04: [
    { level:1, prompt:'En una moneda equilibrada, ¿cuál es la probabilidad de cara?', answer:'1/2', distractors:['1','1/3','2'], solution:'Hay un caso favorable entre dos resultados equiprobables.' },
    { level:1, prompt:'En un dado equilibrado, ¿cuál es la probabilidad de sacar un 6?', answer:'1/6', distractors:['1/2','1/3','6'], solution:'Hay un resultado favorable entre seis posibles equiprobables.' },
    { level:2, prompt:'En un dado, ¿cuál es la probabilidad de obtener número par?', answer:'3/6 = 1/2', distractors:['2/6','1/6','4/6'], solution:'Los pares son 2, 4 y 6: tres casos de seis.' },
    { level:2, prompt:'En una bolsa con 4 rojas y 6 azules, ¿cuál es la probabilidad de roja?', answer:'4/10 = 2/5', distractors:['6/10','4/6','1/4'], solution:'Hay 4 casos favorables de 10 posibles.' },
    { level:3, prompt:'Si P(A)=0,30, ¿cuál es P(no A)?', answer:'0,70', distractors:['0,30','1,30','0'], solution:'La probabilidad del complementario es 1 - 0,30 = 0,70.' },
    { level:3, prompt:'Una ruleta tiene 8 sectores iguales y 3 son verdes. ¿Cuál es la probabilidad de no verde?', answer:'5/8', distractors:['3/8','1/8','8/5'], solution:'Cinco sectores no son verdes de ocho en total.' },
    { level:4, prompt:'Dos monedas equilibradas se lanzan. ¿Probabilidad de obtener exactamente una cara?', answer:'2/4 = 1/2', distractors:['1/4','3/4','1'], solution:'Los resultados favorables son cara-cruz y cruz-cara de cuatro posibles.' },
    { level:4, prompt:'Al lanzar dos dados, ¿probabilidad de suma 7?', answer:'6/36 = 1/6', distractors:['7/36','1/12','6/12'], solution:'Hay seis pares favorables de 36 pares equiprobables.' },
  ],
}

const FRAMES = [
  (prompt:string) => prompt,
  (prompt:string) => `Analiza los datos: ${prompt}`,
  (prompt:string) => `Reto de estadística y azar: ${prompt}`,
  (prompt:string) => `Razona antes de responder: ${prompt}`,
] as const

function rotate<T>(items:T[], shift:number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

export function generateMathStatsProbabilityLongTermVariant(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
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
    tags: [skill.generator_key, 'math', 'stats_probability_course_depth'],
  }
}

export function mathStatsProbabilityVariantCount(skillId:string) {
  return (BANK[skillId]?.length ?? 0) * FRAMES.length
}

export function mathStatsProbabilitySkillIds() {
  return Object.keys(BANK)
}
