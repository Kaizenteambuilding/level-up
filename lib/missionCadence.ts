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
    title: 'Tu expedición de hoy está lista',
    message: 'Una expedición corta mantiene vivo tu progreso y alimenta el motor adaptativo.',
    action: 'EMPEZAR EXPEDICIÓN',
  }

  const completedAt = new Date(last.completedAt)
  if (!Number.isNaN(completedAt.getTime()) && localDayKey(completedAt) === localDayKey(now)) return {
    status: 'done-today',
    title: 'Expedición de hoy completada',
    message: 'El progreso de hoy ya está guardado. Puedes explorar cualquiera de los cinco mundos o volver mañana para una nueva expedición.',
    action: 'EXPLORAR MUNDOS',
  }

  return {
    status: 'returning',
    title: 'Hay una nueva expedición esperándote',
    message: 'Abre la expedición diaria para mantener tu aventura y tu progreso en marcha.',
    action: 'ABRIR EXPEDICIÓN',
  }
}
