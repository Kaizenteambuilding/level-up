import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }
type Card = { level: number; prompt: string; answer: string; distractors: [string,string,string]; solution: string }

const BANK: Record<string, Card[]> = {
  M01S02: [
    { level:1, prompt:'¿Cuál es mayor: 4 307 o 4 370?', answer:'4 370', distractors:['4 307','Son iguales','No se pueden comparar'], solution:'Miles y centenas coinciden; en las decenas, 7 > 0.' },
    { level:1, prompt:'Ordena de menor a mayor: 125, 152, 215.', answer:'125 < 152 < 215', distractors:['215 < 152 < 125','152 < 125 < 215','125 < 215 < 152'], solution:'Comparamos primero centenas y después decenas y unidades.' },
    { level:2, prompt:'¿Qué número está entre 6 499 y 6 501?', answer:'6 500', distractors:['6 498','6 502','6 510'], solution:'6 500 es el entero consecutivo entre ambos.' },
    { level:2, prompt:'¿Cuál es el menor: 90 005, 89 999, 90 050, 90 500?', answer:'89 999', distractors:['90 005','90 050','90 500'], solution:'89 999 tiene menos decenas de millar que los demás.' },
    { level:3, prompt:'Completa con el signo correcto: 305 090 __ 305 009.', answer:'>', distractors:['<','=','≤'], solution:'Coinciden hasta las centenas; 90 es mayor que 9 en las dos últimas posiciones.' },
    { level:3, prompt:'¿Qué afirmación es cierta sobre 72 410 y 72 401?', answer:'72 410 es 9 unidades mayor', distractors:['72 401 es 9 unidades mayor','Son consecutivos','Difieren en 90 unidades'], solution:'72 410 - 72 401 = 9.' },
    { level:4, prompt:'Si A está entre 48 990 y 49 010 y es múltiplo de 10, ¿qué valor puede ser A?', answer:'49 000', distractors:['48 995','49 005','49 011'], solution:'49 000 está en el intervalo y termina en 0.' },
    { level:4, prompt:'¿Qué número ocupa la tercera posición al ordenar 15 050, 15 500, 15 005 y 15 055 de menor a mayor?', answer:'15 055', distractors:['15 005','15 050','15 500'], solution:'El orden es 15 005, 15 050, 15 055, 15 500.' },
  ],
  M01S03: [
    { level:1, prompt:'Calcula 348 + 275.', answer:'623', distractors:['613','633','523'], solution:'348 + 275 = 623.' },
    { level:1, prompt:'Calcula 700 - 286.', answer:'414', distractors:['424','514','386'], solution:'700 - 286 = 414.' },
    { level:2, prompt:'Una biblioteca tenía 1 250 libros y recibe 375. ¿Cuántos tiene ahora?', answer:'1 625', distractors:['1 575','875','1 725'], solution:'1 250 + 375 = 1 625.' },
    { level:2, prompt:'En un depósito había 2 000 litros y se usan 685. ¿Cuántos quedan?', answer:'1 315', distractors:['1 415','1 325','685'], solution:'2 000 - 685 = 1 315.' },
    { level:3, prompt:'Completa: 4 820 + ___ = 7 000.', answer:'2 180', distractors:['2 280','3 180','1 180'], solution:'7 000 - 4 820 = 2 180.' },
    { level:3, prompt:'La diferencia entre dos números es 945. Si el mayor es 3 200, ¿cuál es el menor?', answer:'2 255', distractors:['2 345','4 145','2 155'], solution:'3 200 - 945 = 2 255.' },
    { level:4, prompt:'Un museo recibe 1 480 visitantes el sábado y 1 735 el domingo. Si 925 eran menores, ¿cuántos adultos hubo?', answer:'2 290', distractors:['2 190','3 215','1 365'], solution:'Total 3 215; adultos = 3 215 - 925 = 2 290.' },
    { level:4, prompt:'Calcula mentalmente 9 999 + 2 006.', answer:'12 005', distractors:['11 005','12 105','11 995'], solution:'10 000 + 2 006 - 1 = 12 005.' },
  ],
  M01S04: [
    { level:1, prompt:'Calcula 24 × 6.', answer:'144', distractors:['124','134','164'], solution:'24 × 6 = 144.' },
    { level:1, prompt:'Calcula 156 ÷ 12.', answer:'13', distractors:['12','14','18'], solution:'12 × 13 = 156.' },
    { level:2, prompt:'Hay 8 cajas con 35 lápices cada una. ¿Cuántos lápices hay?', answer:'280', distractors:['270','43','350'], solution:'8 × 35 = 280.' },
    { level:2, prompt:'Se reparten 432 cromos entre 16 personas por igual. ¿Cuántos recibe cada una?', answer:'27', distractors:['26','28','32'], solution:'432 ÷ 16 = 27.' },
    { level:3, prompt:'¿Qué número falta? 48 × ___ = 1 248.', answer:'26', distractors:['24','28','36'], solution:'1 248 ÷ 48 = 26.' },
    { level:3, prompt:'Una fábrica empaqueta 1 575 piezas en cajas de 25. ¿Cuántas cajas completas necesita?', answer:'63', distractors:['53','73','62'], solution:'1 575 ÷ 25 = 63.' },
    { level:4, prompt:'Un autocar hace 18 viajes con 46 pasajeros completos en cada viaje. ¿Cuántos desplazamientos de pasajeros suma?', answer:'828', distractors:['818','864','738'], solution:'18 × 46 = 828.' },
    { level:4, prompt:'Se colocan 2 304 baldosas en filas de 48. ¿Cuántas filas se forman?', answer:'48', distractors:['46','52','96'], solution:'2 304 ÷ 48 = 48.' },
  ],
  M01S05: [
    { level:1, prompt:'Calcula 6 + 3 × 4.', answer:'18', distractors:['36','24','15'], solution:'Primero 3 × 4 = 12; después 6 + 12 = 18.' },
    { level:1, prompt:'Calcula (6 + 3) × 4.', answer:'36', distractors:['18','24','13'], solution:'Primero el paréntesis: 9 × 4 = 36.' },
    { level:2, prompt:'Calcula 40 - 18 ÷ 3.', answer:'34', distractors:['22','28','6'], solution:'18 ÷ 3 = 6 y 40 - 6 = 34.' },
    { level:2, prompt:'Calcula 5 × (12 - 7) + 3.', answer:'28', distractors:['40','20','32'], solution:'12 - 7 = 5; 5 × 5 = 25; 25 + 3 = 28.' },
    { level:3, prompt:'Calcula 72 ÷ (3 × 4) + 5.', answer:'11', distractors:['9','29','23'], solution:'3 × 4 = 12; 72 ÷ 12 = 6; 6 + 5 = 11.' },
    { level:3, prompt:'¿Qué expresión vale 26?', answer:'2 × (8 + 5)', distractors:['2 × 8 + 5','30 - 2 × 5','4 + 3 × 6'], solution:'2 × 13 = 26.' },
    { level:4, prompt:'Calcula 100 - [6 × (9 + 3) - 20].', answer:'48', distractors:['8','72','52'], solution:'9+3=12; 6×12=72; 72-20=52; 100-52=48.' },
    { level:4, prompt:'Calcula (84 ÷ 7 + 5) × 3 - 9.', answer:'42', distractors:['36','48','51'], solution:'84÷7=12; +5=17; ×3=51; -9=42.' },
  ],
  M02S01: [
    { level:1, prompt:'¿Qué significa 3⁴?', answer:'3 × 3 × 3 × 3', distractors:['3 × 4','4 × 4 × 4','3 + 3 + 3 + 3'], solution:'La base 3 se multiplica por sí misma cuatro veces.' },
    { level:1, prompt:'En 5³, ¿cuál es la base?', answer:'5', distractors:['3','15','125'], solution:'La base es el número que se repite como factor.' },
    { level:2, prompt:'En 7², ¿qué indica el exponente 2?', answer:'Que 7 aparece dos veces como factor', distractors:['Que se suma 2 a 7','Que la base es 2','Que el resultado es 14'], solution:'El exponente cuenta cuántas veces se usa la base como factor.' },
    { level:2, prompt:'¿Qué potencia representa 2 × 2 × 2 × 2 × 2?', answer:'2⁵', distractors:['5²','2⁴','10²'], solution:'Hay cinco factores iguales a 2.' },
    { level:3, prompt:'¿Cuál de estas expresiones equivale a 10⁴?', answer:'10 000', distractors:['40','1 000','100 000'], solution:'10⁴ = 10 × 10 × 10 × 10 = 10 000.' },
    { level:3, prompt:'¿Qué potencia tiene base 4 y valor 64?', answer:'4³', distractors:['4²','3⁴','8²'], solution:'4 × 4 × 4 = 64.' },
    { level:4, prompt:'Si a⁵ = a × a × a × a × a, ¿qué representa a⁶?', answer:'a⁵ × a', distractors:['a⁵ + a','6a','a⁵ × 6'], solution:'Aumentar el exponente en uno añade un factor a.' },
    { level:4, prompt:'¿Qué afirmación sobre 1ⁿ es correcta para n natural positivo?', answer:'Siempre vale 1', distractors:['Siempre vale n','Siempre vale 0','Siempre vale 2'], solution:'Multiplicar unos entre sí sigue dando 1.' },
  ],
  M02S02: [
    { level:1, prompt:'Calcula 2⁵.', answer:'32', distractors:['10','25','64'], solution:'2 × 2 × 2 × 2 × 2 = 32.' },
    { level:1, prompt:'Calcula 6².', answer:'36', distractors:['12','18','216'], solution:'6 × 6 = 36.' },
    { level:2, prompt:'Calcula 3⁴.', answer:'81', distractors:['12','64','27'], solution:'3 × 3 × 3 × 3 = 81.' },
    { level:2, prompt:'Calcula 5³.', answer:'125', distractors:['15','25','625'], solution:'5 × 5 × 5 = 125.' },
    { level:3, prompt:'¿Cuál es mayor: 2⁶ o 4²?', answer:'2⁶', distractors:['4²','Son iguales','No se pueden comparar'], solution:'2⁶ = 64 y 4² = 16.' },
    { level:3, prompt:'Calcula 10⁵ ÷ 10³.', answer:'100', distractors:['10','1 000','10 000'], solution:'100 000 ÷ 1 000 = 100.' },
    { level:4, prompt:'Calcula 2³ × 3².', answer:'72', distractors:['36','48','144'], solution:'2³=8 y 3²=9; 8×9=72.' },
    { level:4, prompt:'Si 4³ = 64, ¿cuánto vale 4⁴?', answer:'256', distractors:['128','68','1 024'], solution:'4⁴ = 4³ × 4 = 64 × 4 = 256.' },
  ],
  M03S04: [
    { level:1, prompt:'¿Cuál de estos números es primo?', answer:'13', distractors:['12','15','21'], solution:'13 solo tiene divisores 1 y 13.' },
    { level:1, prompt:'¿Cuál de estos números es compuesto?', answer:'18', distractors:['11','13','17'], solution:'18 tiene divisores distintos de 1 y de sí mismo, por ejemplo 2 y 3.' },
    { level:2, prompt:'¿Por qué 29 es primo?', answer:'Solo es divisible entre 1 y 29', distractors:['Porque es impar','Porque termina en 9','Porque es mayor que 20'], solution:'La definición de primo exige exactamente dos divisores positivos.' },
    { level:2, prompt:'¿Cuál es la descomposición en factores primos de 24?', answer:'2³ × 3', distractors:['2 × 12','4 × 6','3 × 8'], solution:'24 = 2 × 2 × 2 × 3.' },
    { level:3, prompt:'¿Cuál es el menor número primo mayor que 30?', answer:'31', distractors:['32','33','35'], solution:'31 no es divisible por 2, 3 ni 5 y es primo.' },
    { level:3, prompt:'¿Cuántos divisores positivos tiene un número primo?', answer:'2', distractors:['1','3','Infinitos'], solution:'Son 1 y el propio número.' },
    { level:4, prompt:'Si n > 1 no es primo, ¿qué podemos afirmar?', answer:'Puede escribirse como producto de enteros positivos menores que n', distractors:['Debe ser impar','Debe terminar en 0','Solo tiene dos divisores'], solution:'Un número compuesto posee una factorización no trivial.' },
    { level:4, prompt:'¿Por qué 1 no se considera primo?', answer:'Porque tiene un solo divisor positivo', distractors:['Porque es impar','Porque no es natural','Porque es divisible entre 2'], solution:'Los primos tienen exactamente dos divisores positivos distintos.' },
  ],
  M04S01: [
    { level:1, prompt:'Una temperatura de 5 °C bajo cero se representa como…', answer:'-5 °C', distractors:['5 °C','+5 °C','0 °C'], solution:'Los valores bajo cero se representan con enteros negativos.' },
    { level:1, prompt:'Un ascensor está en la planta -2. ¿Qué significa?', answer:'Dos plantas por debajo de la planta 0', distractors:['Dos plantas por encima','En la planta 2 positiva','Fuera del edificio'], solution:'El signo negativo indica posición por debajo del nivel de referencia.' },
    { level:2, prompt:'¿Cuál está más a la derecha en la recta numérica: -3 o 2?', answer:'2', distractors:['-3','Están en el mismo punto','Depende de la escala'], solution:'Los números mayores se sitúan más a la derecha.' },
    { level:2, prompt:'¿Qué número representa una deuda de 40 €?', answer:'-40', distractors:['40','0','+4'], solution:'Una deuda puede modelarse como cantidad negativa respecto a saldo cero.' },
    { level:3, prompt:'Ordena de menor a mayor: -7, 3, -2, 0.', answer:'-7 < -2 < 0 < 3', distractors:['3 < 0 < -2 < -7','-2 < -7 < 0 < 3','0 < -2 < -7 < 3'], solution:'Entre negativos, el de mayor valor absoluto es menor.' },
    { level:3, prompt:'¿Qué entero tiene valor absoluto 6 y es menor que 0?', answer:'-6', distractors:['6','0','-5'], solution:'Los enteros con valor absoluto 6 son ±6; el negativo es -6.' },
    { level:4, prompt:'Un submarino está a -120 m y asciende hasta -45 m. ¿Qué cambio de altura realiza?', answer:'+75 m', distractors:['-75 m','+165 m','-165 m'], solution:'-45 - (-120) = 75.' },
    { level:4, prompt:'Si A < 0 y |A| = 18, ¿cuánto vale A?', answer:'-18', distractors:['18','0','-1'], solution:'El valor absoluto 18 corresponde a ±18; la condición A<0 selecciona -18.' },
  ],
  M07S03: [
    { level:1, prompt:'Simplifica 6/8.', answer:'3/4', distractors:['2/3','6/4','4/6'], solution:'Dividimos numerador y denominador entre 2.' },
    { level:1, prompt:'Simplifica 10/15.', answer:'2/3', distractors:['5/10','3/5','1/2'], solution:'Dividimos ambos términos entre 5.' },
    { level:2, prompt:'¿Cuál es la fracción irreducible equivalente a 18/24?', answer:'3/4', distractors:['6/8','9/12','2/3'], solution:'El MCD de 18 y 24 es 6; 18/24 = 3/4.' },
    { level:2, prompt:'¿Por qué 7/12 ya es irreducible?', answer:'Porque 7 y 12 no tienen divisores comunes mayores que 1', distractors:['Porque el numerador es menor','Porque 12 es par','Porque toda fracción con 7 es irreducible'], solution:'MCD(7,12)=1.' },
    { level:3, prompt:'Simplifica completamente 42/56.', answer:'3/4', distractors:['21/28','6/8','7/9'], solution:'MCD(42,56)=14; al dividir obtenemos 3/4.' },
    { level:3, prompt:'¿Por qué dividir numerador y denominador por el mismo número no nulo conserva el valor?', answer:'Porque se divide la fracción por una forma de 1', distractors:['Porque cambia numerador solamente','Porque toda división aumenta la fracción','Porque denominador y numerador se vuelven iguales'], solution:'(a÷k)/(b÷k) = a/b cuando k divide ambos y k≠0.' },
    { level:4, prompt:'Una fracción se simplifica por 3 y después por 5 hasta 4/7. ¿Cuál podía ser la original?', answer:'60/105', distractors:['20/35','12/21','4/35'], solution:'Multiplicando 4/7 por 15/15 obtenemos 60/105.' },
    { level:4, prompt:'Simplifica 84/126 usando su máximo común divisor.', answer:'2/3', distractors:['4/6','14/21','3/4'], solution:'MCD(84,126)=42; 84÷42=2 y 126÷42=3.' },
  ],
  M08S02: [
    { level:1, prompt:'Si 2 cuadernos cuestan 6 €, ¿4 cuadernos al mismo precio cuestan 12 €? ¿Hay proporcionalidad directa?', answer:'Sí', distractors:['No','Solo si cambian de precio','No se puede saber'], solution:'Al duplicar cantidad se duplica coste: razón constante 3 €/cuaderno.' },
    { level:1, prompt:'¿Qué relación es de proporcionalidad directa?', answer:'Kilogramos comprados y precio total con precio por kg fijo', distractors:['Edad de una persona y talla de zapato','Número de alumnos y temperatura exterior','Hora del día y número de páginas de un libro'], solution:'Con precio unitario fijo, multiplicar kg multiplica el precio por el mismo factor.' },
    { level:2, prompt:'En una tabla x: 2,4,6; y: 5,10,15. ¿Es proporcional directa?', answer:'Sí, y/x = 2,5 siempre', distractors:['No, porque y no es igual a x','No, porque hay tres pares','Sí, porque x+y es constante'], solution:'La razón y/x es constante en todos los pares.' },
    { level:2, prompt:'x: 1,2,3; y: 4,8,13. ¿Hay proporcionalidad directa?', answer:'No', distractors:['Sí, razón 4','Sí, porque ambas crecen','Sí, razón 13'], solution:'Las razones son 4, 4 y 13/3; no son constantes.' },
    { level:3, prompt:'Si y = 7x, ¿qué ocurre con y cuando x se triplica?', answer:'y también se triplica', distractors:['y aumenta 7 unidades','y se divide entre 3','y no cambia'], solution:'En proporcionalidad directa, ambas magnitudes cambian por el mismo factor.' },
    { level:3, prompt:'Una tarifa cobra 5 € fijos más 2 € por km. ¿Es proporcional directa distancia-precio?', answer:'No, porque hay un término fijo de 5 €', distractors:['Sí, razón 2 siempre','Sí, porque el precio aumenta','No, porque usa euros'], solution:'En proporcionalidad directa, a distancia 0 correspondería precio 0 y la razón sería constante.' },
    { level:4, prompt:'Si dos magnitudes son directamente proporcionales y y=18 cuando x=6, ¿cuál es la constante?', answer:'3', distractors:['12','24','1/3'], solution:'k = y/x = 18/6 = 3.' },
    { level:4, prompt:'¿Qué propiedad gráfica caracteriza y = kx?', answer:'Su gráfica es una recta que pasa por el origen', distractors:['Siempre es horizontal','Nunca pasa por el origen','Es una circunferencia'], solution:'Para x=0 se obtiene y=0 y la pendiente es k.' },
  ],
  M10S01: [
    { level:1, prompt:'¿Qué objeto geométrico tiene una sola posición y no longitud?', answer:'Punto', distractors:['Recta','Segmento','Semirrecta'], solution:'Un punto indica posición sin dimensión lineal.' },
    { level:1, prompt:'¿Qué parte de una recta está limitada por dos extremos?', answer:'Segmento', distractors:['Punto','Recta','Semirrecta'], solution:'Un segmento tiene dos extremos definidos.' },
    { level:2, prompt:'¿Qué objeto tiene un origen y se prolonga indefinidamente en una dirección?', answer:'Semirrecta', distractors:['Segmento','Punto','Circunferencia'], solution:'La semirrecta comienza en un punto y no tiene fin en el otro sentido.' },
    { level:2, prompt:'Dos puntos distintos determinan…', answer:'Una única recta', distractors:['Dos rectas paralelas','Ninguna recta','Infinitas circunferencias como respuesta única'], solution:'Por dos puntos distintos pasa exactamente una recta.' },
    { level:3, prompt:'Si B está entre A y C en una misma recta, ¿qué relación cumplen las longitudes?', answer:'AB + BC = AC', distractors:['AB × BC = AC','AB = BC siempre','AC = AB - BC siempre'], solution:'La longitud total del segmento AC es suma de sus partes consecutivas.' },
    { level:3, prompt:'¿Qué diferencia esencial hay entre recta y segmento?', answer:'La recta se prolonga indefinidamente; el segmento tiene dos extremos', distractors:['La recta tiene dos extremos','El segmento no tiene longitud','Son exactamente lo mismo'], solution:'Sus límites son distintos: una es infinita y el otro finito.' },
    { level:4, prompt:'Tres puntos A, B y C no alineados, ¿cuántas rectas distintas determinan por parejas?', answer:'3', distractors:['1','2','6'], solution:'Las parejas AB, AC y BC determinan tres rectas distintas.' },
    { level:4, prompt:'Si M es punto medio de AB y AB mide 18 cm, ¿cuánto mide AM?', answer:'9 cm', distractors:['18 cm','6 cm','36 cm'], solution:'El punto medio divide el segmento en dos partes iguales.' },
  ],
}

const FRAMES = [
  (prompt:string) => prompt,
  (prompt:string) => `Reto matemático: ${prompt}`,
  (prompt:string) => `Razona y elige la respuesta correcta: ${prompt}`,
  (prompt:string) => `Aplica la idea matemática adecuada: ${prompt}`,
] as const

function rotate<T>(items:T[], shift:number) {
  const offset = ((shift % items.length) + items.length) % items.length
  return items.slice(offset).concat(items.slice(0, offset))
}

export function generateMathCoreLongTermVariant(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
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
    tags: [skill.generator_key, 'math', 'math_core_course_depth'],
  }
}

export function mathCoreLongTermSkillIds() { return Object.keys(BANK) }
export function mathCoreLongTermVariantCount(skillId:string) { return (BANK[skillId]?.length ?? 0) * FRAMES.length }
