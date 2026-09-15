import type { GeneratedQuestion } from './firstEvaluationGenerators'

type SkillMeta = { id: string; name: string; generator_key: string }

const DISCRETE = ['hermanos', 'libros prestados', 'goles', 'mascotas', 'mensajes', 'visitas', 'piezas recicladas', 'faltas']
const CONTINUOUS = ['estatura', 'masa', 'temperatura', 'tiempo', 'distancia', 'volumen', 'longitud', 'velocidad']
const NOMINAL = ['color favorito', 'medio de transporte', 'deporte preferido', 'provincia de nacimiento', 'tipo de desayuno', 'género musical', 'idioma familiar', 'ruta habitual']
const ORDINAL = ['satisfacción', 'nivel de esfuerzo', 'grado de acuerdo', 'nivel de riesgo', 'prioridad', 'calidad percibida', 'dificultad', 'frecuencia declarada']
const SETTINGS = ['una clase', 'un club', 'una biblioteca', 'un campamento', 'una academia', 'un torneo', 'un museo', 'un centro juvenil']

function pick<T>(items: T[], seed: number, shift = 0) { return items[(seed + shift) % items.length] }
function rotate<T>(items: T[], shift: number) { const n=((shift%items.length)+items.length)%items.length; return items.slice(n).concat(items.slice(0,n)) }

export function generateMathStatsVariableDepth(skill: SkillMeta, difficulty: number, seed: number): GeneratedQuestion | null {
  if (skill.id !== 'M14S02') return null
  const n = seed >>> 0
  const family = n % 12
  const discrete = pick(DISCRETE,n)
  const continuous = pick(CONTINUOUS,n,2)
  const nominal = pick(NOMINAL,n,4)
  const ordinal = pick(ORDINAL,n,6)
  const setting = pick(SETTINGS,n,1)
  let prompt = ''
  let answer = ''
  let distractors: [string,string,string]
  let solution = ''

  if (family === 0) { prompt=`En ${setting}, se registra “${nominal}”. ¿Qué tipo de variable es?`; answer='Cualitativa nominal'; distractors=['Cuantitativa discreta','Cuantitativa continua','Cualitativa ordinal']; solution='Describe categorías sin una cantidad numérica ni un orden necesario.' }
  else if (family === 1) { prompt=`En ${setting}, se cuenta el número de ${discrete}. ¿Qué tipo de variable resulta?`; answer='Cuantitativa discreta'; distractors=['Cualitativa nominal','Cuantitativa continua','Cualitativa ordinal']; solution='Un conteo toma valores separados y normalmente enteros.' }
  else if (family === 2) { prompt=`En ${setting}, se mide ${continuous} con decimales. ¿Cómo se clasifica?`; answer='Cuantitativa continua'; distractors=['Cuantitativa discreta','Cualitativa nominal','Cualitativa ordinal']; solution='Una medición puede tomar numerosos valores dentro de un intervalo.' }
  else if (family === 3) { prompt=`Una encuesta de ${setting} registra ${ordinal} como bajo, medio o alto. ¿Qué variable es?`; answer='Cualitativa ordinal'; distractors=['Cualitativa nominal','Cuantitativa discreta','Cuantitativa continua']; solution='Las categorías tienen un orden natural, pero no son una medida numérica.' }
  else if (family === 4) { const code=100+(n%900); prompt=`En ${setting}, el código ${code} identifica a una persona. ¿Por qué el código no es una variable cuantitativa?`; answer='Porque el número funciona como etiqueta'; distractors=['Porque tiene tres cifras','Porque todo número es continuo','Porque no puede repetirse']; solution='El valor identifica, pero no representa una cantidad sobre la que tenga sentido operar.' }
  else if (family === 5) { prompt=`Se redondea ${continuous} al entero más cercano en ${setting}. ¿Qué ocurre con su naturaleza?`; answer='Sigue siendo continua'; distractors=['Pasa a ser cualitativa','Pasa a ser discreta por naturaleza','Deja de ser una variable']; solution='El redondeo cambia el registro, no la magnitud subyacente.' }
  else if (family === 6) { prompt=`Para estudiar ${nominal} en ${setting}, ¿tiene sentido calcular la media de las categorías?`; answer='No, porque no representan cantidades'; distractors=['Sí, siempre','Sí, si hay muchas respuestas','Sí, si se ordenan alfabéticamente']; solution='La media requiere valores cuantitativos con significado aritmético.' }
  else if (family === 7) { prompt=`Para “${discrete}” en ${setting}, ¿tendría sentido observar 2,37 unidades individuales?`; answer='No, es un conteo discreto'; distractors=['Sí, porque toda variable numérica es continua','Sí, cualquier decimal vale','No, porque es cualitativa']; solution='Los conteos de unidades indivisibles toman valores separados.' }
  else if (family === 8) { prompt=`Una balanza o cronómetro mejora su precisión al medir ${continuous} en ${setting}. ¿Qué sugiere esto?`; answer='Que la variable puede considerarse continua'; distractors=['Que solo puede tomar enteros','Que es nominal','Que es una frecuencia']; solution='La posibilidad de medir con precisión creciente es propia de magnitudes continuas.' }
  else if (family === 9) { prompt=`En ${setting}, se ordena ${ordinal} de menor a mayor. ¿Qué propiedad estadística se está usando?`; answer='El orden entre categorías'; distractors=['Una distancia numérica exacta entre categorías','Una media aritmética natural','Una frecuencia acumulada obligatoria']; solution='Las variables ordinales permiten ordenar categorías sin asumir distancias cuantitativas iguales.' }
  else if (family === 10) { prompt=`Compara “${nominal}” y “${continuous}” en ${setting}. ¿Cuál es cuantitativa?`; answer=continuous; distractors=[nominal,ordinal,discrete]; solution=`${continuous} se mide como cantidad; ${nominal} describe una categoría.` }
  else { prompt=`Compara “${discrete}” y “${continuous}” en ${setting}. ¿Cuál suele proceder de un conteo?`; answer=discrete; distractors=[continuous,nominal,ordinal]; solution=`${discrete} toma valores contables separados, mientras ${continuous} se mide sobre un continuo.` }

  const options=rotate([answer,...distractors],n+difficulty)
  return { skillId:skill.id,label:skill.name,difficulty,seed,prompt,options,answerIndex:options.indexOf(answer),solution,tags:[skill.generator_key,'math','variables_course_depth'] }
}
