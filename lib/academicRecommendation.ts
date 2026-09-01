export type AcademicRecommendation = {
  skillId: string
  skillName: string
  subjectId: string
  unitId: string
  mastery: number
  priority: number
  href: string
  destination: string
}

export function academicDestination(subjectId: string, unitId: string) {
  if (subjectId === 'math') {
    if (/^M0[1-7]$/.test(unitId)) return { href: '/zone/math/numbers', destination: 'Forja de números' }
    if (unitId === 'M08' || unitId === 'M09') return { href: '/zone/math/algebra', destination: 'Taller de proporciones' }
    return { href: '/zone/math/geometry-data', destination: 'Observatorio geométrico' }
  }
  if (subjectId === 'spanish') {
    if (unitId === 'L05') return { href: '/zone/language/writing', destination: 'Sala de cronistas' }
    if (unitId === 'L02' || unitId === 'L03' || unitId === 'L04') return { href: '/zone/language/words', destination: 'Taller de palabras' }
    return { href: '/zone/language/reading', destination: 'Galería de lectura' }
  }
  if (subjectId === 'english') return { href: '/zone/english', destination: 'Puerto de Inglés' }
  if (subjectId === 'science') {
    if (unitId === 'B01') return { href: '/zone/science/investigation', destination: 'Cámara de investigación' }
    if (unitId === 'B02') return { href: '/zone/science/observatory', destination: 'Observatorio' }
    return { href: '/zone/science/life', destination: 'Cúpula de la vida' }
  }
  if (subjectId === 'geography') {
    if (unitId === 'G01') return { href: '/zone/geography/maps', destination: 'Sala de cartografía' }
    if (unitId === 'G02' || unitId === 'G03') return { href: '/zone/geography/physical', destination: 'Expedición terrestre' }
    return { href: '/zone/geography/history', destination: 'Archivo del tiempo' }
  }
  return { href: '/world', destination: 'Mundo de aprendizaje' }
}
