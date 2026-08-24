import type { DemoGameState } from './demoGame'

export type MissionCadence = {
  status: 'ready' | 'done-today' | 'returning'
  title: string
  message: string
  action: string
}

function localDayKey(value: Date) {
  return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`
}

export function missionCadence(game: DemoGameState, now = new Date()): MissionCadence {
  const last = game.missionHistory.at(-1)
  if (!last) return {
    status: 'ready',
    title: 'Tu misión de hoy está lista',
    message: 'Una expedición corta mantiene vivo tu progreso y alimenta el motor adaptativo.',
    action: 'EMPEZAR MISIÓN',
  }

  const completedAt = new Date(last.completedAt)
  if (!Number.isNaN(completedAt.getTime()) && localDayKey(completedAt) === localDayKey(now)) return {
    status: 'done-today',
    title: 'Misión de hoy completada',
    message: 'El progreso de hoy ya está guardado. Puedes explorar el mundo o volver mañana para una nueva misión.',
    action: 'EXPLORAR CIUDAD',
  }

  return {
    status: 'returning',
    title: 'Hay una nueva misión esperándote',
    message: 'Vuelve a Ciudad Matemática para mantener la expedición en marcha.',
    action: 'ABRIR MISIÓN',
  }
}
