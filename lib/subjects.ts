export const SUBJECTS = {
  math: { id: 'math', name: 'Matemáticas', icon: '🔢', prefix: 'M' },
  spanish: { id: 'spanish', name: 'Lengua Castellana y Literatura', icon: '📚', prefix: 'L' },
  english: { id: 'english', name: 'Inglés', icon: '🌍', prefix: 'E' },
  geography_history: { id: 'geography_history', name: 'Geografía e Historia', icon: '🏛️', prefix: 'G' },
  biology_geology: { id: 'biology_geology', name: 'Biología y Geología', icon: '🧬', prefix: 'B' },
} as const

export type SubjectId = keyof typeof SUBJECTS

export const ACTIVE_SUBJECT_IDS = Object.keys(SUBJECTS) as SubjectId[]

export function subjectDefinition(subjectId: string) {
  return SUBJECTS[subjectId as SubjectId] ?? null
}
