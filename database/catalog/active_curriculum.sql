-- Versioned snapshot of the active 1º ESO mathematics catalogue.
-- Safe to run repeatedly after the base schema exists.

with catalogue as (
  select *
  from jsonb_to_recordset($levelup_units$
[
  {
    "id": "M01",
    "subject_id": "math",
    "name": "Números naturales",
    "sort_order": 1,
    "active": true
  },
  {
    "id": "M02",
    "subject_id": "math",
    "name": "Potencias y raíces",
    "sort_order": 2,
    "active": true
  },
  {
    "id": "M03",
    "subject_id": "math",
    "name": "Divisibilidad",
    "sort_order": 3,
    "active": true
  },
  {
    "id": "M04",
    "subject_id": "math",
    "name": "Números enteros",
    "sort_order": 4,
    "active": true
  },
  {
    "id": "M05",
    "subject_id": "math",
    "name": "Números decimales",
    "sort_order": 5,
    "active": true
  },
  {
    "id": "M06",
    "subject_id": "math",
    "name": "Sistema métrico y medida",
    "sort_order": 6,
    "active": true
  },
  {
    "id": "M07",
    "subject_id": "math",
    "name": "Fracciones",
    "sort_order": 7,
    "active": true
  },
  {
    "id": "M08",
    "subject_id": "math",
    "name": "Proporcionalidad y porcentajes",
    "sort_order": 8,
    "active": true
  },
  {
    "id": "M09",
    "subject_id": "math",
    "name": "Álgebra y ecuaciones",
    "sort_order": 9,
    "active": true
  },
  {
    "id": "M10",
    "subject_id": "math",
    "name": "Rectas y ángulos",
    "sort_order": 10,
    "active": true
  },
  {
    "id": "M11",
    "subject_id": "math",
    "name": "Figuras geométricas",
    "sort_order": 11,
    "active": true
  },
  {
    "id": "M12",
    "subject_id": "math",
    "name": "Perímetros y áreas",
    "sort_order": 12,
    "active": true
  },
  {
    "id": "M13",
    "subject_id": "math",
    "name": "Tablas y gráficas",
    "sort_order": 13,
    "active": true
  },
  {
    "id": "M14",
    "subject_id": "math",
    "name": "Estadística",
    "sort_order": 14,
    "active": true
  },
  {
    "id": "M15",
    "subject_id": "math",
    "name": "Probabilidad",
    "sort_order": 15,
    "active": true
  }
]
$levelup_units$::jsonb) as row(
    id text,
    subject_id text,
    name text,
    sort_order integer,
    active boolean
  )
)
insert into public.curriculum_units(id, subject_id, name, sort_order, active)
select id, subject_id, name, sort_order, active
from catalogue
on conflict (id) do update
set subject_id = excluded.subject_id,
    name = excluded.name,
    sort_order = excluded.sort_order,
    active = excluded.active;

