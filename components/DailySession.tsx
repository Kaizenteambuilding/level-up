'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'

type Phase = 'warmup' | 'core' | 'transfer' | 'boss'
type SkillKey = 'fractions_apply' | 'equation_1step' | 'percentages' | 'rectangle_area'

type Question = {
  skill: SkillKey
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

// 10 retos con reparto garantizado:
// 2 fracciones, 2 ecuaciones, 2 porcentajes, 2 geometría, 2 Boss mixtos
const sessionPlan: { skill: SkillKey; phase: Phase; bossMode?: 'calculation' | 'transfer' }[] = [
  { skill: 'equation_1step', phase: 'warmup' },
  { skill: 'fractions_apply', phase: 'warmup' },

  { skill: 'percentages', phase: 'core' },
  { skill: 'rectangle_area', phase: 'core' },
  { skill: 'fractions_apply', phase: 'core' },
  { skill: 'equation_1step', phase: 'core' },

  { skill: 'percentages', phase: 'transfer' },
  { skill: 'rectangle_area', phase: 'transfer' },

  { skill: 'fractions_apply', phase: 'boss', bossMode: 'calculation' },
  { skill: 'equation_1step', phase: 'boss', bossMode: 'transfer' },
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
  planItem: { skill: SkillKey; phase: Phase; bossMode?: 'calculation' | 'transfer' }
): Question {
  const r = rng(seed)
  const ri = (a: number, b: number) =>
    Math.floor(r() * (b - a + 1)) + a

  const phase = planItem.phase
  const d = Math.min(5, difficulty + (phase === 'boss' ? 1 : 0))

  if (planItem.skill === 'equation_1step') {
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

    let prompt = `Resuelve: x + ${k} = ${total}`

    if (phase === 'transfer') {
      prompt = `Piensa en un número. Si le sumas ${k}, obtienes ${total}. ¿Qué número era?`
    }

    if (phase === 'boss') {
      prompt =
        planItem.bossMode === 'transfer'
          ? `👑 BOSS · Un explorador tenía cierta energía. Tras ganar ${k} puntos termina con ${total}. ¿Con cuánta energía empezó?`
          : `👑 BOSS · Resuelve sin pista: x + ${k} = ${total}`
    }

    return {
      skill: 'equation_1step',
      label: 'Ecuaciones',
      difficulty: d,
      seed,
      prompt,
      options,
      answerIndex: options.indexOf(answer),
      solution: `Restamos ${k}: x = ${total} - ${k} = ${x}.`,
      tags: ['equivalencia', 'operacion_inversa'],
    }
  }

  if (planItem.skill === 'percentages') {
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

    const prompt =
      phase === 'transfer'
        ? `Una tienda aplica un ${p}% de descuento sobre ${amount} €. ¿Cuántos euros representa el descuento?`
        : `¿Cuánto es el ${p}% de ${amount}?`

    return {
      skill: 'percentages',
      label: 'Porcentajes',
      difficulty: d,
      seed,
      prompt,
      options,
      answerIndex: options.indexOf(answer),
      solution: `${p}/100 × ${amount} = ${result}.`,
      tags: ['porcentaje_base'],
    }
  }

  if (planItem.skill === 'rectangle_area') {
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

    const prompt =
      phase === 'transfer'
        ? `Una pantalla rectangular mide ${a} cm de ancho y ${b} cm de alto. ¿Qué superficie ocupa?`
        : `Un rectángulo mide ${a} cm por ${b} cm. ¿Cuál es su área?`

    return {
      skill: 'rectangle_area',
      label: 'Geometría',
      difficulty: d,
      seed,
      prompt,
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

  let prompt = `Una ruta mide ${num}/${den} km. Si la recorres ${reps} veces, ¿qué distancia total haces?`

  if (phase === 'transfer') {
    prompt = `En una excursión recorres ${num}/${den} km por tramo. Si haces ${reps} tramos iguales, ¿qué distancia completas?`
  }

  if (phase === 'boss') {
    prompt =
      planItem.bossMode === 'calculation'
        ? `👑 BOSS · Calcula sin pista: ${reps} recorridos de ${num}/${den} km.`
        : `👑 BOSS · Una ruta secreta tiene ${reps} tramos de ${num}/${den} km. ¿Qué distancia total recorres?`
  }

  return {
    skill: 'fractions_apply',
    label: 'Fracciones',
    difficulty: d,
    seed,
    prompt,
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
  const [bestCombo, setBestCombo] = useState(0)

  const [finished, setFinished] = useState(false)
  const [loading, setLoading] = useState(true)

  const sessionStarted = useRef(Date.now())
  const questionStarted = useRef(Date.now())

  const phase = phases[phaseIndex]
  const planItem = sessionPlan[Math.min(total, sessionPlan.length - 1)]

  // La pregunta solo cambia al cambiar la seed.
  const q = useMemo(
    () => makeQuestion(seed, difficulty, planItem),
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

      const { data: states } = await supabase
        .from('player_skill_state')
        .select('difficulty,mastery')
        .eq('player_id', id)
        .order('mastery', { ascending: true })
        .limit(1)

      if (states && states.length > 0) {
        setDifficulty(
          Math.max(
            1,
            Math.min(5, Number(states[0].difficulty ?? 2))
          )
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
      setCombo((value) => {
        const next = value + 1
        setBestCombo((best) => Math.max(best, next))
        return next
      })
    } else {
      setCombo(0)
    }

    const speedNote =
      ok && responseMs <= 12000
        ? ' · ⚡ Respuesta rápida: sube el reto.'
        : ''

    const bossNote =
      planItem.phase === 'boss'
        ? ok
          ? ' · 👑 Golpe al Boss.'
          : ' · 🛡️ El Boss resiste.'
        : ''

    setFeedback(
      (ok ? '✓ Correcto. ' : '↻ Incorrecto. ') +
        q.solution +
        ` · ${result.xp_awarded} XP guardados.` +
        speedNote +
        bossNote
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
          Preparando misión equilibrada...
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

  const victoryTitle =
    accuracy >= 90
      ? 'Victoria legendaria'
      : accuracy >= 70
        ? 'Boss derrotado'
        : 'Misión completada'

  const victoryIcon =
    accuracy >= 90
      ? '🏆'
      : accuracy >= 70
        ? '⚔️'
        : '🛡️'

  return (
    <section
      className="card"
      style={{
        textAlign: 'center',
        padding: 45,
        background:
          'radial-gradient(circle at 50% 0%, #314f2a, #0b1710 70%)',
        border: '2px solid #7ce448',
        boxShadow: '0 0 50px rgba(124,228,72,.18)',
      }}
    >
      <div
        style={{
          fontSize: 100,
          marginBottom: 10,
        }}
      >
        {victoryIcon}
      </div>

      <span className="tag">
        MISIÓN COMPLETADA
      </span>

      <h1>{victoryTitle}</h1>

      <p
        className="muted"
        style={{
          fontSize: 18,
          maxWidth: 620,
          margin: '0 auto 24px',
        }}
      >
        Has completado los 10 retos de hoy y tu progreso ya está
        guardado en LEVEL UP.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 12,
          marginTop: 24,
          marginBottom: 28,
        }}
      >
        <div className="metric">
          <b>{accuracy}%</b>
          <p className="muted">precisión</p>
        </div>

        <div className="metric">
          <b>+{xp} XP</b>
          <p className="muted">recompensa</p>
        </div>

        <div className="metric">
          <b>🔥 {bestCombo}</b>
          <p className="muted">mejor combo</p>
        </div>
      </div>

      <div
        style={{
          margin: '0 auto 28px',
          maxWidth: 600,
          padding: 18,
          borderRadius: 16,
          background: '#0b1b2d',
          border: '1px solid #31516c',
        }}
      >
        <b>
          {accuracy >= 90
            ? '👑 Has dominado esta misión.'
            : accuracy >= 70
              ? '⚔️ Buen trabajo. El Guardián ha caído.'
              : '🧠 LEVEL UP usará tus errores para preparar la próxima misión.'}
        </b>
      </div>

      <Link
        href="/player"
        className="btn primary"
        style={{
          fontSize: 18,
          padding: '16px 24px',
        }}
      >
        CONTINUAR AVENTURA
      </Link>
    </section>
  )
}

  return (
    <>
      <section
  className="card"
  style={
    phase.key === 'boss'
      ? {
          background:
            'radial-gradient(circle at 50% 20%, #5a1f2f, #160b12 70%)',
          border: '2px solid #ff6872',
          boxShadow: '0 0 40px rgba(255,104,114,.18)',
        }
      : undefined
  }
>
  <span className="tag">
    {phase.key === 'boss' && (
  <>
    <div
      style={{
        fontSize: 90,
        textAlign: 'center',
        marginTop: 10,
      }}
    >
      👹
    </div>

    <div
      style={{
        textAlign: 'center',
        fontWeight: 900,
        fontSize: 20,
        marginBottom: 8,
      }}
    >
      Guardián del Día
    </div>

    <div className="bar" style={{ marginBottom: 18 }}>
      <i
        style={{
          width:
            questionInPhase === 0
              ? '100%'
              : answered
                ? '45%'
                : '55%',
          background:
            'linear-gradient(90deg,#ff6872,#ffd44d)',
        }}
      />
    </div>
  </>
)}
    {phase.key === 'boss'
      ? '👑 MINIBOSS MULTIHABILIDAD'
      : '🗺️ DAILY QUEST · 35 MIN'}
  </span>

  <h1>{phase.label}</h1>

  <p className="muted">
    Reto {total + 1} de 10
  </p>

  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(10, 1fr)',
      gap: 6,
      marginTop: 20,
      marginBottom: 18,
    }}
  >
    {Array.from({ length: 10 }).map((_, index) => {
      const done = index < total
      const current = index === total

      return (
        <div
          key={index}
          style={{
            height: 42,
            borderRadius: 10,
            display: 'grid',
            placeItems: 'center',
            fontWeight: 900,
            border: current
              ? '2px solid #ffd44d'
              : '1px solid #31516c',
            background: done
              ? '#244c30'
              : current
                ? '#3a3016'
                : '#0b1b2d',
            opacity: done || current ? 1 : 0.55,
          }}
        >
          {index < 2
            ? '🔥'
            : index < 6
              ? '⚔️'
              : index < 8
                ? '🗺️'
                : '👑'}
        </div>
      )
    })}
  </div>

  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      gap: 8,
      fontSize: 12,
      fontWeight: 800,
    }}
  >
    <span>🔥 Calentamiento</span>
    <span>⚔️ Entrenamiento</span>
    <span>🗺️ Transferencia</span>
    <span>👑 Boss</span>
  </div>

  <div className="bar" style={{ marginTop: 16 }}>
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
                ? '🏆 DERROTAR BOSS Y TERMINAR'
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
