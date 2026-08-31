'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { DemoAvatar, DemoGameDock, DemoGameError, DemoHud, DemoLoading, useDemoGamePlayer } from './DemoGameShell'
import { demoAchievements, demoGuideStep, toggleDemoSound } from '@/lib/demoGame'
import { nextGameUnlock } from '@/lib/gameProgression'
import { playDemoSound } from '@/lib/demoSound'
import { WORLD_ZONES } from '@/lib/worldZones'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { buildWeeklyQuests } from '@/lib/weeklyQuests'
import { missionCadence } from '@/lib/missionCadence'
import { reportProductEvent } from '@/lib/productTelemetry'
import { buildReturnLoop } from '@/lib/returnLoop'
import { buildDailyReturnSummary } from '@/lib/dailyReturnSummary'

export default function DemoWorld() {
  const { player, game, saveGame, loading, error } = useDemoGamePlayer()
  const openedReported = useRef(false)
  useEffect(() => { if (player && !openedReported.current) { openedReported.current = true; void reportProductEvent(player.id, 'world_opened', '/world') } }, [player])
  if (loading) return <DemoLoading />
  if (!player || error) return <DemoGameError title="No se pudo abrir el mundo" message={error} backHref="/player" backLabel="VOLVER AL JUGADOR" />
  if (!player.onboardingCompleted) return <section className="onboarding-gate card"><div className="nova-orb" aria-hidden="true">🤖</div><span className="tag">NOVA · MENSAJE NUEVO</span><h1>Tu mundo está listo</h1><p className="muted">Antes de explorar, elige tu personaje y completa una misión guiada. Tu progreso actual se conserva.</p><Link href="/onboarding" className="btn primary">COMENZAR AVENTURA</Link></section>
  const achievements = demoAchievements(game)
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked).length
  const cadence = missionCadence(game)
  const returnLoop = buildReturnLoop(game.missionHistory, player.streakDays)
  const dailySummary = buildDailyReturnSummary(game, returnLoop.completedToday, player.streakDays)
  const defaultGuide = demoGuideStep(game, player.level)
  const guide = cadence.status === 'done-today' && (defaultGuide.href === '/mission/briefing' || defaultGuide.href === '/mission')
    ? player.level >= 2 && game.coins > 0
      ? { id: 'post-expedition-shop', title: 'Expedición cumplida. Disfruta la recompensa', message: `El entrenamiento de hoy ya está guardado. Tienes ${game.coins} monedas para personalizar tu aventura sin repetir la expedición diaria.`, href: '/shop', action: 'USAR MIS MONEDAS', icon: '🎁' }
      : { id: 'post-expedition-journal', title: 'Expedición cumplida por hoy', message: 'El entrenamiento de hoy ya está guardado. Revisa tu progreso o explora cualquiera de los cinco mundos de aprendizaje.', href: '/achievements', action: 'VER MI PROGRESO', icon: '🏆' }
    : defaultGuide
  const nextUnlock = nextGameUnlock(player.level)
  const weeklyQuests = buildWeeklyQuests(game)
  const completedWeeklyQuests = weeklyQuests.filter((quest) => quest.completed).length
  const cadenceHref = cadence.status === 'done-today' ? '/world' : '/mission/briefing'
  const weeklyQuestAction = (questId: string) => {
    if (questId === 'equipment') return player.level >= 2 ? { href: '/shop', label: 'PREPARAR EQUIPO' } : { href: '/base', label: 'VER MI REFUGIO' }
    if (cadence.status === 'done-today') return { href: '/achievements', label: 'VER PROGRESO' }
    return { href: '/mission/briefing', label: 'HACER EXPEDICIÓN' }
  }

  async function toggleSoundPreference() {
    if (!player) return
    const next = toggleDemoSound(game)
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return
    const { error: preferenceError } = await supabase.rpc('set_levelup_game_preferences', { p_player_id: player.id, p_sound_enabled: next.soundEnabled })
    if (preferenceError) return
    saveGame(next)
    playDemoSound(next.soundEnabled, 'select')
  }

  return (
    <>
      <section className="game-world" aria-labelledby="world-title">
        <div className="world-sky" aria-hidden="true" />
        <div className="world-topbar"><DemoAvatar player={player} game={game} /><DemoHud player={player} game={game} onToggleSound={toggleSoundPreference} /></div>
        <div className="world-heading"><span className="tag">MUNDO PERSISTENTE</span><h1 id="world-title">Mundo de {player.alias}</h1><p>Elige un destino. Los cinco mundos de aprendizaje están operativos con tres distritos cada uno.</p></div>
        <section className="world-guide" aria-label="Siguiente objetivo recomendado"><div className="guide-character" aria-hidden="true">🤖</div><div><span className="tag">NOVA · GUÍA DE EXPLORACIÓN</span><h2>{guide.icon} {guide.title}</h2><p>{guide.message}</p></div><Link href={guide.href} className="btn primary">{guide.action}</Link></section>
        <section className="card" aria-label="Resumen de regreso"><span className="tag">🧭 TU ÚLTIMO AVANCE</span><h2>{dailySummary.title}</h2><p><b>{dailySummary.detail}</b></p><p className="muted">{dailySummary.next}</p></section>
        <section className="card" aria-label="Racha diaria"><span className="tag">🔥 EXPEDICIÓN DIARIA</span><h2>{returnLoop.title}</h2><p className="muted">{returnLoop.message}</p>{!returnLoop.completedToday && <Link href="/mission/briefing" className="btn primary">HACER EXPEDICIÓN DE HOY</Link>}</section>
        <div className="world-map">
          <article className="world-zone math-zone unlocked"><span className="zone-icon" aria-hidden="true">🎯</span><span className="zone-state">{cadence.status === 'done-today' ? '✓ EXPEDICIÓN DE HOY COMPLETADA' : cadence.status === 'returning' ? 'NUEVA EXPEDICIÓN DISPONIBLE' : 'EXPEDICIÓN DIARIA ACTIVA'}</span><h2>Expedición diaria</h2><p>{cadence.message}</p><div className="action-row"><Link href={cadenceHref} className="btn primary">▶ {cadence.action}</Link><Link href="/player" className="btn dark">VER PROGRESO</Link></div></article>
          {WORLD_ZONES.map((zone) => <Link href={`/zone/${zone.id}`} className={`world-zone preview-zone ${zone.className} unlocked`} key={zone.name}><span className="zone-icon" aria-hidden="true">{zone.icon}</span><span className="zone-state">✓ 3 DISTRITOS ACTIVOS</span><h2>{zone.name}</h2><p>{zone.tagline}. Entra y elige un distrito.</p></Link>)}
          {player.level >= 2 ? <Link href="/shop" className="world-zone shop-zone unlocked"><span className="zone-icon" aria-hidden="true">🏪</span><span className="zone-state">ABIERTO · NIVEL 2</span><h2>Tienda del Explorador</h2><p>Consigue objetos con las monedas ganadas en expediciones y actividad de aprendizaje.</p></Link> : <article className="world-zone shop-zone locked" aria-disabled="true"><span className="zone-icon" aria-hidden="true">🏪</span><span className="zone-state">🔒 NIVEL 2</span><h2>Tienda del Explorador</h2><p>Completa actividades de aprendizaje para seguir avanzando.</p></article>}
          <Link href="/base" className="world-zone base-zone unlocked"><span className="zone-icon" aria-hidden="true">🚀</span><span className="zone-state">TU ESPACIO</span><h2>Refugio del Explorador</h2><p>Viste el avatar, abre la mochila y personaliza tu base.</p></Link>
        </div>
      </section>
      {nextUnlock && <section className="card"><span className="tag">🔓 PRÓXIMO DESBLOQUEO</span><h2>{nextUnlock.icon} {nextUnlock.label}</h2><p className="muted">Se abrirá al alcanzar el nivel {nextUnlock.level}. El nivel del personaje depende solo de XP de juego, no del dominio académico.</p></section>}
      <section className="weekly-quests card" aria-labelledby="weekly-quests-title">
        <div className="weekly-quests-heading"><div><span className="tag">🤖 ENCARGOS DE NOVA · ESTA SEMANA</span><h2 id="weekly-quests-title">Mantén viva la expedición</h2><p className="muted">{completedWeeklyQuests} de {weeklyQuests.length} encargos completados. Se actualizan con la actividad guardada en tu cuenta.</p></div><span className="weekly-total">{completedWeeklyQuests}/{weeklyQuests.length}</span></div>
        <div className="weekly-quest-grid">{weeklyQuests.map((quest) => { const percent = Math.round((quest.progress / quest.target) * 100); const action = weeklyQuestAction(quest.id); return <article key={quest.id} className={quest.completed ? 'completed' : ''}><span className="weekly-quest-icon" aria-hidden="true">{quest.completed ? '✅' : quest.icon}</span><div><b>{quest.title}</b><p>{quest.detail}</p><div className="bar" role="progressbar" aria-label={quest.title} aria-valuemin={0} aria-valuemax={quest.target} aria-valuenow={quest.progress}><i style={{ width: `${percent}%` }} /></div><small>{quest.progress}/{quest.target}</small>{!quest.completed && <div className="action-row"><Link href={action.href} className="btn dark">{action.label}</Link></div>}</div></article> })}</div>
        <p className="demo-notice">Los encargos organizan la aventura, pero no añaden XP ni modifican el análisis académico.</p>
      </section>
      <section className="card world-journal"><div><span className="tag">📖 BITÁCORA</span><h2>Logros del Explorador</h2><p className="muted">{unlockedAchievements} de {achievements.length} logros desbloqueados · {player.totalMissions} actividades completadas · 🔥 {player.streakDays} días</p></div><div className="journal-badges" aria-label="Vista previa de logros">{achievements.slice(0, 3).map((achievement) => <span key={achievement.id} className={achievement.unlocked ? 'unlocked' : ''} title={achievement.name}>{achievement.unlocked ? achievement.icon : '🔒'}</span>)}</div><Link href="/achievements" className="btn dark">VER BITÁCORA</Link></section>
      <DemoGameDock active="world" />
      <p className="demo-notice">Progresión real: XP, nivel, monedas, compras y equipamiento se conservan en la cuenta. El nivel del personaje no modifica el diagnóstico académico.</p>
    </>
  )
}
