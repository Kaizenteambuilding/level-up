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
      detail: 'Aún no hay una expedición completada en tu historial.',
      next: 'Completa la expedición diaria para empezar a construir progreso. Cualquier actividad completada mantiene tu racha de aprendizaje.',
    }
  }

  const reward = latest.reward > 0 ? ` · +${latest.reward} monedas` : ''
  const streak = Math.max(0, Math.floor(Number(streakDays) || 0))

  return {
    title: completedToday ? 'Hoy ya has avanzado' : 'Tu progreso sigue contigo',
    detail: `${latest.correct}/10 aciertos · +${latest.xp} XP${reward}`,
    next: completedToday
      ? `Racha de aprendizaje: ${streak} días. Puedes seguir explorando otros distritos hoy; mañana tendrás una nueva expedición diaria.`
      : `Racha de aprendizaje: ${streak} días. La siguiente expedición diaria continúa desde tu progreso persistido y cualquier distrito completado también mantiene la racha.`,
  }
}
