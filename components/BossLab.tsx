'use client'

import { useMemo, useState } from 'react'
import { BOSS_COOLDOWN_HOURS, BOSS_PASS_PERCENT, SUBJECT_BOSSES, type SubjectBoss } from '@/lib/bossLab'
import { SUBJECTS } from '@/lib/subjects'

type Result = { correct: number; percent: number; passed: boolean }

function cooldownKey(subjectId: string) { return `levelup_boss_lab_cooldown:${subjectId}` }

export default function BossLab() {
  const [boss, setBoss] = useState<SubjectBoss | null>(null)
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [nowTick, setNowTick] = useState(0)

  const cooldownUntil = useMemo(() => {
    if (!boss || typeof window === 'undefined') return 0
    const raw = Number(localStorage.getItem(cooldownKey(boss.subjectId)) || 0)
    return Number.isFinite(raw) ? raw : 0
  }, [boss, nowTick])

  const coolingDown = Boolean(boss && cooldownUntil > Date.now())
  const remainingHours = coolingDown ? Math.ceil((cooldownUntil - Date.now()) / 3600000) : 0

  function chooseBoss(nextBoss: SubjectBoss) {
    setBoss(nextBoss)
    setIndex(0)
    setCorrect(0)
    setResult(null)
    setNowTick((value) => value + 1)
  }

  function answer(optionIndex: number) {
    if (!boss || result || coolingDown) return
    const isCorrect = optionIndex === boss.questions[index].answer
    const nextCorrect = correct + Number(isCorrect)
    const isLast = index === boss.questions.length - 1
    if (!isLast) {
      setCorrect(nextCorrect)
      setIndex((value) => value + 1)
      return
    }
    const percent = Math.round((nextCorrect / boss.questions.length) * 100)
    const passed = percent >= BOSS_PASS_PERCENT
    setCorrect(nextCorrect)
    setResult({ correct: nextCorrect, percent, passed })
    if (!passed && typeof window !== 'undefined') {
      localStorage.setItem(cooldownKey(boss.subjectId), String(Date.now() + BOSS_COOLDOWN_HOURS * 3600000))
      setNowTick((value) => value + 1)
    }
  }

  function resetLab() {
    if (!boss || typeof window === 'undefined') return
    localStorage.removeItem(cooldownKey(boss.subjectId))
    setIndex(0)
    setCorrect(0)
    setResult(null)
    setNowTick((value) => value + 1)
  }

  if (!boss) {
    return (
      <section className="card" style={{ maxWidth: 920, margin: '32px auto' }}>
        <span className="tag">LABORATORIO · NO AFECTA AL JUEGO NORMAL</span>
        <h1>Jefes de fin de trimestre</h1>
        <p className="muted">Prototipo aislado: un jefe por materia. No modifica XP, monedas, niveles, misiones, inventario ni progreso académico.</p>
        <div className="shop-grid" style={{ marginTop: 20 }}>
          {SUBJECT_BOSSES.map((entry) => {
            const subject = SUBJECTS[entry.subjectId]
            return (
              <article key={entry.subjectId} className="card shop-item">
                <div style={{ fontSize: 44 }}>{entry.icon}</div>
                <span className="tag">{subject.icon} {subject.name}</span>
                <h2>{entry.name}</h2>
                <p className="muted">{entry.intro}</p>
                <button className="btn primary" type="button" onClick={() => chooseBoss(entry)}>PROBAR JEFE</button>
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

      <div style={{ margin: '22px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>Energía del jefe</strong><strong>{bossHp}%</strong></div>
        <div style={{ height: 16, borderRadius: 999, background: 'rgba(255,255,255,.12)', overflow: 'hidden', marginTop: 8 }}>
          <div style={{ width: `${bossHp}%`, height: '100%', background: 'linear-gradient(90deg,#ff6b6b,#ffb347)', transition: 'width .25s ease' }} />
        </div>
      </div>

      {coolingDown && !result ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>⚡ Energía recargando</h2>
          <p>Podrás volver a desafiar a este jefe en aproximadamente <strong>{remainingHours} h</strong>.</p>
          <p className="muted">En la versión real, este bloqueo sería de {BOSS_COOLDOWN_HOURS} horas tras no superar el reto.</p>
        </div>
      ) : result ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>{result.passed ? '🏆 JEFE DERROTADO' : '⚡ EL JEFE RESISTE'}</h2>
          <p>Resultado: <strong>{result.correct}/{boss.questions.length} · {result.percent}%</strong></p>
          <p>{result.passed ? `Has superado el umbral del ${BOSS_PASS_PERCENT}%.` : `Necesitas al menos un ${BOSS_PASS_PERCENT}% para vencerlo. La energía se recarga durante ${BOSS_COOLDOWN_HOURS} horas.`}</p>
        </div>
      ) : (
        <div>
          <p className="tag">RETO {index + 1} DE {boss.questions.length}</p>
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
      <p className="demo-notice">Modo laboratorio: esta pantalla usa solo estado local del navegador y no escribe nada en Supabase.</p>
    </section>
  )
}
