'use client'

import Link from 'next/link'
import { DemoAvatar, DemoGameDock, DemoHud, DemoLoading, useDemoGamePlayer } from './DemoGameShell'
import { demoAchievements, demoGuideStep, toggleDemoSound } from '@/lib/demoGame'
import { nextGameUnlock } from '@/lib/gameProgression'
import { playDemoSound } from '@/lib/demoSound'
import { WORLD_ZONES } from '@/lib/worldZones'

export default function DemoWorld() {
  const { player, game, saveGame, loading, error } = useDemoGamePlayer()
  if (loading) return <DemoLoading />
  if (!player || error) return <section className="card" role="alert"><h1>No se pudo abrir el mundo</h1><p className="muted">{error}</p><Link href="/player" className="btn primary">VOLVER AL JUGADOR</Link></section>
  if (!player.onboardingCompleted) return <section className="onboarding-gate card"><div className="nova-orb" aria-hidden="true">🤖</div><span className="tag">NOVA · MENSAJE NUEVO</span><h1>Tu mundo está listo</h1><p className="muted">Antes de explorar, elige tu personaje y completa una misión guiada. Tu progreso actual se conserva.</p><Link href="/onboarding" className="btn primary">COMENZAR AVENTURA</Link></section>
  const achievements = demoAchievements(game)
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked).length
  const guide = demoGuideStep(game, player.level)
  const nextUnlock = nextGameUnlock(player.level)

  return (
    <>
      <section className="game-world" aria-labelledby="world-title">
        <div className="world-sky" aria-hidden="true" />
        <div className="world-topbar">
          <DemoAvatar player={player} game={game} />
          <DemoHud player={player} game={game} onToggleSound={() => { const next = toggleDemoSound(game); saveGame(next); playDemoSound(next.soundEnabled, 'select') }} />
        </div>
        <div className="world-heading">
          <span className="tag">MUNDO PERSISTENTE</span>
          <h1 id="world-title">Mundo de {player.alias}</h1>
          <p>Elige un destino. Matemáticas ya está conectado al motor real.</p>
        </div>
        <section className="world-guide" aria-label="Siguiente objetivo recomendado">
          <div className="guide-character" aria-hidden="true">🤖</div>
          <div><span className="tag">NOVA · GUÍA DE EXPLORACIÓN</span><h2>{guide.icon} {guide.title}</h2><p>{guide.message}</p></div>
          <Link href={guide.href} className="btn primary">{guide.action}</Link>
        </section>
        <div className="world-map">
          <article className="world-zone math-zone unlocked">
            <span className="zone-icon" aria-hidden="true">🏙️</span>
            <span className="zone-state">ZONA ACTIVA</span>
            <h2>Ciudad Matemática</h2>
            <p>Misiones adaptativas, progreso real y recompensas académicas.</p>
            <div className="action-row">
              <Link href="/mission/briefing" className="btn primary">▶ MISIÓN DIARIA</Link>
              <Link href="/math-city" className="btn dark">EXPLORAR CIUDAD</Link>
              <Link href="/player" className="btn dark">VER PROGRESO</Link>
            </div>
          </article>
          {WORLD_ZONES.map((zone) => (
            <Link href={`/zone/${zone.id}`} className={`world-zone preview-zone ${zone.className}`} key={zone.name}>
              <span className="zone-icon" aria-hidden="true">{zone.icon}</span>
              <span className="zone-state">👁 VISTA PREVIA</span>
              <h2>{zone.name}</h2>
              <p>{zone.tagline}. Explora cómo será esta futura aventura.</p>
            </Link>
          ))}
          {player.level >= 2 ? <Link href="/shop" className="world-zone shop-zone unlocked">
            <span className="zone-icon" aria-hidden="true">🏪</span><span className="zone-state">ABIERTO · NIVEL 2</span><h2>Tienda del Explorador</h2><p>Consigue objetos con las monedas ganadas en misiones reales.</p>
          </Link> : <article className="world-zone shop-zone locked" aria-disabled="true">
            <span className="zone-icon" aria-hidden="true">🏪</span><span className="zone-state">🔒 NIVEL 2</span><h2>Tienda del Explorador</h2><p>Completa misiones para abrirla.</p>
          </article>}
          <Link href="/base" className="world-zone base-zone unlocked">
            <span className="zone-icon" aria-hidden="true">🚀</span>
            <span className="zone-state">TU ESPACIO</span>
            <h2>Refugio del Explorador</h2>
            <p>Viste el avatar, abre la mochila y personaliza tu base.</p>
          </Link>
        </div>
      </section>
      {nextUnlock && <section className="card"><span className="tag">🔓 PRÓXIMO DESBLOQUEO</span><h2>{nextUnlock.icon} {nextUnlock.label}</h2><p className="muted">Se abrirá al alcanzar el nivel {nextUnlock.level}. El nivel del personaje depende solo de XP de juego, no del dominio académico.</p></section>}
      <section className="card world-journal">
        <div><span className="tag">📖 BITÁCORA</span><h2>Logros del Explorador</h2><p className="muted">{unlockedAchievements} de {achievements.length} logros desbloqueados · {game.rewardedSessions.length} misiones recompensadas</p></div>
        <div className="journal-badges" aria-label="Vista previa de logros">{achievements.slice(0, 3).map((achievement) => <span key={achievement.id} className={achievement.unlocked ? 'unlocked' : ''} title={achievement.name}>{achievement.unlocked ? achievement.icon : '🔒'}</span>)}</div>
        <Link href="/achievements" className="btn dark">VER BITÁCORA</Link>
      </section>
      <DemoGameDock active="world" />
      <p className="demo-notice">Progresión real: XP, nivel, monedas, compras y equipamiento se conservan en la cuenta. El nivel del personaje no modifica el diagnóstico académico.</p>
    </>
  )
}
