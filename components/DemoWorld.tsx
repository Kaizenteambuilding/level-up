'use client'

import Link from 'next/link'
import { DemoAvatar, DemoHud, DemoLoading, useDemoGamePlayer } from './DemoGameShell'

const lockedZones = [
  { name: 'Biblioteca de Lengua', icon: '📚', className: 'language-zone' },
  { name: 'Puerto de Inglés', icon: '🌍', className: 'english-zone' },
  { name: 'Laboratorio de Ciencias', icon: '🔬', className: 'science-zone' },
  { name: 'Taller creativo', icon: '🎨', className: 'creative-zone' },
]

export default function DemoWorld() {
  const { player, game, loading, error } = useDemoGamePlayer()
  if (loading) return <DemoLoading />
  if (!player || error) return <section className="card" role="alert"><h1>No se pudo abrir el mundo</h1><p className="muted">{error}</p><Link href="/player" className="btn primary">VOLVER AL JUGADOR</Link></section>

  return (
    <>
      <section className="game-world" aria-labelledby="world-title">
        <div className="world-sky" aria-hidden="true" />
        <div className="world-topbar">
          <DemoAvatar player={player} game={game} />
          <DemoHud player={player} game={game} />
        </div>
        <div className="world-heading">
          <span className="tag">DEMO JUGABLE · V1.2</span>
          <h1 id="world-title">Mundo de {player.alias}</h1>
          <p>Elige un destino. Matemáticas ya está conectado al motor real.</p>
        </div>
        <div className="world-map">
          <article className="world-zone math-zone unlocked">
            <span className="zone-icon" aria-hidden="true">🏙️</span>
            <span className="zone-state">ZONA ACTIVA</span>
            <h2>Ciudad Matemática</h2>
            <p>Misiones adaptativas, progreso real y recompensas académicas.</p>
            <div className="action-row">
              <Link href="/mission/briefing" className="btn primary">▶ MISIÓN DIARIA</Link>
              <Link href="/player" className="btn dark">VER PROGRESO</Link>
            </div>
          </article>
          {lockedZones.map((zone) => (
            <article className={`world-zone locked ${zone.className}`} key={zone.name} aria-disabled="true">
              <span className="zone-icon" aria-hidden="true">{zone.icon}</span>
              <span className="zone-state">🔒 PRÓXIMAMENTE</span>
              <h2>{zone.name}</h2>
              <p>Territorio visible para una futura expansión.</p>
            </article>
          ))}
          <Link href="/shop" className="world-zone shop-zone unlocked">
            <span className="zone-icon" aria-hidden="true">🏪</span>
            <span className="zone-state">ABIERTO</span>
            <h2>Tienda del Explorador</h2>
            <p>Prueba objetos cosméticos con las monedas de demostración.</p>
          </Link>
          <Link href="/base" className="world-zone base-zone unlocked">
            <span className="zone-icon" aria-hidden="true">🚀</span>
            <span className="zone-state">TU ESPACIO</span>
            <h2>Refugio del Explorador</h2>
            <p>Viste el avatar, abre la mochila y personaliza tu base.</p>
          </Link>
        </div>
      </section>
      <nav className="game-dock" aria-label="Navegación del mundo">
        <Link href="/world" aria-current="page">🗺️ <span>MAPA</span></Link>
        <Link href="/mission/briefing">📋 <span>MISIÓN</span></Link>
        <Link href="/base">🚀 <span>REFUGIO</span></Link>
        <Link href="/shop">🛒 <span>TIENDA</span></Link>
      </nav>
      <p className="demo-notice">Demo visual: las compras se guardan solo en este navegador y no modifican XP ni datos académicos.</p>
    </>
  )
}
