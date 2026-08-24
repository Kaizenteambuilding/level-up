'use client'

import Link from 'next/link'
import { demoAchievements } from '@/lib/demoGame'
import { DemoAvatar, DemoGameDock, DemoGameError, DemoHud, DemoLoading, useDemoGamePlayer } from './DemoGameShell'

export default function DemoAchievements() {
  const { player, game, loading, error } = useDemoGamePlayer()
  if (loading) return <DemoLoading />
  if (!player || error) return <DemoGameError title="No se pudo abrir la bitácora" message={error} backHref="/world" backLabel="VOLVER AL MAPA" />
  const achievements = demoAchievements(game)
  const unlocked = achievements.filter((achievement) => achievement.unlocked).length

  return (
    <>
      <section className="card achievements-header">
        <div><span className="tag">📖 BITÁCORA DEL EXPLORADOR</span><h1>Proezas de {player.alias}</h1><p className="muted">Los logros registran las misiones y acciones de tu aventura.</p></div>
        <DemoAvatar player={player} game={game} />
        <DemoHud player={player} game={game} />
        <div className="achievement-total"><b>{unlocked}/{achievements.length}</b><span>desbloqueados</span></div>
      </section>
      <section className="achievement-grid" aria-label="Logros">
        {achievements.map((achievement) => {
          const percent = Math.round((achievement.progress / achievement.target) * 100)
          return <article key={achievement.id} className={`card achievement-card${achievement.unlocked ? ' unlocked' : ''}`}>
            <span className="achievement-icon" aria-hidden="true">{achievement.unlocked ? achievement.icon : '🔒'}</span>
            <span className="tag">{achievement.unlocked ? '✓ DESBLOQUEADO' : 'EN PROGRESO'}</span>
            <h2>{achievement.name}</h2><p className="muted">{achievement.description}</p>
            <div className="bar" role="progressbar" aria-label={`Progreso de ${achievement.name}`} aria-valuemin={0} aria-valuemax={achievement.target} aria-valuenow={achievement.progress}><i style={{ width: `${percent}%` }} /></div>
            <small>{achievement.progress}/{achievement.target}</small>
          </article>
        })}
      </section>
      <section className="card expedition-log">
        <div><span className="tag">🧭 HISTORIAL DE EXPEDICIONES</span><h2>Últimas misiones</h2><p className="muted">Registro sincronizado de las últimas misiones completadas.</p></div>
        {game.missionHistory.length ? <div className="expedition-list">{[...game.missionHistory].reverse().map((record, index) => {
          const date = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(record.completedAt))
          return <article key={record.sessionId}><span className="expedition-number">#{game.missionHistory.length - index}</span><div><b>Ciudad Matemática</b><small>{date}</small></div><strong>{record.correct}/10</strong><span>⭐ +{record.xp} XP</span><span>🪙 +{record.reward}</span></article>
        })}</div> : <div className="empty-expedition"><span aria-hidden="true">🗺️</span><div><b>La siguiente misión abrirá el historial</b><p className="muted">Al completarla aparecerán aquí sus aciertos, XP y recompensa.</p></div><Link href="/mission/briefing" className="btn primary">EMPEZAR EXPEDICIÓN</Link></div>}
      </section>
      <div className="action-row"><Link href="/world" className="btn primary">← VOLVER AL MAPA</Link><Link href="/mission/briefing" className="btn dark">IR A LA MISIÓN</Link></div>
      <DemoGameDock />
      <p className="demo-notice">La bitácora utiliza misiones guardadas en la cuenta. Los logros sirven para el juego y no modifican el informe académico.</p>
    </>
  )
}
