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

export type DemoPlayer = { id: string; alias: string; xp: number; level: number; coins: number; onboardingCompleted: boolean; streakDays: number; totalMissions: number }

export function useDemoGamePlayer(options: { allowIncompleteOnboarding?: boolean } = {}) {
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
        { data: summary },
      ] = await Promise.all([
        supabase.from('players').select('id,alias,xp,level,coins,avatar').eq('id', playerId).maybeSingle(),
        supabase.from('player_inventory').select('item_id,slot,equipped').eq('player_id', playerId),
        supabase.from('study_sessions').select('id,ended_at,xp_earned,coins_earned').eq('player_id', playerId).eq('completed', true).eq('phase', 'done').order('ended_at', { ascending: false }).limit(20),
        supabase.rpc('get_levelup_game_summary', { p_player_id: playerId }),
      ])
      if (playerError || !data) {
        localStorage.removeItem('levelup_player_id')
        setError(userFacingError(playerError, 'No se pudo abrir el mundo del jugador.'))
        setLoading(false)
        return
      }
      const avatar = data.avatar && typeof data.avatar === 'object' && !Array.isArray(data.avatar) ? data.avatar as Record<string, unknown> : {}
      const selected: DemoPlayer = {
        id: data.id,
        alias: data.alias,
        xp: Number(data.xp ?? 0),
        level: Number(data.level ?? 1),
        coins: Number(data.coins ?? 0),
        onboardingCompleted: avatar.onboarding_completed === true,
        streakDays: Number((summary as { streak_days?: number } | null)?.streak_days ?? 0),
        totalMissions: Number((summary as { total_missions?: number } | null)?.total_missions ?? missions?.length ?? 0),
      }
      if (!selected.onboardingCompleted && !options.allowIncompleteOnboarding) { router.replace('/onboarding'); return }
      setPlayer(selected)
      try {
        const saved = localStorage.getItem(demoStorageKey(selected.id))
        const localGame = saved ? normalizeDemoState(JSON.parse(saved)) : INITIAL_DEMO_STATE
        // Inventory, history and HUD summaries enrich the game, but none of them
        // is required to open the player's world. A transient failure must keep
        // the last safe local snapshot instead of blocking onboarding.
        const safeMissions = missionsError ? [] : (missions ?? [])
        const missionIds = safeMissions.map((mission) => mission.id)
        const { data: missionAttempts, error: attemptsError } = missionIds.length
          ? await supabase.from('attempts').select('session_id,correct').in('session_id', missionIds)
          : { data: [], error: null }
        const correctBySession = (attemptsError ? [] : (missionAttempts ?? [])).reduce<Record<string, number>>((summary, attempt) => {
          if (attempt.correct === true && attempt.session_id) summary[attempt.session_id] = (summary[attempt.session_id] ?? 0) + 1
          return summary
        }, {})
        const rows = inventoryError ? null : (inventory ?? [])
        const localCorrectBySession = Object.fromEntries(localGame.missionHistory.map((mission) => [mission.sessionId, mission.correct]))
        const serverGame = normalizeDemoState({
          ...localGame,
          avatarId: typeof avatar.avatar_id === 'string' ? avatar.avatar_id : localGame.avatarId,
          baseTheme: typeof avatar.base_theme === 'string' ? avatar.base_theme : localGame.baseTheme,
          soundEnabled: typeof avatar.sound_enabled === 'boolean' ? avatar.sound_enabled : localGame.soundEnabled,
          coins: Number(selected.coins ?? 0),
          owned: rows ? rows.map((item) => item.item_id) : localGame.owned,
          equipped: rows ? Object.fromEntries(rows.filter((item) => item.equipped).map((item) => [item.slot, item.item_id])) : localGame.equipped,
          rewardedSessions: missionsError ? localGame.rewardedSessions : safeMissions.map((mission) => mission.id),
          missionHistory: missionsError ? localGame.missionHistory : safeMissions.map((mission) => ({
            sessionId: mission.id,
            completedAt: mission.ended_at ?? new Date().toISOString(),
            correct: correctBySession[mission.id] ?? localCorrectBySession[mission.id] ?? 0,
            xp: Number(mission.xp_earned ?? 0),
            reward: Number(mission.coins_earned ?? 0),
          })).reverse(),
        })
        setGame(serverGame)
        localStorage.setItem(demoStorageKey(selected.id), JSON.stringify(serverGame))
      } catch {
        // A corrupt browser snapshot is recoverable. The authoritative player
        // record has already loaded, so start from a clean game state.
        const fallbackGame = normalizeDemoState({
          ...INITIAL_DEMO_STATE,
          avatarId: typeof avatar.avatar_id === 'string' ? avatar.avatar_id : INITIAL_DEMO_STATE.avatarId,
          baseTheme: typeof avatar.base_theme === 'string' ? avatar.base_theme : INITIAL_DEMO_STATE.baseTheme,
          soundEnabled: typeof avatar.sound_enabled === 'boolean' ? avatar.sound_enabled : INITIAL_DEMO_STATE.soundEnabled,
          coins: selected.coins,
        })
        setGame(fallbackGame)
        localStorage.setItem(demoStorageKey(selected.id), JSON.stringify(fallbackGame))
      }
      setLoading(false)
    })()
  }, [router, options.allowIncompleteOnboarding])

  function saveGame(next: DemoGameState) {
    if (!player) return
    setGame(next)
    localStorage.setItem(demoStorageKey(player.id), JSON.stringify(next))
  }

  return { player, game, saveGame, loading, error }
}

export function DemoLoading() {
  return <section className="card loading-card" role="status" aria-live="polite"><div><div className="loading-dot" aria-hidden="true" /><p className="muted">Abriendo el mundo…</p></div></section>
}

export function DemoGameError({ title, message, backHref, backLabel }: { title: string; message?: string; backHref: string; backLabel: string }) {
  return <section className="card" role="alert" aria-live="assertive">
    <span className="tag">CONEXIÓN INTERRUMPIDA</span>
    <h1>{title}</h1>
    <p className="muted">{message || 'No se pudo cargar el jugador seleccionado.'}</p>
    <p className="muted">Tu progreso ya guardado sigue a salvo.</p>
    <div className="action-row">
      <button className="btn primary" type="button" onClick={() => window.location.reload()}>REINTENTAR</button>
      <Link href={backHref} className="btn dark">{backLabel}</Link>
    </div>
  </section>
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
      <div title="Días consecutivos con al menos una misión completa"><span aria-hidden="true">🔥</span><b>{player.streakDays}</b><small> días</small></div>
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
