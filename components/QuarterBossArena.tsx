'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { SUBJECTS } from '@/lib/subjects'
import { SUBJECT_BOSSES, type SubjectBoss } from '@/lib/bossLab'

type BossStatus = {
  school_year_start: number
  term: number
  unlock_date: string
  streak_days: number
  required_streak_days: number
  passed: boolean
  retry_at: string | null
  available: boolean
}

type BossResult = {
  correct: number
  total: number
  percent: number
  passed: boolean
  retry_at: string | null
  failed_indexes?: number[]
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

export default function QuarterBossArena() {
  const [playerId, setPlayerId] = useState('')
  const [statuses, setStatuses] = useState<Record<string, BossStatus>>({})
  const [boss, setBoss] = useState<SubjectBoss | null>(null)
  const [attemptId, setAttemptId] = useState('')
  const [answers, setAnswers] = useState<number[]>([])
  const [index, setIndex] = useState(0)
  const [combo, setCombo] = useState(0)
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null)
  const [result, setResult] = useState<BossResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!flash) return
    const timer = window.setTimeout(() => setFlash(null), 650)
    return () => window.clearTimeout(timer)
  }, [flash])

  async function refreshStatuses(id = playerId) {
    const supabase = createSupabaseBrowserClient()
    if (!id || !supabase) return
    const db = supabase as any
    const entries = await Promise.all(SUBJECT_BOSSES.map(async (entry) => {
      const { data, error: statusError } = await db.rpc('get_levelup_boss_status', { p_player_id: id, p_subject_id: entry.subjectId })
      return [entry.subjectId, statusError ? null : data] as const
    }))
    const next: Record<string, BossStatus> = {}
    for (const [subjectId, status] of entries) if (status) next[subjectId] = status as BossStatus
    setStatuses(next)
  }

  useEffect(() => {
    ;(async () => {
      const id = localStorage.getItem('levelup_player_id') || ''
      if (!id) { setError('No hay jugador seleccionado.'); setLoading(false); return }
      setPlayerId(id)
      await refreshStatuses(id)
      setLoading(false)
    })()
  }, [])

  const currentStatus = boss ? statuses[boss.subjectId] : null
  const retryAt = currentStatus?.retry_at ? Date.parse(currentStatus.retry_at) : 0
  const coolingDown = retryAt > now
  const countdown = coolingDown ? formatCountdown(retryAt - now) : '00:00:00'
  const correctSoFar = useMemo(() => {
    if (!boss) return 0
    return answers.reduce((sum, answer, answerIndex) => sum + Number(answer === boss.questions[answerIndex]?.answer), 0)
  }, [answers, boss])
  const bossHp = result?.passed ? 0 : Math.max(0, 100 - Math.round((correctSoFar / 15) * 100))

  async function startBattle(nextBoss: SubjectBoss) {
    const status = statuses[nextBoss.subjectId]
    if (!status?.available) return
    setError('')
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return
    const db = supabase as any
    const { data, error: startError } = await db.rpc('start_levelup_boss_attempt', { p_player_id: playerId, p_subject_id: nextBoss.subjectId })
    if (startError || !data?.attempt_id) { setError('No se pudo abrir el combate. Vuelve a intentarlo.'); return }
    setBoss(nextBoss)
    setAttemptId(String(data.attempt_id))
    setAnswers([])
    setIndex(0)
    setCombo(0)
    setFlash(null)
    setResult(null)
  }

  async function answer(optionIndex: number) {
    if (!boss || !attemptId || flash || result) return
    const question = boss.questions[index]
    const isCorrect = optionIndex === question.answer
    const nextAnswers = [...answers, optionIndex]
    setAnswers(nextAnswers)
    setFlash(isCorrect ? 'hit' : 'miss')
    setCombo(isCorrect ? combo + 1 : 0)

    if (index < boss.questions.length - 1) {
      window.setTimeout(() => setIndex((value) => value + 1), 520)
      return
    }

    const failedAreas = Array.from(new Set(nextAnswers.flatMap((answerValue, answerIndex) => answerValue === boss.questions[answerIndex].answer ? [] : [boss.questions[answerIndex].area])))
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return
    const db = supabase as any
    window.setTimeout(async () => {
      const { data, error: completeError } = await db.rpc('complete_levelup_boss_attempt', {
        p_attempt_id: attemptId,
        p_answers: nextAnswers,
        p_failed_areas: failedAreas,
      })
      if (completeError || !data) { setError('No se pudo guardar el resultado del combate.'); return }
      setResult(data as BossResult)
      await refreshStatuses(playerId)
    }, 520)
  }

  if (loading) return <section className="card"><p className="muted">Abriendo el portal…</p></section>
  if (error && !boss) return <section className="card"><h1>Portal no disponible</h1><p className="muted">{error}</p><Link href="/world" className="btn dark">VOLVER AL MUNDO</Link></section>

  if (!boss) {
    const firstStatus = Object.values(statuses)[0]
    if (!firstStatus) return <section className="card"><h1>Portal no disponible</h1><p className="muted">No se pudo comprobar el evento trimestral.</p><Link href="/world" className="btn dark">VOLVER AL MUNDO</Link></section>

    if (firstStatus.term <= 0) {
      return <section className="card" style={{ maxWidth: 820, margin: '32px auto', textAlign: 'center' }}><div style={{ fontSize: 62 }}>🔒</div><span className="tag">ULTIMATE BOSS</span><h1>EL PORTAL AÚN DUERME</h1><p className="muted">Los jefes aparecerán al final del trimestre. La próxima apertura está prevista para el <strong>{firstStatus.unlock_date}</strong>.</p><Link href="/world" className="btn dark">VOLVER AL MUNDO</Link></section>
    }

    return (
      <section style={{ maxWidth: 1040, margin: '24px auto 48px', padding: '0 14px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '34px 24px', background: 'radial-gradient(circle at 50% 0%,rgba(122,82,255,.26),rgba(10,14,28,.96) 58%)', border: '1px solid rgba(160,132,255,.4)' }}>
          <div style={{ fontSize: 20, letterSpacing: 3, fontWeight: 900 }}>⚔️ ULTIMATE BOSS · TRIMESTRE {firstStatus.term}</div>
          <h1 style={{ fontSize: 'clamp(2rem,6vw,4.6rem)', lineHeight: .95, margin: '12px 0' }}>EL PORTAL DEL TRIMESTRE SE HA ABIERTO</h1>
          <p className="muted" style={{ maxWidth: 720, margin: '0 auto', fontSize: 18 }}>Cinco guardianes te esperan. Para entrar necesitas haber mantenido una racha de 12 días consecutivos.</p>
          <div style={{ marginTop: 18 }} className="tag">🔥 RACHA ACTUAL: {firstStatus.streak_days}/12 DÍAS</div>
        </div>

        <div className="shop-grid" style={{ marginTop: 20 }}>
          {SUBJECT_BOSSES.map((entry) => {
            const status = statuses[entry.subjectId]
            const subject = SUBJECTS[entry.subjectId]
            const retry = status?.retry_at ? Date.parse(status.retry_at) > now : false
            return (
              <article key={entry.subjectId} className="card shop-item" style={{ minHeight: 310, background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))' }}>
                <div style={{ fontSize: 62 }}>{entry.icon}</div>
                <span className="tag">{subject.icon} {subject.name}</span>
                <h2 style={{ fontSize: 27 }}>{entry.name}</h2>
                <p className="muted">{entry.intro}</p>
                {status?.passed ? <strong>🏆 DERROTADO ESTE TRIMESTRE</strong> : retry ? <strong>⚡ RECARGANDO 24 H</strong> : status?.available ? <button className="btn primary" type="button" onClick={() => startBattle(entry)}>⚔️ ENTRAR EN COMBATE</button> : <strong>🔒 NECESITAS 12 DÍAS DE RACHA</strong>}
              </article>
            )
          })}
        </div>
        <div style={{ textAlign: 'center', marginTop: 18 }}><Link href="/world" className="btn dark">← VOLVER AL MUNDO</Link></div>
      </section>
    )
  }

  const subject = SUBJECTS[boss.subjectId]
  const question = boss.questions[index]
  const failedAreas = result?.failed_indexes?.map((failedIndex) => boss.questions[failedIndex]?.area).filter(Boolean) ?? []

  return (
    <section style={{ maxWidth: 900, margin: '24px auto 48px', padding: '0 14px' }}>
      <div className="card" style={{ padding: 22, position: 'relative', overflow: 'hidden', background: result?.passed ? 'radial-gradient(circle at 50% 20%,rgba(255,207,77,.30),rgba(98,56,210,.22) 34%,rgba(10,14,28,.97) 68%)' : flash === 'hit' ? 'radial-gradient(circle at 50% 25%,rgba(88,255,166,.25),rgba(10,14,28,.96) 60%)' : flash === 'miss' ? 'radial-gradient(circle at 50% 25%,rgba(255,76,95,.22),rgba(10,14,28,.96) 60%)' : 'radial-gradient(circle at 50% 0%,rgba(122,82,255,.22),rgba(10,14,28,.96) 60%)' }}>
        {result?.passed && <style>{`@keyframes bossVictoryBurst{0%{transform:translateY(24px) scale(.7);opacity:0}55%{opacity:1}100%{transform:translateY(-110px) scale(1.2);opacity:0}}`}</style>}
        {result?.passed && <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>{['✨','⚡','🏆','⭐','💥','✨','⚡','⭐','🏆','💥'].map((spark, i) => <span key={`${spark}-${i}`} style={{ position: 'absolute', left: `${8 + (i * 9) % 86}%`, bottom: `${5 + (i % 4) * 8}%`, fontSize: 28, animation: `bossVictoryBurst ${1.8 + (i % 3) * .2}s ease-out ${i * .08}s infinite` }}>{spark}</span>)}</div>}

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <span className="tag">{subject.icon} {subject.name} · ULTIMATE BOSS</span>
          <div style={{ fontSize: 78, marginTop: 8 }}>{boss.icon}</div>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3.8rem)', margin: '4px 0' }}>{boss.name}</h1>
        </div>

        <div style={{ margin: '22px 0 14px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>❤️ Energía del jefe</strong><strong>{bossHp}%</strong></div>
          <div style={{ height: 22, borderRadius: 999, background: 'rgba(255,255,255,.10)', overflow: 'hidden', marginTop: 8 }}><div style={{ width: `${bossHp}%`, height: '100%', background: 'linear-gradient(90deg,#ff374f,#ff7b36,#ffc14d)', transition: 'width .45s ease' }} /></div>
        </div>

        {flash && !result && <div style={{ textAlign: 'center', fontSize: 27, fontWeight: 1000, margin: '4px 0 16px' }}>{flash === 'hit' ? `💥 ¡IMPACTO CRÍTICO!${combo >= 2 ? ` · RACHA x${combo}` : ''}` : '🛡️ EL JEFE BLOQUEA EL ATAQUE'}</div>}

        {error && <p role="alert" style={{ textAlign: 'center' }}>{error}</p>}

        {result ? result.passed ? (
          <div className="card" style={{ position: 'relative', zIndex: 1, textAlign: 'center', border: '1px solid rgba(255,218,105,.55)' }}>
            <div style={{ fontSize: 72 }}>🏆</div><div style={{ letterSpacing: 4, fontWeight: 1000 }}>VICTORIA LEGENDARIA</div>
            <h2 style={{ fontSize: 'clamp(2.2rem,7vw,4.4rem)', lineHeight: .95 }}>⚡ ¡JEFE DERROTADO! ⚡</h2>
            <p style={{ fontSize: 22 }}><strong>{result.correct}/15 · {result.percent}%</strong></p>
            <p>El guardián del trimestre ha caído. Esta victoria queda guardada en tu cuenta.</p>
            <button className="btn primary" type="button" onClick={() => { setBoss(null); setAttemptId(''); setResult(null) }}>VER LOS OTROS JEFES</button>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center' }}>
            <h2>🛡️ EL JEFE SOBREVIVE</h2><p><strong>{result.correct}/15 · {result.percent}%</strong></p>
            {failedAreas.length > 0 && <div style={{ maxWidth: 520, margin: '14px auto', textAlign: 'left' }}><strong>Refuerza estas zonas:</strong><ul>{Array.from(new Set(failedAreas)).map((area) => <li key={area}>{area}</li>)}</ul></div>}
            <p>El portal de este jefe vuelve a abrirse en 24 horas.</p>
            <p style={{ fontSize: 32, fontWeight: 900 }}>{countdown}</p>
            <button className="btn dark" type="button" onClick={() => { setBoss(null); setAttemptId(''); setResult(null) }}>VOLVER AL PORTAL</button>
          </div>
        ) : coolingDown ? (
          <div className="card" style={{ textAlign: 'center' }}><h2>⚡ RECARGANDO ENERGÍA</h2><p style={{ fontSize: 32, fontWeight: 900 }}>{countdown}</p></div>
        ) : (
          <div className="card" style={{ position: 'relative', zIndex: 1 }}>
            <p className="tag">FASE {index + 1} DE 15 · {question.area}</p>
            <h2 style={{ fontSize: 26 }}>{question.prompt}</h2>
            <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>{question.options.map((option, optionIndex) => <button key={option} type="button" className="btn dark" disabled={Boolean(flash)} onClick={() => answer(optionIndex)} style={{ textAlign: 'left', minHeight: 52 }}>{option}</button>)}</div>
          </div>
        )}
      </div>
    </section>
  )
}
