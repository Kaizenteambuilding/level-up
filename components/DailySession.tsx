'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'

type Phase = 'warmup' | 'core' | 'transfer' | 'boss'

const phases: { key: Phase; label: string; count: number }[] = [
  { key: 'warmup', label: 'Calentamiento', count: 2 },
  { key: 'core', label: 'Entrenamiento', count: 4 },
  { key: 'transfer', label: 'Transferencia', count: 2 },
  { key: 'boss', label: 'MiniBoss', count: 2 },
]

function makeQuestion(seed: number, difficulty: number, index: number) {
  let s = seed >>> 0

  const rnd = () =>
    ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)

  const ri = (a: number, b: number) =>
    Math.floor(rnd() * (b - a + 1)) + a

  if (index % 3 === 0) {
    const x = ri(2, 8 + difficulty)
    const k = ri(2, 10 + difficulty)
    const total = x + k
    const ans = String(x)

    let options = [
      ans,
      String(total + k),
      String(total - k - 1),
      String(k),
    ]

    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      ;[options[i], options[j]] = [options[j], options[i]]
    }

    return {
      skill: 'equation_1step',
      prompt: `Resuelve: x + ${k} = ${total}`,
      options,
      answerIndex: options.indexOf(ans),
      solution: `x = ${total} - ${k} = ${x}.`,
      tags: ['equivalencia'],
      seed,
    }
  }

  const den = ri(3, 5 + difficulty)
  const num = ri(1, den - 1)
  const reps = ri(2, 2 + difficulty)

  const n = num * reps

  const gcd = (a: number, b: number) => {
    while (b) {
      ;[a, b] = [b, a % b]
    }
    return a || 1
  }

  const g = gcd(n, den)
  const sn = n / g
  const sd = den / g

  const ans = sd === 1 ? `${sn} km` : `${sn}/${sd} km`

  let options = [
    ans,
    `${num}/${den * reps} km`,
    `${num + reps}/${den} km`,
    `${num}/${den} km`,
  ]

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }

  return {
    skill: 'fractions_apply',
    prompt: `Una ruta mide ${num}/${den} km. Si la recorres ${reps} veces, ¿qué distancia total haces?`,
    options,
    answerIndex: options.indexOf(ans),
    solution: `${num}/${den} × ${reps} = ${ans}.`,
    tags: ['modelizacion'],
    seed,
  }
}