with catalogue as (
  select *
  from jsonb_to_recordset($levelup_skills$
[
  {
    "id": "M01S01",
    "name": "Leer y escribir números naturales",
    "subject_id": "math",
    "unit_id": "M01",
    "goal": "Interpretar valor posicional y representar naturales",
    "prerequisites": [],
    "common_errors": [
      "confundir valor posicional",
      "omitir ceros intermedios"
    ],
    "generator_key": "natural_place_value",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M01S02",
    "name": "Comparar y ordenar naturales",
    "subject_id": "math",
    "unit_id": "M01",
    "goal": "Comparar y ordenar naturales",
    "prerequisites": [
      "M01S01"
    ],
    "common_errors": [
      "invertir > y <"
    ],
    "generator_key": "natural_compare",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M01S03",
    "name": "Suma y resta de naturales",
    "subject_id": "math",
    "unit_id": "M01",
    "goal": "Operar y estimar con suma y resta",
    "prerequisites": [
      "M01S01"
    ],
    "common_errors": [
      "errores de llevadas"
    ],
    "generator_key": "natural_add_sub",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M01S04",
    "name": "Multiplicación y división de naturales",
    "subject_id": "math",
    "unit_id": "M01",
    "goal": "Operar e interpretar cociente y resto",
    "prerequisites": [
      "M01S03"
    ],
    "common_errors": [
      "confundir divisor y cociente",
      "ignorar resto"
    ],
    "generator_key": "natural_mult_div",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M01S05",
    "name": "Jerarquía de operaciones",
    "subject_id": "math",
    "unit_id": "M01",
    "goal": "Resolver operaciones combinadas con prioridad y paréntesis",
    "prerequisites": [
      "M01S03",
      "M01S04"
    ],
    "common_errors": [
      "resolver de izquierda a derecha",
      "ignorar paréntesis"
    ],
    "generator_key": "operation_priority",
    "sort_order": 5,
    "critical": true,
    "active": true
  },
  {
    "id": "M01S06",
    "name": "Problemas con naturales",
    "subject_id": "math",
    "unit_id": "M01",
    "goal": "Elegir operaciones y comprobar resultados",
    "prerequisites": [
      "M01S05"
    ],
    "common_errors": [
      "usar todos los datos aunque sobren",
      "elegir operación por palabra clave"
    ],
    "generator_key": "natural_word_problem",
    "sort_order": 6,
    "critical": true,
    "active": true
  },
  {
    "id": "M02S01",
    "name": "Interpretar potencias",
    "subject_id": "math",
    "unit_id": "M02",
    "goal": "Distinguir base, exponente y valor",
    "prerequisites": [
      "M01S04"
    ],
    "common_errors": [
      "multiplicar base por exponente"
    ],
    "generator_key": "powers_meaning",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M02S02",
    "name": "Calcular potencias naturales",
    "subject_id": "math",
    "unit_id": "M02",
    "goal": "Calcular potencias sencillas",
    "prerequisites": [
      "M02S01"
    ],
    "common_errors": [
      "sumar la base repetidamente"
    ],
    "generator_key": "powers_compute",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M02S03",
    "name": "Potencias de base 10",
    "subject_id": "math",
    "unit_id": "M02",
    "goal": "Usar potencias de 10",
    "prerequisites": [
      "M02S02"
    ],
    "common_errors": [
      "contar mal los ceros"
    ],
    "generator_key": "powers_ten",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M02S04",
    "name": "Propiedades elementales de potencias",
    "subject_id": "math",
    "unit_id": "M02",
    "goal": "Aplicar producto y cociente de igual base",
    "prerequisites": [
      "M02S02"
    ],
    "common_errors": [
      "sumar exponentes con bases distintas"
    ],
    "generator_key": "powers_properties",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M02S05",
    "name": "Raíz cuadrada exacta",
    "subject_id": "math",
    "unit_id": "M02",
    "goal": "Calcular raíces exactas",
    "prerequisites": [
      "M02S02"
    ],
    "common_errors": [
      "dividir el número entre dos"
    ],
    "generator_key": "sqrt_exact",
    "sort_order": 5,
    "critical": false,
    "active": true
  },
  {
    "id": "M03S01",
    "name": "Múltiplos",
    "subject_id": "math",
    "unit_id": "M03",
    "goal": "Identificar y generar múltiplos",
    "prerequisites": [
      "M01S04"
    ],
    "common_errors": [
      "confundir múltiplo y divisor"
    ],
    "generator_key": "multiples",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M03S02",
    "name": "Divisores",
    "subject_id": "math",
    "unit_id": "M03",
    "goal": "Identificar divisores",
    "prerequisites": [
      "M03S01"
    ],
    "common_errors": [
      "confundir divisor y múltiplo"
    ],
    "generator_key": "divisors",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M03S03",
    "name": "Criterios de divisibilidad",
    "subject_id": "math",
    "unit_id": "M03",
    "goal": "Aplicar criterios de 2,3,5,9,10 y 11",
    "prerequisites": [
      "M03S02"
    ],
    "common_errors": [
      "aplicar criterio a cifra equivocada"
    ],
    "generator_key": "divisibility_rules",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M03S04",
    "name": "Números primos y compuestos",
    "subject_id": "math",
    "unit_id": "M03",
    "goal": "Reconocer primos y compuestos",
    "prerequisites": [
      "M03S02"
    ],
    "common_errors": [
      "considerar 1 como primo",
      "creer que todo impar es primo"
    ],
    "generator_key": "prime_numbers",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M03S05",
    "name": "Descomposición factorial",
    "subject_id": "math",
    "unit_id": "M03",
    "goal": "Descomponer en factores primos",
    "prerequisites": [
      "M03S03",
      "M03S04"
    ],
    "common_errors": [
      "detener antes de tiempo"
    ],
    "generator_key": "prime_factorization",
    "sort_order": 5,
    "critical": false,
    "active": true
  },
  {
    "id": "M03S06",
    "name": "Máximo común divisor",
    "subject_id": "math",
    "unit_id": "M03",
    "goal": "Calcular MCD y aplicarlo",
    "prerequisites": [
      "M03S05"
    ],
    "common_errors": [
      "confundir MCD con mcm"
    ],
    "generator_key": "gcd",
    "sort_order": 6,
    "critical": false,
    "active": true
  },
  {
    "id": "M03S07",
    "name": "Mínimo común múltiplo",
    "subject_id": "math",
    "unit_id": "M03",
    "goal": "Calcular mcm y aplicarlo",
    "prerequisites": [
      "M03S05"
    ],
    "common_errors": [
      "confundir mcm con MCD"
    ],
    "generator_key": "lcm",
    "sort_order": 7,
    "critical": false,
    "active": true
  },
  {
    "id": "M04S01",
    "name": "Interpretar enteros",
    "subject_id": "math",
    "unit_id": "M04",
    "goal": "Relacionar enteros con contextos reales",
    "prerequisites": [
      "M01S02"
    ],
    "common_errors": [
      "tratar negativos como naturales"
    ],
    "generator_key": "integers_context",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M04S02",
    "name": "Recta numérica y orden",
    "subject_id": "math",
    "unit_id": "M04",
    "goal": "Representar y ordenar enteros",
    "prerequisites": [
      "M04S01"
    ],
    "common_errors": [
      "creer que -8 > -3"
    ],
    "generator_key": "integers_order",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M04S03",
    "name": "Valor absoluto y opuesto",
    "subject_id": "math",
    "unit_id": "M04",
    "goal": "Calcular valor absoluto y opuesto",
    "prerequisites": [
      "M04S02"
    ],
    "common_errors": [
      "confundir valor absoluto con opuesto"
    ],
    "generator_key": "absolute_opposite",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M04S04",
    "name": "Suma de enteros",
    "subject_id": "math",
    "unit_id": "M04",
    "goal": "Sumar enteros con signos",
    "prerequisites": [
      "M04S03"
    ],
    "common_errors": [
      "sumar valores absolutos siempre"
    ],
    "generator_key": "integers_add",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M04S05",
    "name": "Resta de enteros",
    "subject_id": "math",
    "unit_id": "M04",
    "goal": "Restar enteros",
    "prerequisites": [
      "M04S04"
    ],
    "common_errors": [
      "no sumar el opuesto"
    ],
    "generator_key": "integers_sub",
    "sort_order": 5,
    "critical": false,
    "active": true
  },
  {
    "id": "M04S06",
    "name": "Producto y cociente de enteros",
    "subject_id": "math",
    "unit_id": "M04",
    "goal": "Aplicar regla de signos",
    "prerequisites": [
      "M04S04"
    ],
    "common_errors": [
      "regla de signos incorrecta"
    ],
    "generator_key": "integers_mult_div",
    "sort_order": 6,
    "critical": false,
    "active": true
  },
  {
    "id": "M04S07",
    "name": "Operaciones combinadas con enteros",
    "subject_id": "math",
    "unit_id": "M04",
    "goal": "Resolver expresiones con jerarquía",
    "prerequisites": [
      "M01S05",
      "M04S05",
      "M04S06"
    ],
    "common_errors": [
      "ignorar prioridad"
    ],
    "generator_key": "integers_mixed",
    "sort_order": 7,
    "critical": true,
    "active": true
  },
  {
    "id": "M05S01",
    "name": "Valor posicional decimal",
    "subject_id": "math",
    "unit_id": "M05",
    "goal": "Leer y descomponer decimales",
    "prerequisites": [
      "M01S01"
    ],
    "common_errors": [
      "confundir décimas y centésimas"
    ],
    "generator_key": "decimal_place_value",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M05S02",
    "name": "Comparar y ordenar decimales",
    "subject_id": "math",
    "unit_id": "M05",
    "goal": "Comparar y ordenar decimales",
    "prerequisites": [
      "M05S01"
    ],
    "common_errors": [
      "comparar por número de cifras"
    ],
    "generator_key": "decimal_compare",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M05S03",
    "name": "Suma y resta de decimales",
    "subject_id": "math",
    "unit_id": "M05",
    "goal": "Operar alineando la coma",
    "prerequisites": [
      "M05S01",
      "M01S03"
    ],
    "common_errors": [
      "no alinear comas"
    ],
    "generator_key": "decimal_add_sub",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M05S04",
    "name": "Multiplicar y dividir decimales",
    "subject_id": "math",
    "unit_id": "M05",
    "goal": "Operar con productos y cocientes decimales",
    "prerequisites": [
      "M05S03",
      "M01S04"
    ],
    "common_errors": [
      "colocar coma por intuición"
    ],
    "generator_key": "decimal_mult_div",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M05S05",
    "name": "Aproximación y redondeo",
    "subject_id": "math",
    "unit_id": "M05",
    "goal": "Redondear a unidades, décimas y centésimas",
    "prerequisites": [
      "M05S01"
    ],
    "common_errors": [
      "truncar en vez de redondear"
    ],
    "generator_key": "decimal_round",
    "sort_order": 5,
    "critical": false,
    "active": true
  },
  {
    "id": "M06S01",
    "name": "Longitud",
    "subject_id": "math",
    "unit_id": "M06",
    "goal": "Convertir unidades de longitud",
    "prerequisites": [
      "M05S04"
    ],
    "common_errors": [
      "mover coma al lado incorrecto"
    ],
    "generator_key": "metric_length",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M06S02",
    "name": "Masa",
    "subject_id": "math",
    "unit_id": "M06",
    "goal": "Convertir unidades de masa",
    "prerequisites": [
      "M06S01"
    ],
    "common_errors": [
      "confundir kg y g"
    ],
    "generator_key": "metric_mass",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M06S03",
    "name": "Capacidad",
    "subject_id": "math",
    "unit_id": "M06",
    "goal": "Convertir unidades de capacidad",
    "prerequisites": [
      "M06S01"
    ],
    "common_errors": [
      "confundir L y mL"
    ],
    "generator_key": "metric_capacity",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M06S04",
    "name": "Superficie",
    "subject_id": "math",
    "unit_id": "M06",
    "goal": "Convertir unidades de superficie",
    "prerequisites": [
      "M06S01"
    ],
    "common_errors": [
      "usar factor 10 en vez de 100"
    ],
    "generator_key": "metric_area_units",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M06S05",
    "name": "Tiempo y sistema sexagesimal",
    "subject_id": "math",
    "unit_id": "M06",
    "goal": "Operar con horas, minutos y segundos",
    "prerequisites": [
      "M01S03"
    ],
    "common_errors": [
      "tratar 60 como base 10"
    ],
    "generator_key": "sexagesimal_time",
    "sort_order": 5,
    "critical": false,
    "active": true
  },
  {
    "id": "M07S01",
    "name": "Interpretar fracciones",
    "subject_id": "math",
    "unit_id": "M07",
    "goal": "Interpretar numerador, denominador y fracción como operador",
    "prerequisites": [
      "M01S04"
    ],
    "common_errors": [
      "invertir numerador y denominador"
    ],
    "generator_key": "fraction_meaning",
    "sort_order": 1,
    "critical": true,
    "active": true
  },
  {
    "id": "M07S02",
    "name": "Fracciones equivalentes",
    "subject_id": "math",
    "unit_id": "M07",
    "goal": "Reconocer y ampliar equivalentes",
    "prerequisites": [
      "M07S01"
    ],
    "common_errors": [
      "cambiar solo un término"
    ],
    "generator_key": "fraction_equivalent",
    "sort_order": 2,
    "critical": true,
    "active": true
  },
  {
    "id": "M07S03",
    "name": "Simplificar fracciones",
    "subject_id": "math",
    "unit_id": "M07",
    "goal": "Reducir a irreducible",
    "prerequisites": [
      "M03S02",
      "M07S02"
    ],
    "common_errors": [
      "dividir por números distintos"
    ],
    "generator_key": "fraction_simplify",
    "sort_order": 3,
    "critical": true,
    "active": true
  },
  {
    "id": "M07S04",
    "name": "Comparar y ordenar fracciones",
    "subject_id": "math",
    "unit_id": "M07",
    "goal": "Comparar con igual o distinto denominador",
    "prerequisites": [
      "M07S02"
    ],
    "common_errors": [
      "comparar solo numeradores"
    ],
    "generator_key": "fraction_compare",
    "sort_order": 4,
    "critical": true,
    "active": true
  },
  {
    "id": "M07S05",
    "name": "Suma y resta de fracciones",
    "subject_id": "math",
    "unit_id": "M07",
    "goal": "Operar con denominador común",
    "prerequisites": [
      "M07S03",
      "M03S07"
    ],
    "common_errors": [
      "sumar denominadores"
    ],
    "generator_key": "fraction_add_sub",
    "sort_order": 5,
    "critical": true,
    "active": true
  },
  {
    "id": "M07S06",
    "name": "Multiplicar fracciones",
    "subject_id": "math",
    "unit_id": "M07",
    "goal": "Multiplicar y simplificar",
    "prerequisites": [
      "M07S03"
    ],
    "common_errors": [
      "multiplicar en cruz"
    ],
    "generator_key": "fraction_multiply",
    "sort_order": 6,
    "critical": true,
    "active": true
  },
  {
    "id": "M07S07",
    "name": "Dividir fracciones",
    "subject_id": "math",
    "unit_id": "M07",
    "goal": "Dividir usando la inversa de la segunda",
    "prerequisites": [
      "M07S06"
    ],
    "common_errors": [
      "invertir la primera"
    ],
    "generator_key": "fraction_divide",
    "sort_order": 7,
    "critical": true,
    "active": true
  },
  {
    "id": "M07S08",
    "name": "Problemas con fracciones",
    "subject_id": "math",
    "unit_id": "M07",
    "goal": "Modelizar situaciones con fracciones",
    "prerequisites": [
      "M07S05",
      "M07S06",
      "M07S07"
    ],
    "common_errors": [
      "elegir operación por palabra clave"
    ],
    "generator_key": "fraction_word_problem",
    "sort_order": 8,
    "critical": true,
    "active": true
  },
  {
    "id": "M08S01",
    "name": "Razón",
    "subject_id": "math",
    "unit_id": "M08",
    "goal": "Interpretar razón como comparación multiplicativa",
    "prerequisites": [
      "M07S01"
    ],
    "common_errors": [
      "confundir razón con diferencia"
    ],
    "generator_key": "ratio",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M08S02",
    "name": "Reconocer proporcionalidad directa",
    "subject_id": "math",
    "unit_id": "M08",
    "goal": "Distinguir situaciones proporcionales",
    "prerequisites": [
      "M08S01"
    ],
    "common_errors": [
      "suponer proporcionalidad siempre"
    ],
    "generator_key": "direct_proportion_recognize",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M08S03",
    "name": "Tablas proporcionales",
    "subject_id": "math",
    "unit_id": "M08",
    "goal": "Completar tablas de proporcionalidad",
    "prerequisites": [
      "M08S02"
    ],
    "common_errors": [
      "sumar cantidad fija"
    ],
    "generator_key": "direct_proportion_table",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M08S04",
    "name": "Regla de tres directa",
    "subject_id": "math",
    "unit_id": "M08",
    "goal": "Resolver problemas de proporcionalidad",
    "prerequisites": [
      "M08S03"
    ],
    "common_errors": [
      "colocar magnitudes incompatibles"
    ],
    "generator_key": "rule_of_three",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M08S05",
    "name": "Porcentaje de una cantidad",
    "subject_id": "math",
    "unit_id": "M08",
    "goal": "Calcular porcentajes",
    "prerequisites": [
      "M08S03",
      "M07S06"
    ],
    "common_errors": [
      "confundir porcentaje con cantidad final"
    ],
    "generator_key": "percentage_of",
    "sort_order": 5,
    "critical": true,
    "active": true
  },
  {
    "id": "M08S06",
    "name": "Aumentos y descuentos",
    "subject_id": "math",
    "unit_id": "M08",
    "goal": "Calcular valores finales",
    "prerequisites": [
      "M08S05"
    ],
    "common_errors": [
      "usar base incorrecta"
    ],
    "generator_key": "percentage_change",
    "sort_order": 6,
    "critical": false,
    "active": true
  },
  {
    "id": "M08S07",
    "name": "Problemas de proporcionalidad",
    "subject_id": "math",
    "unit_id": "M08",
    "goal": "Elegir y justificar estrategia",
    "prerequisites": [
      "M08S04",
      "M08S06"
    ],
    "common_errors": [
      "usar regla de tres sin proporcionalidad"
    ],
    "generator_key": "proportion_word_problem",
    "sort_order": 7,
    "critical": true,
    "active": true
  },
  {
    "id": "M09S01",
    "name": "Lenguaje algebraico",
    "subject_id": "math",
    "unit_id": "M09",
    "goal": "Traducir frases a expresiones",
    "prerequisites": [
      "M01S05"
    ],
    "common_errors": [
      "omitir paréntesis"
    ],
    "generator_key": "algebra_translate",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M09S02",
    "name": "Valor numérico",
    "subject_id": "math",
    "unit_id": "M09",
    "goal": "Sustituir variables y calcular",
    "prerequisites": [
      "M09S01",
      "M04S07"
    ],
    "common_errors": [
      "ignorar signos"
    ],
    "generator_key": "algebra_evaluate",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M09S03",
    "name": "Términos semejantes",
    "subject_id": "math",
    "unit_id": "M09",
    "goal": "Reducir términos semejantes",
    "prerequisites": [
      "M09S01"
    ],
    "common_errors": [
      "sumar no semejantes"
    ],
    "generator_key": "like_terms",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M09S04",
    "name": "Ecuaciones de un paso",
    "subject_id": "math",
    "unit_id": "M09",
    "goal": "Resolver x+a=b y ax=b",
    "prerequisites": [
      "M09S02"
    ],
    "common_errors": [
      "romper equivalencia"
    ],
    "generator_key": "equation_one_step",
    "sort_order": 4,
    "critical": true,
    "active": true
  },
  {
    "id": "M09S05",
    "name": "Ecuaciones de varios pasos sencillas",
    "subject_id": "math",
    "unit_id": "M09",
    "goal": "Resolver ecuaciones lineales elementales",
    "prerequisites": [
      "M09S04",
      "M09S03"
    ],
    "common_errors": [
      "distribuir mal"
    ],
    "generator_key": "equation_multi_step",
    "sort_order": 5,
    "critical": true,
    "active": true
  },
  {
    "id": "M09S06",
    "name": "Comprobar soluciones",
    "subject_id": "math",
    "unit_id": "M09",
    "goal": "Verificar sustituyendo",
    "prerequisites": [
      "M09S04"
    ],
    "common_errors": [
      "comprobar solo un miembro"
    ],
    "generator_key": "equation_check",
    "sort_order": 6,
    "critical": false,
    "active": true
  },
  {
    "id": "M09S07",
    "name": "Problemas con ecuaciones",
    "subject_id": "math",
    "unit_id": "M09",
    "goal": "Definir incógnita, plantear y resolver",
    "prerequisites": [
      "M09S05"
    ],
    "common_errors": [
      "traducir mal relaciones"
    ],
    "generator_key": "equation_word_problem",
    "sort_order": 7,
    "critical": true,
    "active": true
  },
  {
    "id": "M10S01",
    "name": "Puntos, rectas y segmentos",
    "subject_id": "math",
    "unit_id": "M10",
    "goal": "Distinguir elementos básicos del plano",
    "prerequisites": [],
    "common_errors": [
      "confundir recta y segmento"
    ],
    "generator_key": "geometry_lines",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M10S02",
    "name": "Tipos de ángulos",
    "subject_id": "math",
    "unit_id": "M10",
    "goal": "Reconocer tipos de ángulos",
    "prerequisites": [
      "M10S01"
    ],
    "common_errors": [
      "clasificar por apariencia"
    ],
    "generator_key": "angle_types",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M10S03",
    "name": "Medida de ángulos",
    "subject_id": "math",
    "unit_id": "M10",
    "goal": "Medir y expresar grados",
    "prerequisites": [
      "M10S02",
      "M06S05"
    ],
    "common_errors": [
      "leer escala equivocada"
    ],
    "generator_key": "angle_measure",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M10S04",
    "name": "Complementarios y suplementarios",
    "subject_id": "math",
    "unit_id": "M10",
    "goal": "Calcular ángulos relacionados",
    "prerequisites": [
      "M10S03"
    ],
    "common_errors": [
      "confundir 90 y 180"
    ],
    "generator_key": "angle_relations",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M10S05",
    "name": "Ángulos en paralelas",
    "subject_id": "math",
    "unit_id": "M10",
    "goal": "Reconocer relaciones básicas",
    "prerequisites": [
      "M10S04"
    ],
    "common_errors": [
      "confundir correspondientes y alternos"
    ],
    "generator_key": "parallel_angles",
    "sort_order": 5,
    "critical": false,
    "active": true
  },
  {
    "id": "M11S01",
    "name": "Clasificar triángulos por lados",
    "subject_id": "math",
    "unit_id": "M11",
    "goal": "Reconocer equilátero, isósceles y escaleno",
    "prerequisites": [
      "M10S01"
    ],
    "common_errors": [
      "clasificar por apariencia"
    ],
    "generator_key": "triangle_sides",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M11S02",
    "name": "Clasificar triángulos por ángulos",
    "subject_id": "math",
    "unit_id": "M11",
    "goal": "Reconocer acutángulo, rectángulo y obtusángulo",
    "prerequisites": [
      "M10S02"
    ],
    "common_errors": [
      "mezclar clasificaciones"
    ],
    "generator_key": "triangle_angles",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M11S03",
    "name": "Suma de ángulos de triángulo",
    "subject_id": "math",
    "unit_id": "M11",
    "goal": "Calcular ángulos usando 180°",
    "prerequisites": [
      "M10S04",
      "M11S02"
    ],
    "common_errors": [
      "usar 360"
    ],
    "generator_key": "triangle_angle_sum",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M11S04",
    "name": "Cuadriláteros",
    "subject_id": "math",
    "unit_id": "M11",
    "goal": "Clasificar por propiedades",
    "prerequisites": [
      "M10S01"
    ],
    "common_errors": [
      "confundir rombo y cuadrado"
    ],
    "generator_key": "quadrilaterals",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M11S05",
    "name": "Polígonos regulares",
    "subject_id": "math",
    "unit_id": "M11",
    "goal": "Reconocer elementos y propiedades",
    "prerequisites": [
      "M11S04"
    ],
    "common_errors": [
      "confundir regular con convexo"
    ],
    "generator_key": "regular_polygons",
    "sort_order": 5,
    "critical": false,
    "active": true
  },
  {
    "id": "M11S06",
    "name": "Circunferencia y círculo",
    "subject_id": "math",
    "unit_id": "M11",
    "goal": "Distinguir radio, diámetro, cuerda y arco",
    "prerequisites": [
      "M10S01"
    ],
    "common_errors": [
      "confundir círculo y circunferencia"
    ],
    "generator_key": "circle_elements",
    "sort_order": 6,
    "critical": false,
    "active": true
  },
  {
    "id": "M11S07",
    "name": "Simetría",
    "subject_id": "math",
    "unit_id": "M11",
    "goal": "Identificar ejes de simetría",
    "prerequisites": [
      "M11S05"
    ],
    "common_errors": [
      "contar diagonales como ejes"
    ],
    "generator_key": "symmetry",
    "sort_order": 7,
    "critical": false,
    "active": true
  },
  {
    "id": "M11S08",
    "name": "Clasificación geométrica razonada",
    "subject_id": "math",
    "unit_id": "M11",
    "goal": "Justificar clasificaciones usando propiedades",
    "prerequisites": [
      "M11S01",
      "M11S04",
      "M11S06"
    ],
    "common_errors": [
      "responder por apariencia"
    ],
    "generator_key": "geometry_classification",
    "sort_order": 8,
    "critical": false,
    "active": true
  },
  {
    "id": "M12S01",
    "name": "Perímetro de polígonos",
    "subject_id": "math",
    "unit_id": "M12",
    "goal": "Calcular perímetros",
    "prerequisites": [
      "M11S04"
    ],
    "common_errors": [
      "confundir perímetro y área"
    ],
    "generator_key": "perimeter",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M12S02",
    "name": "Área de rectángulo y cuadrado",
    "subject_id": "math",
    "unit_id": "M12",
    "goal": "Calcular áreas",
    "prerequisites": [
      "M06S04"
    ],
    "common_errors": [
      "sumar lados"
    ],
    "generator_key": "rectangle_square_area",
    "sort_order": 2,
    "critical": true,
    "active": true
  },
  {
    "id": "M12S03",
    "name": "Área de triángulo",
    "subject_id": "math",
    "unit_id": "M12",
    "goal": "Calcular base por altura entre dos",
    "prerequisites": [
      "M11S01",
      "M12S02"
    ],
    "common_errors": [
      "olvidar dividir entre dos"
    ],
    "generator_key": "triangle_area",
    "sort_order": 3,
    "critical": true,
    "active": true
  },
  {
    "id": "M12S04",
    "name": "Área de paralelogramo y trapecio",
    "subject_id": "math",
    "unit_id": "M12",
    "goal": "Aplicar fórmulas sencillas",
    "prerequisites": [
      "M12S02",
      "M12S03"
    ],
    "common_errors": [
      "usar lado como altura"
    ],
    "generator_key": "quadrilateral_area",
    "sort_order": 4,
    "critical": true,
    "active": true
  },
  {
    "id": "M12S05",
    "name": "Circunferencia y círculo",
    "subject_id": "math",
    "unit_id": "M12",
    "goal": "Calcular longitud y área con pi",
    "prerequisites": [
      "M11S06",
      "M12S02"
    ],
    "common_errors": [
      "confundir radio y diámetro"
    ],
    "generator_key": "circle_measure",
    "sort_order": 5,
    "critical": false,
    "active": true
  },
  {
    "id": "M12S06",
    "name": "Figuras compuestas",
    "subject_id": "math",
    "unit_id": "M12",
    "goal": "Descomponer figuras para calcular áreas y perímetros",
    "prerequisites": [
      "M12S01",
      "M12S02",
      "M12S03",
      "M12S04"
    ],
    "common_errors": [
      "sumar áreas solapadas"
    ],
    "generator_key": "composite_area",
    "sort_order": 6,
    "critical": false,
    "active": true
  },
  {
    "id": "M13S01",
    "name": "Coordenadas cartesianas",
    "subject_id": "math",
    "unit_id": "M13",
    "goal": "Representar puntos",
    "prerequisites": [
      "M04S02"
    ],
    "common_errors": [
      "intercambiar x e y"
    ],
    "generator_key": "coordinates",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M13S02",
    "name": "Leer tablas de valores",
    "subject_id": "math",
    "unit_id": "M13",
    "goal": "Interpretar relaciones en tablas",
    "prerequisites": [
      "M05S02"
    ],
    "common_errors": [
      "leer fila incorrecta"
    ],
    "generator_key": "value_tables",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M13S03",
    "name": "Representar datos en gráficas",
    "subject_id": "math",
    "unit_id": "M13",
    "goal": "Pasar de tabla a gráfica",
    "prerequisites": [
      "M13S01",
      "M13S02"
    ],
    "common_errors": [
      "intercambiar ejes"
    ],
    "generator_key": "plot_graph",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M13S04",
    "name": "Interpretar gráficas",
    "subject_id": "math",
    "unit_id": "M13",
    "goal": "Extraer tendencias, máximos y mínimos",
    "prerequisites": [
      "M13S03"
    ],
    "common_errors": [
      "ignorar escala"
    ],
    "generator_key": "graph_interpret",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M14S01",
    "name": "Población, muestra e individuo",
    "subject_id": "math",
    "unit_id": "M14",
    "goal": "Distinguir conceptos básicos",
    "prerequisites": [],
    "common_errors": [
      "confundir muestra con variable"
    ],
    "generator_key": "stats_population",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M14S02",
    "name": "Variables estadísticas",
    "subject_id": "math",
    "unit_id": "M14",
    "goal": "Distinguir cualitativas y cuantitativas",
    "prerequisites": [
      "M14S01"
    ],
    "common_errors": [
      "clasificar por respuesta"
    ],
    "generator_key": "stats_variables",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M14S03",
    "name": "Tabla de frecuencias",
    "subject_id": "math",
    "unit_id": "M14",
    "goal": "Organizar frecuencias absolutas",
    "prerequisites": [
      "M14S02"
    ],
    "common_errors": [
      "confundir valor y frecuencia"
    ],
    "generator_key": "frequency_table",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M14S04",
    "name": "Gráficos estadísticos",
    "subject_id": "math",
    "unit_id": "M14",
    "goal": "Leer y construir gráficos sencillos",
    "prerequisites": [
      "M14S03"
    ],
    "common_errors": [
      "ignorar escala"
    ],
    "generator_key": "stat_charts",
    "sort_order": 4,
    "critical": false,
    "active": true
  },
  {
    "id": "M14S05",
    "name": "Media aritmética",
    "subject_id": "math",
    "unit_id": "M14",
    "goal": "Calcular e interpretar media",
    "prerequisites": [
      "M14S03",
      "M07S01"
    ],
    "common_errors": [
      "dividir por número incorrecto"
    ],
    "generator_key": "mean",
    "sort_order": 5,
    "critical": false,
    "active": true
  },
  {
    "id": "M14S06",
    "name": "Mediana",
    "subject_id": "math",
    "unit_id": "M14",
    "goal": "Calcular mediana",
    "prerequisites": [
      "M14S03"
    ],
    "common_errors": [
      "no ordenar datos"
    ],
    "generator_key": "median",
    "sort_order": 6,
    "critical": false,
    "active": true
  },
  {
    "id": "M14S07",
    "name": "Moda",
    "subject_id": "math",
    "unit_id": "M14",
    "goal": "Identificar la moda",
    "prerequisites": [
      "M14S03"
    ],
    "common_errors": [
      "elegir el valor mayor"
    ],
    "generator_key": "mode",
    "sort_order": 7,
    "critical": false,
    "active": true
  },
  {
    "id": "M15S01",
    "name": "Experimentos aleatorios",
    "subject_id": "math",
    "unit_id": "M15",
    "goal": "Distinguir deterministas y aleatorios",
    "prerequisites": [],
    "common_errors": [
      "confundir desconocido con aleatorio"
    ],
    "generator_key": "random_experiments",
    "sort_order": 1,
    "critical": false,
    "active": true
  },
  {
    "id": "M15S02",
    "name": "Sucesos",
    "subject_id": "math",
    "unit_id": "M15",
    "goal": "Reconocer posible, seguro e imposible",
    "prerequisites": [
      "M15S01"
    ],
    "common_errors": [
      "confundir imposible con improbable"
    ],
    "generator_key": "events",
    "sort_order": 2,
    "critical": false,
    "active": true
  },
  {
    "id": "M15S03",
    "name": "Casos favorables y posibles",
    "subject_id": "math",
    "unit_id": "M15",
    "goal": "Contar casos equiprobables",
    "prerequisites": [
      "M15S02"
    ],
    "common_errors": [
      "contar casos repetidos"
    ],
    "generator_key": "favorable_possible",
    "sort_order": 3,
    "critical": false,
    "active": true
  },
  {
    "id": "M15S04",
    "name": "Probabilidad de Laplace básica",
    "subject_id": "math",
    "unit_id": "M15",
    "goal": "Calcular favorables/posibles",
    "prerequisites": [
      "M15S03",
      "M07S01"
    ],
    "common_errors": [
      "invertir la fracción"
    ],
    "generator_key": "laplace_basic",
    "sort_order": 4,
    "critical": false,
    "active": true
  }
]
$levelup_skills$::jsonb) as row(
    id text,
    name text,
    subject_id text,
    unit_id text,
    goal text,
    prerequisites text[],
    common_errors text[],
    generator_key text,
    sort_order integer,
    critical boolean,
    active boolean
  )
)
insert into public.skills(
  id, name, subject_id, unit_id, goal, prerequisites, common_errors,
  generator_key, sort_order, critical, active
)
select
  id, name, subject_id, unit_id, goal, prerequisites, common_errors,
  generator_key, sort_order, critical, active
from catalogue
on conflict (id) do update
set name = excluded.name,
    subject_id = excluded.subject_id,
    unit_id = excluded.unit_id,
    goal = excluded.goal,
    prerequisites = excluded.prerequisites,
    common_errors = excluded.common_errors,
    generator_key = excluded.generator_key,
    sort_order = excluded.sort_order,
    critical = excluded.critical,
    active = excluded.active;

