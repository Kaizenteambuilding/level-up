'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'

type Phase = 'warmup' | 'core' | 'transfer' | 'boss'

type Question = {
  skill: string
  label: string
  difficulty: number
  seed: number
  prompt: string
  options: string[]
  answerIndex: number
  solution: string
  tags: string[]
}

const phases: { key: Phase; label: string; count: number }[] = [
  { key: 'warmup', label: 'Calentamiento', count: 2 },
  { key: 'core', label: 'Entrenamiento', count: 4 },
  { key: 'transfer', label: 'Transferencia', count: 2 },
  { key: 'boss', label: 'MiniBoss', count: 2 },
]

function rng(seed: number) {
  let s = seed >>> 0
  return () =>
    ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

function shuffle<T>(r: () => number, items: T[]) {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function makeQuestion(
  seed: number,
  difficulty: number,
  phase: Phase,
  index: number
): Question {
  const r = rng(seed)
  const ri = (a: number, b: number) =>
    Math.floor(r() * (b - a + 1)) + a

  // En MiniBoss mezclamos y aumentamos exigencia.
  const bossBoost = phase === 'boss' ? 1 : 0
  const d = Math.min(5, difficulty + bossBoost)

  const selector =
    phase === 'boss'
      ? index % 4
      : (index + seed) % 4

  if (selector === 0) {
    const x = ri(2, 8 + d)
    const k = ri(2, 10 + d)
    const total = x + k
    const answer = String(x)

    const options = shuffle(r, [
      answer,
      String(total + k),
      String(total - k - 1),
      String(k),
    ])

    return {
      skill: 'equation_1step',
      label: 'Ecuaciones',
      difficulty: d,
      seed,
      prompt:
        phase === 'boss'
          ? `⚔️ Fase Boss: resuelve sin pista: x + ${k} = ${total}`
          : `Resuelve: x + ${k} = ${total}`,
      options,
      answerIndex: options.indexOf(answer),
      solution: `Restamos ${k} a ambos lados: x = ${total} - ${k} = ${x}.`,
      tags: ['equivalencia', 'operacion_inversa'],
    }
  }

  if (selector === 1) {
    const p = [10, 20, 25, 50][ri(0, 3)]
    const amount = ri(2, 8 + d) * 20
    const result = (p * amount) / 100
    const answer = String(result)

    const options = shuffle(r, [
      answer,
      String(amount - p),
      String(amount + p),
      String(((100 - p) * amount) / 100),
    ])

    return {
      skill: 'percentages',
      label: 'Porcentajes',
      difficulty: d,
      seed,
      prompt:
        phase === 'transfer'
          ? `Una tienda aplica un ${p}% de descuento sobre ${amount} €. ¿Cuántos euros representa el descuento?`
          : `¿Cuánto es el ${p}% de ${amount}?`,
      options,
      answerIndex: options.indexOf(answer),
      solution: `${p}/100 × ${amount} = ${result}.`,
      tags: ['porcentaje_base'],
    }
  }

  if (selector === 2) {
    const a = ri(3, 7 + d)
    const b = ri(2, 6 + d)
    const result = a * b
    const answer = `${result} cm²`

    const options = shuffle(r, [
      answer,
      `${2 * (a + b)} cm²`,
      `${a + b} cm²`,
      `${result * 2} cm²`,
    ])

    return {
      skill: 'rectangle_area',
      label: 'Geometría',
      difficulty: d,
      seed,
      prompt:
        phase === 'transfer'
          ? `Una pantalla rectangular mide ${a} cm de ancho y ${b} cm de alto. ¿Qué superficie ocupa?`
          : `Un rectángulo mide ${a} cm por ${b} cm. ¿Cuál es su área?`,
      options,
      answerIndex: options.indexOf(answer),
      solution: `Área = base × altura = ${a} × ${b} = ${result} cm².`,
      tags: ['perimetro_vs_area'],
    }
  }

  const den = ri(3, 5 + d)
  const num = ri(1, den - 1)
  const reps = ri(2, 2 + d)
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
  const answer = sd === 1 ? `${sn} km` : `${sn}/${sd} km`

  const options = shuffle(r, [
    answer,
    `${num}/${den * reps} km`,
    `${num + reps}/${den} km`,
    `${num}/${den} km`,
  ])

  return {
    skill: 'fractions_apply',
    label: 'Fracciones',
    difficulty: d,
    seed,
    prompt:
      phase === 'transfer'
        ? `En una excursión recorres ${num}/${den} km por tramo. Si haces ${reps} tramos iguales, ¿qué distancia completas?`
        : phase === 'boss'
          ? `⚔️ Fase Boss: ${reps} recorridos de ${num}/${den} km. ¿Distancia total?`
          : `Una ruta mide ${num}/${den} km. Si la recorres ${reps} veces, ¿qué distancia total haces?`,
    options,
    answerIndex: options.indexOf(answer),
    solution: `${num}/${den} × ${reps} = ${answer}.`,
    tags: ['modelizacion', 'multiplicacion_fracciones'],
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
  const [combo, setCombo] = useState(0)
  const [errorTags, setErrorTags] = useState<Record<string, number>>({})

  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)

  const sessionStarted = useRef(Date.now())
  const questionStarted = useRef(Date.now())

  const phase = phases[phaseIndex]

  // Importante: la pregunta SOLO cambia cuando cambia la seed.
  const q = useMemo(
    () => makeQuestion(seed, difficulty, phase.key, total),
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

      // Cargamos el nivel adaptativo actual más alto del jugador.
      const { data: states } = await supabase
        .from('player_skill_state')
        .select('difficulty,mastery')
        .eq('player_id', id)
        .order('mastery', { ascending: true })
        .limit(1)

      if (states && states.length > 0) {
        setDifficulty(
          Math.max(1, Math.min(5, Number(states[0].difficulty ?? 2)))
        )
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
        p_difficulty: q.difficulty,
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
      mastery: number
      confidence: number
    }

    setXp((value) => value + Number(result.xp_awarded))
    setDifficulty(Number(result.difficulty))
    setTotal((value) => value + 1)

    if (ok) {
      setCorrect((value) => value + 1)
      setCombo((value) => value + 1)
    } else {
      setCombo(0)
      setErrorTags((current) => {
        const next = { ...current }
        q.tags.forEach((tag) => {
          next[tag] = (next[tag] ?? 0) + 1
        })
        return next
      })
    }

    const repeatedError = q.tags.some(
      (tag) => (errorTags[tag] ?? 0) >= 1
    )

    const coaching =
      !ok && repeatedError
        ? ' · 🧠 He detectado un error repetido: el próximo reto será más asequible.'
        : ok && responseMs <= 12000
          ? ' · ⚡ Respuesta rápida: el motor puede subir la dificultad.'
          : ''

    setFeedback(
      (ok ? '✓ Correcto. ' : '↻ Incorrecto. ') +
        q.solution +
        ` · ${result.xp_awarded} XP guardados.` +
        coaching
    )
  }

  async function next() {
    // Si hay error repetido, bajamos un nivel localmente antes del siguiente reto.
    const hasRepeatedError = Object.values(errorTags).some(
      (count) => count >= 2
    )

    if (hasRepeatedError) {
      setDifficulty((d) => Math.max(1, d - 1))
    }

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
        <p className="muted">Preparando misión adaptativa...</p>
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
        style={{ textAlign: 'center', padding: 45 }}
      >
        <div style={{ fontSize: 80 }}>🏆</div>

        <span className="tag">SESIÓN COMPLETADA</span>

        <h1>Daily Quest superada</h1>

        <p className="muted">
          {total} retos · {accuracy}% precisión · +{xp} XP
        </p>

        <p className="muted">
          Dificultad final: {difficulty}/5 · mejor combo: 🔥 {combo}
        </p>

        <Link href="/player" className="btn primary">
          VOLVER AL PERFIL
        </Link>
      </section>
    )
  }

  return (
    <>
      <section
        className={
          phase.key === 'boss' ? 'card boss' : 'card'
        }
      >
        <span className="tag">
          {phase.key === 'boss'
            ? '👑 MINIBOSS'
            : 'DAILY QUEST · 35 MIN'}
        </span>

        <h1>{phase.label}</h1>

        <p className="muted">
          Fase {phaseIndex + 1}/4 · reto{' '}
          {questionInPhase + 1}/{phase.count}
        </p>

        <div className="bar">
          <i
            style={{
              width: `${Math.round((total / 10) * 100)}%`,
            }}
          />
        </div>
      </section>

      <section className="card">
        <span className="tag">
          {q.label} · dificultad {q.difficulty}/5
        </span>

        <p style={{ fontSize: 24, fontWeight: 900 }}>
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
                ? '🏆 TERMINAR BOSS'
                : 'SIGUIENTE RETO'}
            </button>
          </>
        )}
      </section>

      <section className="card">
        <div className="grid two">
          <div className="metric">
            <b>{xp} XP</b>
            <p className="muted">ganados hoy</p>
          </div>

          <div className="metric">
            <b>🔥 {combo}</b>
            <p className="muted">
              combo actual · {correct}/{total} aciertos
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
