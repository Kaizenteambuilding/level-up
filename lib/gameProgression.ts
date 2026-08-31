export const MAX_GAME_LEVEL = 50

export function xpForLevel(level: number) {
  const safeLevel = Math.max(1, Math.min(MAX_GAME_LEVEL, Math.floor(level)))
  const steps = safeLevel - 1
  return 225 * steps + 75 * steps * steps
}

export function levelFromXp(xp: number) {
  const safeXp = Math.max(0, Math.floor(Number(xp) || 0))
  let level = 1
  while (level < MAX_GAME_LEVEL && safeXp >= xpForLevel(level + 1)) level += 1
  return level
}

export function levelProgress(xp: number, storedLevel?: number) {
  const level = storedLevel === undefined
    ? levelFromXp(xp)
    : Math.max(1, Math.min(MAX_GAME_LEVEL, Math.floor(storedLevel)))
  if (level >= MAX_GAME_LEVEL) return { level, current: 0, required: 0, percent: 100 }
  const floor = xpForLevel(level)
  const ceiling = xpForLevel(level + 1)
  const current = Math.max(0, Math.floor(xp) - floor)
  const required = ceiling - floor
  return { level, current, required, percent: Math.min(100, Math.round((current / required) * 100)) }
}

export function gameRank(level: number) {
  if (level >= 20) return 'Guardián del conocimiento'
  if (level >= 12) return 'Explorador experto'
  if (level >= 7) return 'Aventurero avanzado'
  if (level >= 3) return 'Aprendiz explorador'
  return 'Recluta de LEVEL UP'
}

export const GAME_UNLOCKS = [
  { level: 1, id: 'learning-worlds', label: '5 mundos de aprendizaje', icon: '🗺️' },
  { level: 2, id: 'shop', label: 'Tienda del Explorador', icon: '🏪' },
  { level: 3, id: 'base-forest', label: 'Refugio Bosque', icon: '🌲' },
  { level: 5, id: 'base-arcade', label: 'Refugio Arcade', icon: '🕹️' },
  { level: 7, id: 'elite-missions', label: 'Misiones de élite', icon: '⚡' },
] as const

export function unlockedGameFeatures(level: number) {
  return GAME_UNLOCKS.filter((unlock) => level >= unlock.level)
}

export function nextGameUnlock(level: number) {
  return GAME_UNLOCKS.find((unlock) => level < unlock.level) ?? null
}
