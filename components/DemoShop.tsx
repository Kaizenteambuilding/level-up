'use client'

import Link from 'next/link'
import { useState } from 'react'
import { buyDemoItem, DEMO_ITEMS, equipDemoItem, equippedDemoItems } from '@/lib/demoGame'
import { DemoAvatar, DemoHud, DemoLoading, useDemoGamePlayer } from './DemoGameShell'

export default function DemoShop() {
  const { player, game, saveGame, loading, error } = useDemoGamePlayer()
  const [message, setMessage] = useState('')
  if (loading) return <DemoLoading />
  if (!player || error) return <section className="card" role="alert"><h1>No se pudo abrir la tienda</h1><p className="muted">{error}</p><Link href="/world" className="btn primary">VOLVER AL MAPA</Link></section>

  const equipped = new Set(equippedDemoItems(game).map((item) => item.id))
  function buy(itemId: string) {
    const item = DEMO_ITEMS.find((entry) => entry.id === itemId)
    const next = buyDemoItem(game, itemId)
    if (next === game) { setMessage(item && game.coins < item.price ? 'No quedan suficientes monedas demo.' : 'Ese objeto ya está en tu mochila.'); return }
    saveGame(next)
    setMessage(`${item?.name} añadido y equipado.`)
  }
  function equip(itemId: string) {
    const item = DEMO_ITEMS.find((entry) => entry.id === itemId)
    saveGame(equipDemoItem(game, itemId))
    setMessage(`${item?.name} equipado.`)
  }

  return (
    <>
      <section className="card shop-header">
        <div><span className="tag">TIENDA · DEMO</span><h1>Equipo del Explorador</h1><p className="muted">Personaliza el avatar sin afectar al progreso académico.</p></div>
        <DemoAvatar player={player} game={game} />
        <DemoHud player={player} game={game} />
      </section>
      {message && <p className="status" role="status" aria-live="polite">{message}</p>}
      <section className="shop-grid" aria-label="Objetos de la tienda">
        {DEMO_ITEMS.map((item) => {
          const owned = game.owned.includes(item.id)
          const isEquipped = equipped.has(item.id)
          return (
            <article className="card shop-item" key={item.id}>
              <span className="shop-item-icon" aria-hidden="true">{item.icon}</span>
              <span className="tag">{item.slot === 'head' ? 'CABEZA' : item.slot === 'companion' ? 'COMPAÑERO' : 'ESTELA'}</span>
              <h2>{item.name}</h2>
              <p className="muted">{item.description}</p>
              {isEquipped ? <button className="btn dark" type="button" disabled>✓ EQUIPADO</button> : owned ? <button className="btn primary" type="button" onClick={() => equip(item.id)}>EQUIPAR</button> : <button className="btn primary" type="button" onClick={() => buy(item.id)} disabled={game.coins < item.price}>🪙 {item.price} · COMPRAR</button>}
            </article>
          )
        })}
      </section>
      <section className="card" id="inventory">
        <span className="tag">🎒 MOCHILA</span><h2>Objetos conseguidos</h2>
        {game.owned.length ? <p className="inventory-icons">{game.owned.map((id) => DEMO_ITEMS.find((item) => item.id === id)?.icon).join(' ')}</p> : <p className="muted">Todavía no has elegido ningún objeto.</p>}
        <div className="action-row"><Link href="/base" className="btn primary">VER EN EL REFUGIO</Link><Link href="/world" className="btn dark">← VOLVER AL MAPA</Link></div>
      </section>
      <p className="demo-notice">Las 450 monedas son parte de la demo y se guardan únicamente en este navegador.</p>
    </>
  )
}
