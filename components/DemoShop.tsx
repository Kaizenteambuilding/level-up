'use client'

import Link from 'next/link'
import { useState } from 'react'
import { DEMO_ITEMS, equippedDemoItems } from '@/lib/demoGame'
import { DemoAvatar, DemoGameDock, DemoHud, DemoLoading, useDemoGamePlayer } from './DemoGameShell'
import { playDemoSound } from '@/lib/demoSound'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { userFacingError } from '@/lib/userFacingError'

export default function DemoShop() {
  const { player, game, saveGame, loading, error } = useDemoGamePlayer()
  const [message, setMessage] = useState('')
  const [savingItemId, setSavingItemId] = useState<string | null>(null)
  if (loading) return <DemoLoading />
  if (!player || error) return <section className="card" role="alert"><h1>No se pudo abrir la tienda</h1><p className="muted">{error}</p><Link href="/world" className="btn primary">VOLVER AL MAPA</Link></section>

  const playerId = player.id
  const equipped = new Set(equippedDemoItems(game).map((item) => item.id))
  async function buy(itemId: string) {
    const item = DEMO_ITEMS.find((entry) => entry.id === itemId)
    if (!item || savingItemId) return
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return
    setSavingItemId(itemId)
    setMessage('')
    const { data, error: purchaseError } = await supabase.rpc('purchase_levelup_item', { p_player_id: playerId, p_item_id: itemId })
    setSavingItemId(null)
    if (purchaseError) { setMessage(userFacingError(purchaseError, 'No se pudo comprar el objeto.')); return }
    const result = data as { coins?: number; slot?: 'head' | 'companion' | 'trail' }
    saveGame({ ...game, coins: Number(result.coins ?? game.coins), owned: [...game.owned, itemId], equipped: { ...game.equipped, [result.slot ?? item.slot]: itemId } })
    playDemoSound(game.soundEnabled, 'reward')
    setMessage(`${item?.name} añadido y equipado.`)
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

  return (
    <>
      <section className="card shop-header">
        <div><span className="tag">TIENDA DEL EXPLORADOR</span><h1>Equipo del Explorador</h1><p className="muted">Las monedas y los objetos se guardan en tu cuenta sin afectar al progreso académico.</p></div>
        <DemoAvatar player={player} game={game} />
        <DemoHud player={player} game={game} />
      </section>
      {message && <p className="status" role="status" aria-live="polite">{message}</p>}
      <section className="shop-grid" aria-label="Objetos de la tienda">
        {DEMO_ITEMS.map((item) => {
          const owned = game.owned.includes(item.id)
          const isEquipped = equipped.has(item.id)
          const levelLocked = player.level < item.minimumLevel
          return (
            <article className="card shop-item" key={item.id}>
              <span className="shop-item-icon" aria-hidden="true">{item.icon}</span>
              <span className="tag">{item.slot === 'head' ? 'CABEZA' : item.slot === 'companion' ? 'COMPAÑERO' : 'ESTELA'}</span>
              <h2>{item.name}</h2>
              <p className="muted">{item.description}</p>
              {levelLocked ? <button className="btn dark" type="button" disabled>🔒 NIVEL {item.minimumLevel}</button> : isEquipped ? <button className="btn dark" type="button" disabled>✓ EQUIPADO</button> : owned ? <button className="btn primary" type="button" onClick={() => equip(item.id)} disabled={savingItemId !== null}>{savingItemId === item.id ? 'EQUIPANDO…' : 'EQUIPAR'}</button> : <button className="btn primary" type="button" onClick={() => buy(item.id)} disabled={savingItemId !== null || game.coins < item.price}>{savingItemId === item.id ? 'COMPRANDO…' : `🪙 ${item.price} · COMPRAR`}</button>}
            </article>
          )
        })}
      </section>
      <section className="card" id="inventory">
        <span className="tag">🎒 MOCHILA</span><h2>Objetos conseguidos</h2>
        {game.owned.length ? <p className="inventory-icons">{game.owned.map((id) => DEMO_ITEMS.find((item) => item.id === id)?.icon).join(' ')}</p> : <p className="muted">Todavía no has elegido ningún objeto.</p>}
        <div className="action-row"><Link href="/base" className="btn primary">VER EN EL REFUGIO</Link><Link href="/world" className="btn dark">← VOLVER AL MAPA</Link></div>
      </section>
      <DemoGameDock active="shop" />
      <p className="demo-notice">Compras protegidas: el servidor valida nivel, saldo y propiedad antes de guardar cada objeto.</p>
    </>
  )
}
