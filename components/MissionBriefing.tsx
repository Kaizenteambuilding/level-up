'use client'

import Link from 'next/link'
import { DemoAvatar, DemoGameDock, DemoHud, DemoLoading, useDemoGamePlayer } from './DemoGameShell'

export default function MissionBriefing() {
  const { player, game, loading, error } = useDemoGamePlayer()
  if (loading) return <DemoLoading />
  if (!player || error) return <section className="card" role="alert"><h1>No se pudo preparar la misión</h1><p className="muted">{error}</p><Link href="/world" className="btn primary">VOLVER AL MAPA</Link></section>

  return (<>
    <section className="mission-briefing">
      <div className="briefing-visual" aria-hidden="true"><span>🏙️</span><i>➗</i><i>📐</i><i>⅗</i></div>
      <div className="briefing-content">
        <span className="tag">CIUDAD MATEMÁTICA · MISIÓN DIARIA</span>
        <h1>El núcleo de los números</h1>
        <p>La ciudad necesita energía. Cada reto correcto activa una parte del núcleo y mejora la recompensa final.</p>
        <div className="briefing-objectives">
          <div><b>🎯 Objetivo</b><span>Completar 10 retos adaptativos</span></div>
          <div><b>⭐ Progreso real</b><span>XP, dominio y currículo</span></div>
          <div><b>🪙 Recompensa demo</b><span>40 base + 5 por acierto</span></div>
        </div>
        <div className="briefing-player"><DemoAvatar player={player} game={game} /><DemoHud player={player} game={game} /></div>
        <div className="action-row">
          <Link href="/mission" className="btn primary">▶ EMPEZAR MISIÓN</Link>
          <Link href="/world" className="btn dark">← VOLVER AL MAPA</Link>
        </div>
        <p className="demo-notice">La misión y el XP son reales. La recompensa en monedas pertenece todavía a la demo jugable.</p>
      </div>
    </section>
    <DemoGameDock active="mission" />
  </>)
}
