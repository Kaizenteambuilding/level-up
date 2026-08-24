export type DemoItem = {
  id: string
  name: string
  description: string
  icon: string
  price: number
  slot: 'head' | 'companion' | 'trail'
}

export type DemoGameState = {
  coins: number
  owned: string[]
  equipped: Partial<Record<DemoItem['slot'], string>>
  rewardedSessions: string[]
  baseTheme: DemoBaseTheme
  visitedThemes: DemoBaseTheme[]
  avatarId: DemoAvatarId
  missionHistory: DemoMissionRecord[]
  soundEnabled: boolean
}

export type DemoMissionRecord = {
  sessionId: string
  completedAt: string
  correct: number
  xp: number
  reward: number
}

export type DemoBaseTheme = 'space' | 'forest' | 'arcade'
export type DemoAvatarId = 'astronaut' | 'ninja' | 'mage' | 'scientist'

export const DEMO_AVATARS = [
  { id: 'astronaut', name: 'Explorador espacial', icon: '🧑‍🚀', description: 'Listo para descubrir nuevos mundos.' },
  { id: 'ninja', name: 'Ninja del conocimiento', icon: '🥷', description: 'Precisión y concentración en cada reto.' },
  { id: 'mage', name: 'Mago de los números', icon: '🧙‍♂️', description: 'Convierte problemas en soluciones.' },
  { id: 'scientist', name: 'Científico inventor', icon: '🧑‍🔬', description: 'Experimenta, aprende y mejora.' },
] as const

export const DEMO_ITEMS: DemoItem[] = [
  { id: 'headphones', name: 'Auriculares neón', description: 'Para explorar con ritmo.', icon: '🎧', price: 90, slot: 'head' },
  { id: 'wizard-hat', name: 'Sombrero de sabio', description: 'Un clásico para grandes retos.', icon: '🧙', price: 120, slot: 'head' },
  { id: 'robot', name: 'Compañero robot', description: 'Te acompaña por todo el mapa.', icon: '🤖', price: 160, slot: 'companion' },
  { id: 'fox', name: 'Zorro explorador', description: 'Especialista en encontrar caminos.', icon: '🦊', price: 140, slot: 'companion' },
  { id: 'sparkles', name: 'Estela estelar', description: 'Deja un rastro brillante al avanzar.', icon: '✨', price: 75, slot: 'trail' },
  { id: 'fire', name: 'Estela de energía', description: 'Para misiones especialmente intensas.', icon: '🔥', price: 110, slot: 'trail' },
]

export const INITIAL_DEMO_STATE: DemoGameState = {
  coins: 450,
  owned: [],
  equipped: {},
  rewardedSessions: [],
  baseTheme: 'space',
  visitedThemes: [],
  avatarId: 'astronaut',
  missionHistory: [],
  soundEnabled: false,
}

export function demoStorageKey(playerId: string) {
  return `levelup_demo_game:${playerId}`
}

