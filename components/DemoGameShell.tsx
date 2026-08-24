'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { gameRank, levelProgress } from '@/lib/gameProgression'

export type DemoPlayer = { id: string; alias: string; xp: number; level: number; coins: number }

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
      const [
        { data, error: playerError },
        { data: inventory, error: inventoryError },
        { data: missions, error: missionsError },
      ] = await Promise.all([
        supabase.from('players').select('id,alias,xp,level,coins').eq('id', playerId).maybeSingle(),
        supabase.from('player_inventory').select('item_id,slot,equipped').eq('player_id', playerId),
        supabase.from('study_sessions').select('id,ended_at,xp_earned,coins_earned').eq('player_id', playerId).eq('completed', true).eq('phase', 'done').order('ended_at', { ascending: false }).limit(20),
      ])
      if (playerError || !data) {
        localStorage.removeItem('levelup_player_id')
        setError(userFacingError(playerError, 'No se pudo abrir el mundo del jugador.'))
        setLoading(false)
        return
      }
      const selected: DemoPlayer = {
        id: data.id,
        alias: data.alias,
        xp: Number(data.xp ?? 0),
        level: Number(data.level ?? 1),
        coins: Number(data.coins ?? 0),
      }
      setPlayer(selected)
      try {
        const saved = localStorage.getItem(demoStorageKey(selected.id))
        const localGame = saved ? normalizeDemoState(JSON.parse(saved)) : INITIAL_DEMO_STATE
        if (inventoryError || missionsError) throw inventoryError ?? missionsError
        const rows = inventory ?? []
        const serverGame = normalizeDemoState({
          ...localGame,
          coins: Number(selected.coins ?? 0),
          owned: rows.map((item) => item.item_id),
          equipped: Object.fromEntries(rows.filter((item) => item.equipped).map((item) => [item.slot, item.item_id])),
          rewardedSessions: (missions ?? []).map((mission) => mission.id),
          missionHistory: (missions ?? []).map((mission) => ({
            sessionId: mission.id,
            completedAt: mission.ended_at ?? new Date().toISOString(),
            correct: 0,
            xp: Number(mission.xp_earned ?? 0),
            reward: Number(mission.coins_earned ?? 0),
          })).reverse(),
        })
        setGame(serverGame)
        localStorage.setItem(demoStorageKey(selected.id), JSON.stringify(serverGame))
      } catch {
        setError('No se pudo sincronizar la progresión del juego.')
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

export function DemoHud({ player, game, onToggleSound }: { player: DemoPlayer; game: DemoGameState; onToggleSound?: () => void }) {
  const progress = levelProgress(player.xp, player.level)
  return (
    <div className="game-hud">
      <div title={`${progress.current}/${progress.required || 0} XP hacia el siguiente nivel`}><span aria-hidden="true">⭐</span><b>Nivel {progress.level}</b><small> · {gameRank(progress.level)}</small></div>
      <div><span aria-hidden="true">⚡</span><b>{player.xp.toLocaleString('es-ES')} XP</b></div>
      <div><span aria-hidden="true">🪙</span><b>{game.coins}</b><small> monedas</small></div>
      {onToggleSound && <button className="sound-toggle" type="button" onClick={onToggleSound} aria-pressed={game.soundEnabled} aria-label={game.soundEnabled ? 'Desactivar sonidos' : 'Activar sonidos'}>{game.soundEnabled ? '🔊' : '🔇'} <small>{game.soundEnabled ? 'sonido' : 'sin sonido'}</small></button>}
    </div>
  )
}

export function DemoGameDock({ active }: { active?: 'world' | 'mission' | 'base' | 'shop' }) {
  return (
    <nav className="game-dock" aria-label="Navegación del juego">
      <Link href="/world" aria-current={active === 'world' ? 'page' : undefined}>🗺️ <span>MAPA</span></Link>
      <Link href="/mission/briefing" aria-current={active === 'mission' ? 'page' : undefined}>📋 <span>MISIÓN</span></Link>
      <Link href="/base" aria-current={active === 'base' ? 'page' : undefined}>🚀 <span>REFUGIO</span></Link>
      <Link href="/shop" aria-current={active === 'shop' ? 'page' : undefined}>🛒 <span>TIENDA</span></Link>
    </nav>
  )
}
