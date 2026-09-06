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

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

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
    setFailedAreas([])
    setResult(null)
    setNow(Date.now())
  }

  function answer(optionIndex: number) {
    if (!boss || result || coolingDown || !eligible) return
    const question = boss.questions[index]
    const isCorrect = optionIndex === question.answer
    const nextCorrect = correct + Number(isCorrect)
    const nextFailedAreas = isCorrect ? failedAreas : Array.from(new Set([...failedAreas, question.area]))
    const isLast = index === boss.questions.length - 1
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
  }

  function resetLab() {
    if (!boss || typeof window === 'undefined') return
    localStorage.removeItem(cooldownKey(boss.subjectId))
    setIndex(0)
    setCorrect(0)
    setFailedAreas([])
    setResult(null)
    setNow(Date.now())
  }

  if (!boss) {
    return (
      <section className="card" style={{ maxWidth: 920, margin: '32px auto' }}>
        <span className="tag">LABORATORIO · NO AFECTA AL JUEGO NORMAL</span>
        <h1>Jefes de fin de trimestre</h1>
        <p className="muted">Cada materia tiene su propio monstruo. El reto solo se desbloquea con suficiente progreso y constancia.</p>

        <div className="card" style={{ marginTop: 18 }}>
          <h2>🔐 Requisitos de acceso</h2>
          <p><strong>≥ {BOSS_REQUIRED_PROGRESS_PERCENT}%</strong> del desarrollo previsto de la materia y una racha mínima de <strong>{BOSS_REQUIRED_STREAK_DAYS} días</strong>.</p>
          <p className="muted">En este laboratorio los dos valores se simulan para probar el comportamiento sin conectar el sistema al progreso real.</p>
          <div style={{ display: 'grid', gap: 14, marginTop: 14 }}>
            <label>Progreso simulado: <strong>{progressPercent}%</strong><input style={{ width: '100%' }} type="range" min="0" max="100" value={progressPercent} onChange={(event) => setProgressPercent(Number(event.target.value))} /></label>
            <label>Racha simulada: <strong>{streakDays} días</strong><input style={{ width: '100%' }} type="range" min="0" max="14" value={streakDays} onChange={(event) => setStreakDays(Number(event.target.value))} /></label>
          </div>
          <p style={{ marginTop: 12 }}><strong>{eligible ? '✅ Jefes desbloqueados para la prueba' : '🔒 Aún no cumples los requisitos'}</strong></p>
        </div>

        <div className="shop-grid" style={{ marginTop: 20 }}>
          {SUBJECT_BOSSES.map((entry) => {
            const subject = SUBJECTS[entry.subjectId]
            return (
              <article key={entry.subjectId} className="card shop-item">
                <div style={{ fontSize: 44 }}>{entry.icon}</div>
                <span className="tag">{subject.icon} {subject.name}</span>
                <h2>{entry.name}</h2>
                <p className="muted">{entry.intro}</p>
                <button className="btn primary" type="button" onClick={() => chooseBoss(entry)} disabled={!eligible}>{eligible ? 'DESAFIAR AL JEFE' : '🔒 BLOQUEADO'}</button>
              </article>
            )
          })}
        </div>
      </section>
    )
  }

  const subject = SUBJECTS[boss.subjectId]
  const question = boss.questions[index]
  const bossHp = result ? (result.passed ? 0 : Math.max(0, 100 - result.percent)) : Math.max(0, 100 - Math.round((correct / boss.questions.length) * 100))

  return (
    <section className="card" style={{ maxWidth: 820, margin: '32px auto' }}>
      <span className="tag">{subject.icon} {subject.name} · JEFE TRIMESTRAL</span>
      <h1>{boss.icon} {boss.name}</h1>
      <p className="muted">{boss.intro}</p>
      <p><strong>Victoria: {BOSS_PASS_PERCENT}% o más.</strong></p>

      <div style={{ margin: '22px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>Energía del jefe</strong><strong>{bossHp}%</strong></div>
        <div style={{ height: 16, borderRadius: 999, background: 'rgba(255,255,255,.12)', overflow: 'hidden', marginTop: 8 }}>
          <div style={{ width: `${bossHp}%`, height: '100%', background: 'linear-gradient(90deg,#ff6b6b,#ffb347)', transition: 'width .25s ease' }} />
        </div>
      </div>

      {coolingDown && !result ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>⚡ Energía recargando</h2>
          <p>Tu siguiente oportunidad contra este jefe estará disponible en:</p>
          <p style={{ fontSize: 34, fontWeight: 800, letterSpacing: 2 }}>{countdown}</p>
          <p className="muted">Aprovecha estas {BOSS_COOLDOWN_HOURS} horas para reforzar los contenidos que más te costaron.</p>
        </div>
      ) : result ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>{result.passed ? '🏆 JEFE DERROTADO' : '⚡ EL JEFE RESISTE'}</h2>
          <p>Resultado: <strong>{result.correct}/{boss.questions.length} · {result.percent}%</strong></p>
          {result.passed ? (
            <p>Has superado el reto con al menos un {BOSS_PASS_PERCENT}%. Gran trabajo.</p>
          ) : (
            <>
              <p>Necesitas al menos un {BOSS_PASS_PERCENT}% para vencerlo. No pasa nada: ahora sabes exactamente qué reforzar.</p>
              {result.failedAreas.length > 0 && <div style={{ textAlign: 'left', maxWidth: 520, margin: '16px auto' }}><strong>Prepárate mejor en:</strong><ul>{result.failedAreas.map((area) => <li key={area}>{area}</li>)}</ul></div>}
              <p>La energía volverá a estar lista en <strong>{BOSS_COOLDOWN_HOURS} horas</strong>.</p>
              <p style={{ fontSize: 30, fontWeight: 800 }}>{countdown}</p>
            </>
          )}
        </div>
      ) : !eligible ? (
        <div className="card" style={{ textAlign: 'center' }}><h2>🔒 Jefe bloqueado</h2><p>Necesitas al menos {BOSS_REQUIRED_PROGRESS_PERCENT}% de progreso y {BOSS_REQUIRED_STREAK_DAYS} días de racha.</p></div>
      ) : (
        <div>
          <p className="tag">RETO {index + 1} DE {boss.questions.length} · {question.area}</p>
          <h2>{question.prompt}</h2>
          <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
            {question.options.map((option, optionIndex) => (
              <button key={option} type="button" className="btn dark" onClick={() => answer(optionIndex)} style={{ textAlign: 'left' }}>{option}</button>
            ))}
          </div>
        </div>
      )}

      <div className="action-row" style={{ marginTop: 24 }}>
        <button className="btn dark" type="button" onClick={() => setBoss(null)}>← OTRO JEFE</button>
        <button className="btn dark" type="button" onClick={resetLab}>REINICIAR PRUEBA LAB</button>
      </div>
      <p className="demo-notice">Modo laboratorio: usa solo estado local del navegador. No escribe en Supabase ni modifica el juego normal.</p>
    </section>
  )
}