export function normalizeDemoState(value: unknown): DemoGameState {
  if (!value || typeof value !== 'object') return { ...INITIAL_DEMO_STATE }
  const candidate = value as Partial<DemoGameState>
  const validIds = new Set(DEMO_ITEMS.map((item) => item.id))
  const owned = Array.isArray(candidate.owned)
    ? Array.from(new Set(candidate.owned.filter((id): id is string => typeof id === 'string' && validIds.has(id))))
    : []
  const equipped: DemoGameState['equipped'] = {}
  for (const slot of ['head', 'companion', 'trail'] as const) {
    const id = candidate.equipped?.[slot]
    const item = DEMO_ITEMS.find((entry) => entry.id === id && entry.slot === slot)
    if (item && owned.includes(item.id)) equipped[slot] = item.id
  }
  return {
    coins: Number.isFinite(Number(candidate.coins))
      ? Math.max(0, Math.min(9999, Math.floor(Number(candidate.coins))))
      : INITIAL_DEMO_STATE.coins,
    owned,
    equipped,
    rewardedSessions: Array.isArray(candidate.rewardedSessions)
      ? Array.from(new Set(candidate.rewardedSessions.filter((id): id is string => typeof id === 'string' && id.length > 0))).slice(-100)
      : [],
    baseTheme: candidate.baseTheme === 'forest' || candidate.baseTheme === 'arcade' ? candidate.baseTheme : 'space',
    visitedThemes: Array.isArray(candidate.visitedThemes)
      ? Array.from(new Set(candidate.visitedThemes.filter((theme): theme is DemoBaseTheme => theme === 'space' || theme === 'forest' || theme === 'arcade')))
      : [],
    avatarId: candidate.avatarId === 'ninja' || candidate.avatarId === 'mage' || candidate.avatarId === 'scientist' ? candidate.avatarId : 'astronaut',
    missionHistory: Array.isArray(candidate.missionHistory)
      ? candidate.missionHistory.flatMap((entry) => {
          if (!entry || typeof entry !== 'object') return []
          const record = entry as Partial<DemoMissionRecord>
          if (typeof record.sessionId !== 'string' || !record.sessionId || typeof record.completedAt !== 'string' || Number.isNaN(Date.parse(record.completedAt))) return []
          return [{
            sessionId: record.sessionId,
            completedAt: record.completedAt,
            correct: Math.max(0, Math.min(10, Math.floor(Number(record.correct) || 0))),
            xp: Math.max(0, Math.min(9999, Math.floor(Number(record.xp) || 0))),
            reward: Math.max(0, Math.min(90, Math.floor(Number(record.reward) || 0))),
          }]
        }).slice(-20)
      : [],
    soundEnabled: candidate.soundEnabled === true,
  }
}

export function awardDemoMission(state: DemoGameState, sessionId: string, correct: number, xp = 0, completedAt = new Date().toISOString()) {
  if (!sessionId || state.rewardedSessions.includes(sessionId)) return { state, reward: 0 }
  const safeCorrect = Math.max(0, Math.min(10, Math.floor(correct)))
  const reward = 40 + safeCorrect * 5
  const record: DemoMissionRecord = {
    sessionId,
    completedAt: Number.isNaN(Date.parse(completedAt)) ? new Date().toISOString() : completedAt,
    correct: safeCorrect,
    xp: Number.isFinite(xp) ? Math.max(0, Math.min(9999, Math.floor(xp))) : 0,
    reward,
  }
  return {
    reward,
    state: {
      ...state,
      coins: Math.min(9999, state.coins + reward),
      rewardedSessions: [...state.rewardedSessions, sessionId].slice(-100),
      missionHistory: [...state.missionHistory, record].slice(-20),
    },
  }
}

export function buyDemoItem(state: DemoGameState, itemId: string) {
  const item = DEMO_ITEMS.find((entry) => entry.id === itemId)
  if (!item || state.owned.includes(itemId) || state.coins < item.price) return state
  return {
    ...state,
    coins: state.coins - item.price,
    owned: [...state.owned, item.id],
    equipped: { ...state.equipped, [item.slot]: item.id },
  }
}

export function equipDemoItem(state: DemoGameState, itemId: string) {
  const item = DEMO_ITEMS.find((entry) => entry.id === itemId)
  if (!item || !state.owned.includes(itemId)) return state
  return { ...state, equipped: { ...state.equipped, [item.slot]: item.id } }
}

export function setDemoBaseTheme(state: DemoGameState, theme: string): DemoGameState {
  if (theme !== 'space' && theme !== 'forest' && theme !== 'arcade') return state
  return {
    ...state,
    baseTheme: theme,
    visitedThemes: state.visitedThemes.includes(theme) ? state.visitedThemes : [...state.visitedThemes, theme],
  }
}

export function setDemoAvatar(state: DemoGameState, avatarId: string): DemoGameState {
  if (!DEMO_AVATARS.some((avatar) => avatar.id === avatarId)) return state
  return { ...state, avatarId: avatarId as DemoAvatarId }
}

export function demoAvatarById(avatarId: string) {
  return DEMO_AVATARS.find((avatar) => avatar.id === avatarId) ?? DEMO_AVATARS[0]
}

export function toggleDemoSound(state: DemoGameState): DemoGameState {
  return { ...state, soundEnabled: !state.soundEnabled }
}

