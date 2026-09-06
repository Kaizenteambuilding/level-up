'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BOSS_COOLDOWN_HOURS,
  BOSS_PASS_PERCENT,
  BOSS_REQUIRED_PROGRESS_PERCENT,
  BOSS_REQUIRED_STREAK_DAYS,
  SUBJECT_BOSSES,
  type SubjectBoss,
} from '@/lib/bossLab'
import { SUBJECTS } from '@/lib/subjects'

type Result = { correct: number; percent: number; passed: boolean; failedAreas: string[] }

function cooldownKey(subjectId: string) { return `levelup_boss_lab_cooldown:${subjectId}` }

function formatCountdown(ms: number) {
  const safe = Math.max(0, ms)
  const totalSeconds = Math.floor(safe / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

export default function BossLab() {
  const [boss, setBoss] = useState<SubjectBoss | null>(null)
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [failedAreas, setFailedAreas] = useState<string[]>([])
  const [result, setResult] = useState<Result | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [progressPercent, setProgressPercent] = useState(82)
  const [streakDays, setStreakDays] = useState(9)
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null)
  const [combo, setCombo] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!flash) return
    const timer = window.setTimeout(() => setFlash(null), 650)
    return () => window.clearTimeout(timer)
  }, [flash])

  const cooldownUntil = useMemo(() => {
    if (!boss || typeof window === 'undefined') return 0
    const raw = Number(localStorage.getItem(cooldownKey(boss.subjectId)) || 0)
    return Number.isFinite(raw) ? raw : 0
  }, [boss, now])

  const coolingDown = Boolean(boss && cooldownUntil > now)
  const eligible = progressPercent >= BOSS_REQUIRED_PROGRESS_PERCENT && streakDays >= BOSS_REQUIRED_STREAK_DAYS
  const countdown = coolingDown ? formatCountdown(cooldownUntil - now) : '00:00:00'

  function chooseBoss(nextBoss: SubjectBoss) {
    setBoss(nextBoss)
    setIndex(0)
    setCorrect(0)
    setCombo(0)
    setFailedAreas([])
    setResult(null)
    setFlash(null)
    setNow(Date.now())
  }

  function answer(optionIndex: number) {
    if (!boss || result || coolingDown || !eligible || flash) return
    const question = boss.questions[index]
    const isCorrect = optionIndex === question.answer
    const nextCorrect = correct + Number(isCorrect)
    const nextCombo = isCorrect ? combo + 1 : 0
    const nextFailedAreas = isCorrect ? failedAreas : Array.from(new Set([...failedAreas, question.area]))
    setFlash(isCorrect ? 'hit' : 'miss')
    setCombo(nextCombo)

    const isLast = index === boss.questions.length - 1
    window.setTimeout(() => {
      if (!isLast) {
        setCorrect(nextCorrect)
        setFailedAreas(nextFailedAreas)
        setIndex((value) => value + 1)
        return
      }
      const percent = Math.round((nextCorrect / boss.questions.length) * 100)
      const passed = percent >= BOSS_PASS_PERCENT
      const nextResult = { correct: nextCorrect, percent, passed, failedAreas: nextFailedAreas }
      setCorrect(nextCorrect)
      setFailedAreas(nextFailedAreas)
      setResult(nextResult)
      if (!passed && typeof window !== 'undefined') {
        localStorage.setItem(cooldownKey(boss.subjectId), String(Date.now() + BOSS_COOLDOWN_HOURS * 3600000))
        setNow(Date.now())
      }
    }, 520)
  }

  function resetLab() {
    if (!boss || typeof window === 'undefined') return
    localStorage.removeItem(cooldownKey(boss.subjectId))
    setIndex(0)
    setCorrect(0)
    setCombo(0)
    setFailedAreas([])
    setResult(null)
    setFlash(null)
    setNow(Date.now())
  }

  if (!boss) {
    return (
      <section style={{ maxWidth: 1040, margin: '24px auto 48px', padding: '0 14px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '34px 24px', background: 'radial-gradient(circle at 50% 0%, rgba(122,82,255,.26), rgba(10,14,28,.96) 58%)', border: '1px solid rgba(160,132,255,.4)', boxShadow: '0 20px 60px rgba(0,0,0,.28)' }}>
          <div style={{ fontSize: 20, letterSpacing: 3, fontWeight: 900 }}>⚔️ ULTIMATE BOSS</div>
          <h1 style={{ fontSize: 'clamp(2rem,6vw,4.6rem)', lineHeight: .95, margin: '12px 0' }}>EL PORTAL DEL TRIMESTRE SE HA ABIERTO</h1>
          <p className="muted" style={{ maxWidth: 720, margin: '0 auto', fontSize: 18 }}>Has entrenado durante semanas. Cinco guardianes protegen el cierre del trimestre. Cada uno domina una materia. Solo puedes entrar cuando tu progreso y tu constancia demuestran que estás preparado.</p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
            <span className="tag">🧭 {BOSS_REQUIRED_PROGRESS_PERCENT}% DE PROGRESO</span>
            <span className="tag">🔥 RACHA DE {BOSS_REQUIRED_STREAK_DAYS} DÍAS</span>
            <span className="tag">🏆 VICTORIA CON {BOSS_PASS_PERCENT}%</span>
          </div>
        </div>

        <div className="card" style={{ marginTop: 18, padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14 }}>
            <label className="card" style={{ margin: 0 }}>🧭 Progreso de preparación <strong>{progressPercent}%</strong><input style={{ width: '100%', marginTop: 8 }} type="range" min="0" max="100" value={progressPercent} onChange={(event) => setProgressPercent(Number(event.target.value))} /></label>
            <label className="card" style={{ margin: 0 }}>🔥 Racha de entrenamiento <strong>{streakDays} días</strong><input style={{ width: '100%', marginTop: 8 }} type="range" min="0" max="14" value={streakDays} onChange={(event) => setStreakDays(Number(event.target.value))} /></label>
          </div>
          <p style={{ textAlign: 'center', margin: '14px 0 0', fontWeight: 900 }}>{eligible ? '⚡ EL PORTAL TE RECONOCE. PUEDES ENTRAR.' : '🔒 EL PORTAL SIGUE SELLADO. AÚN DEBES ENTRENAR.'}</p>
        </div>

        <div className="shop-grid" style={{ marginTop: 20 }}>
          {SUBJECT_BOSSES.map((entry) => {
            const subject = SUBJECTS[entry.subjectId]
            return (
              <article key={entry.subjectId} className="card shop-item" style={{ position: 'relative', overflow: 'hidden', minHeight: 310, background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))' }}>
                <div style={{ position: 'absolute', inset: 'auto -30px -45px auto', fontSize: 150, opacity: .08 }}>{entry.icon}</div>
                <div style={{ fontSize: 62, filter: eligible ? 'drop-shadow(0 0 18px rgba(255,196,77,.35))' : 'grayscale(1)', transform: eligible ? 'scale(1)' : 'scale(.94)' }}>{entry.icon}</div>
                <span className="tag">{subject.icon} {subject.name}</span>
                <h2 style={{ fontSize: 28 }}>{entry.name}</h2>
                <p className="muted">{entry.intro}</p>
                <button className="btn primary" type="button" onClick={() => chooseBoss(entry)} disabled={!eligible}>{eligible ? '⚔️ ENTRAR EN COMBATE' : '🔒 SELLO ACTIVO'}</button>
              </article>
            )
          })}
        </div>
        <p className="demo-notice" style={{ marginTop: 18 }}>Laboratorio aislado: no modifica XP, monedas, inventario ni progreso real.</p>
      </section>
    )
  }

  const subject = SUBJECTS[boss.subjectId]
  const question = boss.questions[index]
  const attempted = result ? boss.questions.length : index
  const damagePercent = result ? result.percent : Math.round((correct / boss.questions.length) * 100)
  const bossHp = result ? (result.passed ? 0 : Math.max(0, 100 - result.percent)) : Math.max(0, 100 - damagePercent)
  const challengeProgress = Math.round((attempted / boss.questions.length) * 100)

  return (
    <section style={{ maxWidth: 900, margin: '24px auto 48px', padding: '0 14px' }}>
      <div className="card" style={{ padding: '22px', position: 'relative', overflow: 'hidden', background: flash === 'hit' ? 'radial-gradient(circle at 50% 25%,rgba(88,255,166,.25),rgba(10,14,28,.96) 60%)' : flash === 'miss' ? 'radial-gradient(circle at 50% 25%,rgba(255,76,95,.22),rgba(10,14,28,.96) 60%)' : 'radial-gradient(circle at 50% 0%,rgba(122,82,255,.22),rgba(10,14,28,.96) 60%)', transition: 'background .2s ease' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="tag">{subject.icon} {subject.name} · ULTIMATE BOSS</span>
          <div style={{ fontSize: 78, marginTop: 8, transform: flash === 'hit' ? 'scale(.88) rotate(-3deg)' : flash === 'miss' ? 'scale(1.05)' : 'scale(1)', transition: 'transform .16s ease', filter: 'drop-shadow(0 0 22px rgba(255,190,70,.28))' }}>{boss.icon}</div>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3.8rem)', margin: '4px 0' }}>{boss.name}</h1>
          <p className="muted" style={{ maxWidth: 660, margin: '0 auto 8px' }}>{boss.intro}</p>
        </div>

        <div style={{ margin: '22px 0 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>❤️ Energía del jefe</strong><strong>{bossHp}%</strong></div>
          <div style={{ height: 22, borderRadius: 999, background: 'rgba(255,255,255,.10)', overflow: 'hidden', marginTop: 8, boxShadow: flash === 'hit' ? '0 0 24px rgba(89,255,164,.36)' : 'none' }}>
            <div style={{ width: `${bossHp}%`, height: '100%', background: 'linear-gradient(90deg,#ff374f,#ff7b36,#ffc14d)', transition: 'width .45s cubic-bezier(.2,.8,.2,1)' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Avance del combate</span><strong>{challengeProgress}%</strong></div>
            <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,.10)', overflow: 'hidden', marginTop: 5 }}><div style={{ width: `${challengeProgress}%`, height: '100%', background: 'linear-gradient(90deg,#6f8cff,#b46cff)', transition: 'width .3s ease' }} /></div>
          </div>
          <div className="tag">🎯 {correct}/{boss.questions.length} GOLPES</div>
        </div>

        {flash && !result && <div style={{ textAlign: 'center', fontSize: 27, fontWeight: 1000, margin: '2px 0 16px', transform: 'scale(1.06)' }}>{flash === 'hit' ? `💥 ¡IMPACTO CRÍTICO!${combo >= 2 ? ` · RACHA x${combo}` : ''}` : '🛡️ EL JEFE BLOQUEA EL ATAQUE'}</div>}

        {coolingDown && !result ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <h2>⚡ EL JEFE ESTÁ RECUPERANDO ENERGÍA</h2>
            <p>Tu siguiente oportunidad estará disponible en:</p>
            <p style={{ fontSize: 38, fontWeight: 900, letterSpacing: 3 }}>{countdown}</p>
            <p className="muted">Refuerza los contenidos débiles. Cuando el contador llegue a cero, el portal volverá a abrirse.</p>
          </div>
        ) : result ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 32 }}>{result.passed ? '🏆⚡ JEFE DERROTADO ⚡🏆' : '🛡️ EL JEFE SOBREVIVE'}</h2>
            <p style={{ fontSize: 22 }}>Resultado: <strong>{result.correct}/{boss.questions.length} · {result.percent}%</strong></p>
            {result.passed ? (
              <p>Has superado el umbral del {BOSS_PASS_PERCENT}%. El guardián del trimestre ha caído.</p>
            ) : (
              <>
                <p>Has luchado bien, pero este Ultimate Boss exige al menos un {BOSS_PASS_PERCENT}%. Ya sabes dónde reforzarte antes del siguiente combate.</p>
                {result.failedAreas.length > 0 && <div style={{ textAlign: 'left', maxWidth: 540, margin: '16px auto' }}><strong>⚙️ Zonas que debes reforzar:</strong><ul>{result.failedAreas.map((area) => <li key={area}>{area}</li>)}</ul></div>}
                <p>El portal se reactivará en:</p>
                <p style={{ fontSize: 34, fontWeight: 900 }}>{countdown}</p>
              </>
            )}
          </div>
        ) : !eligible ? (
          <div className="card" style={{ textAlign: 'center' }}><h2>🔒 EL PORTAL SE HA CERRADO</h2><p>Necesitas al menos {BOSS_REQUIRED_PROGRESS_PERCENT}% de progreso y {BOSS_REQUIRED_STREAK_DAYS} días de racha.</p></div>
        ) : (
          <div className="card" style={{ padding: 20, border: '1px solid rgba(255,255,255,.12)' }}>
            <p className="tag">FASE {index + 1} DE {boss.questions.length} · {question.area}</p>
            <h2 style={{ fontSize: 26, lineHeight: 1.2 }}>{question.prompt}</h2>
            <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
              {question.options.map((option, optionIndex) => (
                <button key={option} type="button" className="btn dark" onClick={() => answer(optionIndex)} disabled={Boolean(flash)} style={{ textAlign: 'left', minHeight: 52 }}>{option}</button>
              ))}
            </div>
          </div>
        )}

        <div className="action-row" style={{ marginTop: 22 }}>
          <button className="btn dark" type="button" onClick={() => setBoss(null)}>← ELEGIR OTRO JEFE</button>
          <button className="btn dark" type="button" onClick={resetLab}>REINICIAR LAB</button>
        </div>
      </div>
      <p className="demo-notice">Modo laboratorio: usa solo estado local del navegador y no escribe en Supabase.</p>
    </section>
  )
}
