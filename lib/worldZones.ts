export type WorldZoneId = 'language' | 'english' | 'science' | 'creative'
export type WorldDistrictAvailability = 'coming_soon' | 'playable'
export type WorldDistrict = { icon: string; name: string; detail: string; availability: WorldDistrictAvailability; href?: string }
export type WorldZone = {
  id: WorldZoneId
  name: string
  icon: string
  className: string
  tagline: string
  description: string
  mission: string
  districts: WorldDistrict[]
}

const comingSoon = (icon: string, name: string, detail: string): WorldDistrict => ({ icon, name, detail, availability: 'coming_soon' })
const playable = (icon: string, name: string, detail: string, href: string): WorldDistrict => ({ icon, name, detail, availability: 'playable', href })

export const WORLD_ZONES: WorldZone[] = [
  { id: 'language', name: 'Biblioteca de Lengua', icon: '📚', className: 'language-zone', tagline: 'Las historias han perdido sus palabras', description: 'Lectura, vocabulario, gramática y escritura se convertirán en expediciones narrativas.', mission: 'Reconstruir relatos y recuperar los archivos de la Gran Biblioteca.', districts: [playable('🔎', 'Galería de lectura', 'Comprensión e inferencias', '/zone/language/reading'), playable('🧩', 'Taller de palabras', 'Gramática y vocabulario', '/zone/language/words'), comingSoon('✍️', 'Sala de cronistas', 'Expresión escrita')] },
  { id: 'english', name: 'Puerto de Inglés', icon: '🌍', className: 'english-zone', tagline: 'Cada conversación abre una nueva ruta', description: 'Vocabulario, comprensión y comunicación forman una aventura de viajes.', mission: 'Conseguir permisos de navegación hablando con personajes de todo el mundo.', districts: [playable('🎧', 'Muelle de escucha', 'Comprensión oral', '/zone/english/listening'), playable('💬', 'Plaza de conversación', 'Uso práctico del idioma', '/zone/english/conversation'), playable('🧳', 'Terminal de palabras', 'Vocabulario y estructuras', '/zone/english/terminal')] },
  { id: 'science', name: 'Laboratorio de Ciencias', icon: '🔬', className: 'science-zone', tagline: 'Investiga antes de sacar conclusiones', description: 'Biología, materia, energía y método científico vivirán en laboratorios interactivos.', mission: 'Resolver anomalías mediante observación, hipótesis y experimentos.', districts: [comingSoon('🧬', 'Cúpula de la vida', 'Seres vivos y ecosistemas'), comingSoon('⚗️', 'Cámara de materia', 'Sustancias y transformaciones'), comingSoon('🌌', 'Observatorio', 'Tierra y universo')] },
  { id: 'creative', name: 'Taller Creativo', icon: '🎨', className: 'creative-zone', tagline: 'Las mejores soluciones se construyen', description: 'Arte, tecnología y proyectos unirán creatividad con resolución de problemas.', mission: 'Diseñar artefactos para mejorar el mundo de LEVEL UP.', districts: [comingSoon('🎨', 'Estudio visual', 'Diseño y expresión'), comingSoon('🛠️', 'Taller de prototipos', 'Tecnología y construcción'), comingSoon('🎵', 'Escenario sonoro', 'Ritmo y creación')] },
]

export function worldZoneById(value: string) { return WORLD_ZONES.find((zone) => zone.id === value) }