export type DemoAchievement = {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  progress: number
  target: number
}

export function demoAchievements(state: DemoGameState): DemoAchievement[] {
  const equippedSlots = Object.keys(state.equipped).length
  return [
    { id: 'first-mission', name: 'Energía restaurada', description: 'Completa una misión de Ciudad Matemática.', icon: '⚡', unlocked: state.rewardedSessions.length >= 1, progress: Math.min(1, state.rewardedSessions.length), target: 1 },
    { id: 'three-missions', name: 'Constancia matemática', description: 'Completa tres misiones diferentes.', icon: '🏙️', unlocked: state.rewardedSessions.length >= 3, progress: Math.min(3, state.rewardedSessions.length), target: 3 },
    { id: 'first-item', name: 'Primer hallazgo', description: 'Consigue tu primer objeto en la tienda.', icon: '🎁', unlocked: state.owned.length >= 1, progress: Math.min(1, state.owned.length), target: 1 },
    { id: 'collector', name: 'Coleccionista', description: 'Reúne tres objetos cosméticos.', icon: '🎒', unlocked: state.owned.length >= 3, progress: Math.min(3, state.owned.length), target: 3 },
    { id: 'full-loadout', name: 'Explorador equipado', description: 'Equipa cabeza, compañero y estela.', icon: '🧑‍🚀', unlocked: equippedSlots >= 3, progress: Math.min(3, equippedSlots), target: 3 },
    { id: 'decorator', name: 'Diseñador de refugios', description: 'Prueba los tres ambientes del refugio.', icon: '🚀', unlocked: state.visitedThemes.length >= 3, progress: Math.min(3, state.visitedThemes.length), target: 3 },
  ]
}

export type DemoGuideStep = { id: string; title: string; message: string; href: string; action: string; icon: string }

export function demoGuideStep(state: DemoGameState): DemoGuideStep {
  if (state.rewardedSessions.length === 0) return { id: 'first-mission', title: 'La ciudad necesita energía', message: 'Completa tu primera misión adaptativa para activar el núcleo y ganar monedas.', href: '/mission/briefing', action: 'ABRIR PRIMERA MISIÓN', icon: '⚡' }
  if (state.owned.length === 0) return { id: 'first-item', title: 'Tienes una recompensa esperándote', message: 'Ya hay monedas en tu cartera. Elige tu primer objeto en la Tienda del Explorador.', href: '/shop', action: 'VISITAR LA TIENDA', icon: '🎁' }
  if (Object.keys(state.equipped).length < 3) return { id: 'full-loadout', title: 'Completa tu equipamiento', message: 'Consigue y combina un objeto de cabeza, un compañero y una estela.', href: '/shop', action: 'BUSCAR EQUIPO', icon: '🎒' }
  if (state.visitedThemes.length < 3) return { id: 'themes', title: 'Haz tuyo el refugio', message: 'Prueba los ambientes del refugio y descubre cuál encaja mejor con tu explorador.', href: '/base', action: 'PERSONALIZAR REFUGIO', icon: '🚀' }
  if (state.rewardedSessions.length < 3) return { id: 'three-missions', title: 'La constancia abre caminos', message: `Has completado ${state.rewardedSessions.length} de 3 expediciones para el siguiente logro.`, href: '/mission/briefing', action: 'CONTINUAR AVENTURA', icon: '🏙️' }
  const pending = demoAchievements(state).find((achievement) => !achievement.unlocked)
  if (pending) return { id: pending.id, title: `Siguiente logro: ${pending.name}`, message: pending.description, href: '/achievements', action: 'VER BITÁCORA', icon: pending.icon }
  return { id: 'complete', title: 'Explorador de élite', message: 'Has completado todos los objetivos actuales. Sigue entrenando mientras se preparan nuevas zonas.', href: '/math-city', action: 'EXPLORAR LA CIUDAD', icon: '🏆' }
}

export function equippedDemoItems(state: DemoGameState) {
  return Object.values(state.equipped)
    .map((id) => DEMO_ITEMS.find((item) => item.id === id))
    .filter((item): item is DemoItem => Boolean(item))
}
