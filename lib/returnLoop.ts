import type { DemoMissionRecord } from './demoGame'

function localDayKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function previousDay(value: Date) {
  const copy = new Date(value)
  copy.setHours(12, 0, 0, 0)
  copy.setDate(copy.getDate() - 1)
  return copy
}

export type ReturnLoop = {
  completedToday: boolean
  streak: number
  title: string
  message: string
}

export function buildReturnLoop(history: DemoMissionRecord[], now = new Date()): ReturnLoop {
  const days = new Set(
    history
      .filter((mission) => !Number.isNaN(Date.parse(mission.completedAt)))
      .map((mission) => localDayKey(mission.completedAt))
  )

  const today = new Date(now)
  today.setHours(12, 0, 0, 0)
  const completedToday = days.has(localDayKey(today))

  let cursor = completedToday ? today : previousDay(today)
  let streak = 0
  while (days.has(localDayKey(cursor))) {
    streak += 1
    cursor = previousDay(cursor)
  }

  if (completedToday) {
    return {
      completedToday,
      streak,
      title: streak > 1 ? `Racha protegida: ${streak} días` : 'Primer día de tu nueva racha',
      message: 'La misión de hoy ya cuenta. Mañana habrá una nueva expedición para mantener la racha y seguir avanzando.',
    }
  }

  return {
    completedToday,
    streak,
    title: streak > 0 ? `Tu racha de ${streak} días te espera` : 'Hoy puedes empezar una nueva racha',
    message: 'Completa la misión diaria para registrar el día y mantener viva la expedición.',
  }
}
