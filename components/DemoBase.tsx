'use client'

import Link from 'next/link'
import { useState } from 'react'
import { DEMO_AVATARS, DEMO_ITEMS, demoAvatarById, equippedDemoItems, setDemoAvatar, setDemoBaseTheme } from '@/lib/demoGame'
import { DemoGameDock, DemoGameError, DemoHud, DemoLoading, useDemoGamePlayer } from './DemoGameShell'
import { playDemoSound } from '@/lib/demoSound'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { userFacingError } from '@/lib/userFacingError'

const THEMES = [
  { id: 'space', name: 'Estación orbital', icon: '🪐', minimumLevel: 1 },
  { id: 'forest', name: 'Bosque secreto', icon: '🌲', minimumLevel: 3 },
  { id: 'arcade', name: 'Sala arcade', icon: '🕹️', minimumLevel: 5 },
] as const

export default function DemoBase() {
  const { player, game, saveGame, loading, error } = useDemoGamePlayer()
  const [message, setMessage] = useState('')
  const [savingItemId, setSavingItemId] = useState<string | null>(null)
  if (loading) return <DemoLoading />
  if (!player || error) return <DemoGameError title="No se pudo abrir el refugio" message={error} backHref="/world" backLabel="VOLVER AL MAPA" />

  const playerId = player.id
  const playerLevel = player.level
  const equipped = equippedDemoItems(game)
  const head = equipped.find((item) => item.slot === 'head')
  const companion = equipped.find((item) => item.slot === 'companion')
  const trail = equipped.find((item) => item.slot === 'trail')
  const avatar = demoAvatarById(game.avatarId)

  async function chooseTheme(theme: string) {
    const selected = THEMES.find((entry) => entry.id === theme)
    if (!selected || playerLevel < selected.minimumLevel || savingItemId) return
    const supabase = createSupabaseBrowserClient()
    if (!supabase) { setMessage('No se pudo conectar con LEVEL UP.'); return }
    setSavingItemId(`theme:${theme}`)
    const { error: themeError } = await supabase.rpc('set_levelup_game_preferences', { p_player_id: playerId, p_base_theme: theme })
    setSavingItemId(null)
    if (themeError) { setMessage(userFacingError(themeError, 'No se pudo guardar el ambiente.')); return }
    saveGame(setDemoBaseTheme(game, theme))
    playDemoSound(game.soundEnabled, 'select')
    setMessage('Ambiente del refugio actualizado.')
  }

  async function equip(itemId: string) {
    const item = DEMO_ITEMS.find((entry) => entry.id === itemId)
    if (!item || savingItemId) return
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return
    setSavingItemId(itemId)
    setMessage('')
    const { error: equipError } = await supabase.rpc('equip_levelup_item', { p_player_id: playerId, p_item_id: itemId })
    setSavingItemId(null)
    if (equipError) { setMessage(userFacingError(equipError, 'No se pudo equipar el objeto.')); return }
    saveGame({ ...game, equipped: { ...game.equipped, [item.slot]: itemId } })
    playDemoSound(game.soundEnabled, 'select')
    setMessage(`${item?.name} equipado.`)
  }

  async function chooseAvatar(avatarId: string) {
    const selected = DEMO_AVATARS.find((entry) => entry.id === avatarId)
    if (!selected || savingItemId) return
    const supabase = createSupabaseBrowserClient()
    if (!supabase) { setMessage('No se pudo conectar con LEVEL UP.'); return }
    setSavingItemId(`avatar:${avatarId}`)
    const { error: avatarError } = await supabase.rpc('set_levelup_avatar', { p_player_id: playerId, p_avatar_id: avatarId })
    setSavingItemId(null)
    if (avatarError) { setMessage(userFacingError(avatarError, 'No se pudo guardar el personaje.')); return }
    saveGame(setDemoAvatar(game, avatarId))
    playDemoSound(game.soundEnabled, 'select')
    setMessage(`${selected?.name} seleccionado.`)
  }

  return (
    <>
      <section className={`player-base theme-${game.baseTheme}`}>
        <div className="base-stars" aria-hidden="true" />
        <header className="base-header"><div><span className="tag">🚀 REFUGIO DEL EXPLORADOR</span><h1>Base de {player.alias}</h1></div><DemoHud player={player} game={game} /></header>
        <div className="base-room">
          <div className="base-avatar" aria-label={`Avatar equipado de ${player.alias}`}>
            {head && <span className="base-head" aria-label={head.name}>{head.icon}</span>}
            <span className="base-character" aria-hidden="true">{avatar.icon}</span>
            {companion && <span className="base-companion" aria-label={companion.name}>{companion.icon}</span>}
            {trail && <span className="base-trail" aria-label={trail.name}>{trail.icon} ✦ ✧</span>}
            <b>{player.alias}</b>
          </div>
          <div className="base-console"><span>EXPEDICIÓN DIARIA</span><b>Misión de hoy</b><Link href="/mission/briefing" className="btn primary">ABRIR BRIEFING</Link></div>
        </div>
      </section>

      {message && <p className="status" role="status" aria-live="polite">{message}</p>}
      <section className="card base-customizer">
        <div className="avatar-customizer"><span className="tag">PROTAGONISTA</span><h2>Elige tu explorador</h2><div className="avatar-picker">{DEMO_AVATARS.map((entry) => <button key={entry.id} type="button" className={game.avatarId === entry.id ? 'selected' : ''} onClick={() => chooseAvatar(entry.id)} aria-pressed={game.avatarId === entry.id}><span>{entry.icon}</span><b>{entry.name}</b><small>{entry.description}</small></button>)}</div></div>
        <div><span className="tag">AMBIENTE</span><h2>Personaliza tu refugio</h2><div className="theme-picker">{THEMES.map((theme) => { const locked = player.level < theme.minimumLevel; return <button key={theme.id} type="button" disabled={locked} className={`theme-button${game.baseTheme === theme.id ? ' selected' : ''}`} onClick={() => chooseTheme(theme.id)} aria-pressed={game.baseTheme === theme.id}><span>{locked ? '🔒' : theme.icon}</span>{theme.name}{locked ? ` · nivel ${theme.minimumLevel}` : ''}</button> })}</div></div>
        <div><span className="tag">🎒 MOCHILA</span><h2>Elige tu equipo</h2>{game.owned.length ? <div className="base-inventory">{game.owned.map((id) => { const item = DEMO_ITEMS.find((entry) => entry.id === id); if (!item) return null; const active = equipped.some((entry) => entry.id === item.id); return <button key={item.id} type="button" disabled={savingItemId !== null} onClick={() => equip(item.id)} className={active ? 'selected' : ''} aria-pressed={active}><span>{item.icon}</span><small>{savingItemId === item.id ? 'Equipando…' : item.name}</small></button> })}</div> : <><p className="muted">Tu mochila está vacía. Visita la tienda para elegir equipo.</p><Link href="/shop" className="btn primary">IR A LA TIENDA</Link></>}</div>
      </section>
      <DemoGameDock active="base" />
      <p className="demo-notice">El personaje, ambiente, inventario y equipo se guardan en la cuenta y se recuperan en otros dispositivos.</p>
    </>
  )
}
