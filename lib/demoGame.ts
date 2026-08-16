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
}

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

export function equippedDemoItems(state: DemoGameState) {
  return Object.values(state.equipped)
    .map((id) => DEMO_ITEMS.find((item) => item.id === id))
    .filter((item): item is DemoItem => Boolean(item))
}
