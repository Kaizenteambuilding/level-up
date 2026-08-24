import type { DemoGameState } from './demoGame'

export type DailyReturnSummary = {
  title: string
  detail: string
  next: string
}

export function buildDailyReturnSummary(game: DemoGameState, completedToday: boolean, streakDays: number): DailyReturnSummary {
  const latest = [...game.missionHistory]
    .filter((mission) => !Number.isNaN(Date.parse(mission.completedAt)))
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))[0]

  if (!latest) {
    return {
      title: 'Tu expedición empieza aquí',
      detail: 'Aún no hay una misión completada en tu historial.',
      next: 'Completa la misión diaria para empezar a construir progreso y racha.',
    }
  }

  const reward = latest.reward > 0 ? ` · +${latest.reward} monedas` : ''
  const streak = Math.max(0, Math.floor(Number(streakDays) || 0))

  return {
    title: completedToday ? 'Hoy ya has avanzado' : 'Tu progreso sigue contigo',
    detail: `${latest.correct}/10 aciertos · +${latest.xp} XP${reward}`,
    next: completedToday
      ? `Racha actual: ${streak} días. Mañana tendrás una nueva misión.`
      : 'La siguiente misión diaria continúa desde tu progreso persistido.',
  }
}
