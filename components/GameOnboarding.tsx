'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { DEMO_AVATARS, setDemoAvatar } from '@/lib/demoGame'
import { userFacingError } from '@/lib/userFacingError'
import { DemoAvatar, DemoHud, DemoLoading, useDemoGamePlayer } from './DemoGameShell'
import { reportProductEvent } from '@/lib/productTelemetry'

type Step = 'welcome' | 'avatar' | 'world' | 'reward'

export default function GameOnboarding() {
  const { player, game, saveGame, loading, error } = useDemoGamePlayer({ allowIncompleteOnboarding: true })
  const [step, setStep] = useState<Step>('welcome')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const openedReported = useRef(false)
  useEffect(() => { const value = new URLSearchParams(window.location.search).get('step'); if (value === 'avatar' || value === 'world' || value === 'reward') setStep(value) }, [])
  useEffect(() => { if (player && !openedReported.current) { openedReported.current = true; void reportProductEvent(player.id, 'onboarding_opened', '/onboarding') } }, [player])
  if (loading) return <DemoLoading />
  if (!player || error) return <section className="card" role="alert"><h1>No se pudo iniciar la aventura</h1><p className="muted">{error}</p><Link href="/player" className="btn primary">VOLVER AL JUGADOR</Link></section>

  async function chooseAvatar(avatarId: string) {
    if (!player || saving) return
    setSaving(true); setMessage('')
    const supabase = createSupabaseBrowserClient()
    if (!supabase) { setMessage('No se pudo conectar con LEVEL UP.'); setSaving(false); return }
    const { error: saveError } = await supabase.rpc('set_levelup_avatar', { p_player_id: player.id, p_avatar_id: avatarId })
    setSaving(false)
    if (saveError) { setMessage(userFacingError(saveError, 'No se pudo guardar el personaje.')); return }
    saveGame(setDemoAvatar(game, avatarId)); setStep('world'); void reportProductEvent(player.id, 'onboarding_avatar_saved', '/onboarding')
  }

  async function finishOnboarding() {
    if (!player || saving) return
    setSaving(true); setMessage('')
    const supabase = createSupabaseBrowserClient()
    if (!supabase) { setMessage('No se pudo conectar con LEVEL UP.'); setSaving(false); return }
    const { error: finishError } = await supabase.rpc('complete_levelup_onboarding', { p_player_id: player.id })
    setSaving(false)
    if (finishError) { setMessage('NOVA aún no encuentra una misión terminada desde que elegiste personaje. Completa los 10 retos para abrir el mundo.'); return }
    await reportProductEvent(player.id, 'onboarding_completed', '/onboarding')
    window.location.assign('/world')
  }

  const position = step === 'welcome' ? 1 : step === 'avatar' ? 2 : step === 'world' ? 3 : 4
  return <section className="onboarding-stage" aria-labelledby="onboarding-title">
    <div className="onboarding-progress" aria-label={`Paso ${position} de 4`}>{[1,2,3,4].map((item) => <span key={item} className={item <= position ? 'active' : ''}>{item}</span>)}</div>
    <div className="nova-orb" aria-hidden="true">🤖</div>
    {step === 'welcome' && <div className="onboarding-panel"><span className="tag">NOVA · GUÍA DE EXPLORACIÓN</span><h1 id="onboarding-title">Hola, {player.alias}. Este mundo es tuyo.</h1><p>Yo soy NOVA. Te acompañaré por zonas de aprendizaje, misiones y recompensas. Aquí mejorar importa más que acertar todo a la primera.</p><div className="onboarding-player"><DemoHud player={player} game={game} /></div><button className="btn primary" type="button" onClick={() => setStep('avatar')}>CONOCER A MI EXPLORADOR</button></div>}
    {step === 'avatar' && <div className="onboarding-panel"><span className="tag">PASO 2 · TU PERSONAJE</span><h1 id="onboarding-title">¿Quién recorrerá el mundo?</h1><p>Podrás cambiarlo más adelante desde tu refugio.</p><div className="onboarding-avatars">{DEMO_AVATARS.map((avatar) => <button key={avatar.id} type="button" disabled={saving} onClick={() => chooseAvatar(avatar.id)}><span>{avatar.icon}</span><b>{avatar.name}</b><small>{avatar.description}</small></button>)}</div>{message && <p className="status" role="alert">{message}</p>}</div>}
    {step === 'world' && <div className="onboarding-panel"><span className="tag">PASO 3 · CÓMO FUNCIONA</span><h1 id="onboarding-title">Aprende, gana y explora</h1><div className="onboarding-rules"><article><span>🗺️</span><b>Zonas</b><p>Cada asignatura vive en una región del mapa.</p></article><article><span>🎯</span><b>Misiones</b><p>Los retos cambian según tu curso, trimestre y progreso.</p></article><article><span>⭐</span><b>Recompensas</b><p>Ganas XP, niveles y monedas para personalizar tu aventura.</p></article></div><div className="onboarding-player"><DemoAvatar player={player} game={game} /></div><Link href="/mission/briefing?onboarding=1" className="btn primary">INICIAR MISIÓN DE CALIBRACIÓN</Link></div>}
    {step === 'reward' && <div className="onboarding-panel reward-panel"><span className="tag">PASO 4 · MISIÓN COMPLETADA</span><h1 id="onboarding-title">El mundo ya reconoce tu progreso</h1><div className="reward-burst" aria-hidden="true">🏆</div><p>Has activado Ciudad Matemática. El XP y las monedas de la misión ya están guardados en tu cuenta.</p><DemoHud player={player} game={game} />{message && <p className="status" role="alert">{message}</p>}<button className="btn primary" type="button" disabled={saving} onClick={finishOnboarding}>{saving ? 'ABRIENDO MUNDO…' : 'ENTRAR EN MI MUNDO'}</button><Link href="/mission/briefing?onboarding=1" className="btn dark">REPETIR MISIÓN GUIADA</Link></div>}
  </section>
}
