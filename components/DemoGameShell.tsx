'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { isAuthenticationExpired, userFacingError } from '@/lib/userFacingError'
import {
  DemoGameState,
  INITIAL_DEMO_STATE,
  demoStorageKey,
  demoAvatarById,
  equippedDemoItems,
  normalizeDemoState,
} from '@/lib/demoGame'

export type DemoPlayer = { id: string; alias: string; xp: number }

export function useDemoGamePlayer() {
  const router = useRouter()
  const [player, setPlayer] = useState<DemoPlayer | null>(null)
  const [game, setGame] = useState<DemoGameState>(INITIAL_DEMO_STATE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      const supabase = createSupabaseBrowserClient()
      if (!supabase) { setError('No se pudo conectar con LEVEL UP.'); setLoading(false); return }
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (!user && (!userError || isAuthenticationExpired(userError))) { router.replace('/login'); return }
      if (userError || !user) { setError(userFacingError(userError, 'No se pudo comprobar tu sesión.')); setLoading(false); return }

      const playerId = localStorage.getItem('levelup_player_id')
      if (!playerId) { router.replace('/parent/setup'); return }
      const { data, error: playerError } = await supabase
        .from('players')
        .select('id,alias,xp')
        .eq('id', playerId)
        .maybeSingle()
      if (playerError || !data) {
        localStorage.removeItem('levelup_player_id')
        setError(userFacingError(playerError, 'No se pudo abrir el mundo del jugador.'))
        setLoading(false)
        return
      }
      const selected = data as DemoPlayer
      setPlayer(selected)
      try {
        const saved = localStorage.getItem(demoStorageKey(selected.id))
        setGame(saved ? normalizeDemoState(JSON.parse(saved)) : INITIAL_DEMO_STATE)
      } catch {
        setGame(INITIAL_DEMO_STATE)
      }
      setLoading(false)
    })()
  }, [router])

  function saveGame(next: DemoGameState) {
    if (!player) return
    setGame(next)
    localStorage.setItem(demoStorageKey(player.id), JSON.stringify(next))
  }

  return { player, game, saveGame, loading, error }
}

export function DemoLoading() {
  return <section className="card loading-card" role="status"><div><div className="loading-dot" aria-hidden="true" /><p className="muted">Abriendo el mundo…</p></div></section>
}

export function DemoAvatar({ player, game }: { player: DemoPlayer; game: DemoGameState }) {
  const equipped = equippedDemoItems(game)
  const avatar = demoAvatarById(game.avatarId)
  return (
    <div className="game-avatar" aria-label={`Avatar de ${player.alias}`}>
      <span className="avatar-face" aria-hidden="true">{avatar.icon}</span>
      <span className="avatar-name">{player.alias}</span>
      <span className="avatar-items" aria-label="Objetos equipados">{equipped.map((item) => item.icon).join(' ')}</span>
    </div>
  )
}

export function DemoHud({ player, game }: { player: DemoPlayer; game: DemoGameState }) {
  return (
    <div className="game-hud">
      <div><span aria-hidden="true">⭐</span><b>{player.xp.toLocaleString('es-ES')} XP</b></div>
      <div><span aria-hidden="true">🪙</span><b>{game.coins}</b><small> monedas demo</small></div>
    </div>
  )
}