export default function DailySession() {
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const [phaseIndex, setPhaseIndex] = useState(0)
  const [questionInPhase, setQuestionInPhase] = useState(0)

  const [difficulty, setDifficulty] = useState(2)
  const [seed, setSeed] = useState(20260812)

  const [answered, setAnswered] = useState(false)
  const [feedback, setFeedback] = useState('')

  const [xp, setXp] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)

  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)

  const sessionStarted = useRef(Date.now())
  const questionStarted = useRef(Date.now())

  const phase = phases[phaseIndex]

  const q = useMemo(
  () => makeQuestion(seed, difficulty, total),
  [seed]
)

  useEffect(() => {
    async function start() {
      const id = localStorage.getItem('levelup_player_id')
      setPlayerId(id)

      if (!id) {
        setLoading(false)
        return
      }

      const supabase = createSupabaseBrowserClient()

      if (!supabase) {
        setLoading(false)
        return
      }

      const { data } = await supabase.rpc('start_daily_session', {
        p_player_id: id,
        p_planned_minutes: 35,
      })

      setSessionId(data as string)

      setLoading(false)

      sessionStarted.current = Date.now()
      questionStarted.current = Date.now()
    }

    start()
  }, [])

  async function submit(index: number) {
    if (answered || !playerId) return

    setAnswered(true)

    const ok = index === q.answerIndex
    const responseMs = Date.now() - questionStarted.current

    const supabase = createSupabaseBrowserClient()

    if (!supabase) return

    const { data, error } = await supabase.rpc(
      'submit_levelup_attempt',
      {
        p_player_id: playerId,
        p_skill_id: q.skill,
        p_correct: ok,
        p_response_ms: responseMs,
        p_difficulty: difficulty,
        p_seed: q.seed,
        p_prompt: q.prompt,
        p_diagnostic_tags: q.tags,
      }
    )

    if (error) {
      setFeedback('Error: ' + error.message)
      return
    }

    const result = data as {
      xp_awarded: number
      difficulty: number
    }

    setXp((value) => value + Number(result.xp_awarded))

    setDifficulty(Number(result.difficulty))

    setTotal((value) => value + 1)

    if (ok) {
      setCorrect((value) => value + 1)
    }

    setFeedback(
      (ok ? '✓ Correcto. ' : '↻ Incorrecto. ') +
        q.solution +
        ` · ${result.xp_awarded} XP guardados.`
    )
  }

  async function next() {
    setAnswered(false)
    setFeedback('')
    setSeed((value) => value + 41)

    questionStarted.current = Date.now()

    if (questionInPhase + 1 < phase.count) {
      setQuestionInPhase((value) => value + 1)
      return
    }

    if (phaseIndex + 1 < phases.length) {
      setPhaseIndex((value) => value + 1)
      setQuestionInPhase(0)
      return
    }

    const supabase = createSupabaseBrowserClient()

    if (supabase && sessionId) {
      const minutes = Math.max(
        1,
        Math.round(
          (Date.now() - sessionStarted.current) / 60000
        )
      )

      await supabase.rpc('finish_daily_session', {
        p_session_id: sessionId,
        p_actual_minutes: minutes,
        p_xp_earned: xp,
      })
    }

    setFinished(true)
  }

  if (loading) {
    return (
      <section className="card">
        <p className="muted">
          Preparando misión...
        </p>
      </section>
    )
  }

  if (!playerId) {
    return (
      <section className="card">
        <h1>Sin jugador</h1>

        <Link className="btn primary" href="/player">
          IR A JUGADOR
        </Link>
      </section>
    )
  }

  if (finished) {
    const accuracy = total
      ? Math.round((correct / total) * 100)
      : 0

    return (
      <section
        className="card"
        style={{
          textAlign: 'center',
          padding: 45,
        }}
      >
        <div style={{ fontSize: 80 }}>
          🏆
        </div>

        <span className="tag">
          SESIÓN COMPLETADA
        </span>

        <h1>
          Daily Quest superada
        </h1>

        <p className="muted">
          {total} retos · {accuracy}% precisión · +{xp} XP
        </p>

        <Link
          href="/player"
          className="btn primary"
        >
          VOLVER AL PERFIL
        </Link>
      </section>
    )
  }

  return (
    <>
      <section className="card">
        <span className="tag">
          DAILY QUEST · 35 MIN
        </span>

        <h1>{phase.label}</h1>

        <p className="muted">
          Fase {phaseIndex + 1}/4 · reto{' '}
          {questionInPhase + 1}/{phase.count}
        </p>

        <div className="bar">
          <i
            style={{
              width: `${Math.round(
                (total / 10) * 100
              )}%`,
            }}
          />
        </div>
      </section>

      <section className="card">
        <span className="tag">
          Matemáticas · dificultad {difficulty}/5
        </span>

        <p
          style={{
            fontSize: 24,
            fontWeight: 900,
          }}
        >
          {q.prompt}
        </p>

        <div className="answers">
          {q.options.map((option, index) => (
            <button
              key={index}
              className="answer"
              disabled={answered}
              onClick={() => submit(index)}
            >
              {String.fromCharCode(65 + index)} · {option}
            </button>
          ))}
        </div>

        {feedback && (
          <>
            <div
              className="metric"
              style={{ marginTop: 16 }}
            >
              <b>{feedback}</b>
            </div>

            <button
              className="btn primary"
              style={{ marginTop: 14 }}
              onClick={next}
            >
              {phase.key === 'boss' &&
              questionInPhase + 1 === phase.count
                ? 'TERMINAR SESIÓN'
                : 'SIGUIENTE RETO'}
            </button>
          </>
        )}
      </section>

      <section className="card">
        <div className="grid two">
          <div className="metric">
            <b>{xp} XP</b>
            <p className="muted">
              ganados hoy
            </p>
          </div>

          <div className="metric">
            <b>
              {correct}/{total}
            </b>
            <p className="muted">
              aciertos
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
