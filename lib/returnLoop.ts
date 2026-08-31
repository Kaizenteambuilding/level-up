import type { DemoMissionRecord } from './demoGame'

function localDayKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export type ReturnLoop = {
  completedToday: boolean
  streak: number
  title: string
  message: string
}

export function buildReturnLoop(history: DemoMissionRecord[], authoritativeStreak = 0, now = new Date()): ReturnLoop {
  const days = new Set(
    history
      .filter((mission) => !Number.isNaN(Date.parse(mission.completedAt)))
      .map((mission) => localDayKey(mission.completedAt))
  )

  const completedToday = days.has(localDayKey(now))
  const streak = Math.max(0, Math.floor(Number(authoritativeStreak) || 0))

  if (completedToday) {
    return {
      completedToday,
      streak,
      title: streak > 1 ? `Racha actual: ${streak} días` : 'Primer día de tu nueva racha',
      message: 'La expedición de hoy ya está completada. Tu racha refleja toda la actividad de aprendizaje completada; mañana habrá una nueva expedición diaria.',
    }
  }

  return {
    completedToday,
    streak,
    title: streak > 0 ? `Tu racha de ${streak} días sigue activa` : 'Hoy puedes empezar una nueva racha',
    message: 'Completa la expedición diaria o un distrito de aprendizaje para seguir entrenando. La expedición diaria añade además sus recompensas específicas.',
  }
}
