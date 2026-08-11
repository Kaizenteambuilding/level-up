'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'

type Question = {
  skill: string
  difficulty: number
  seed: number
  prompt: string
  options: string[]
  answerIndex: number
  solution: string
  tags: string[]
}

function makeQuestion(seed: number, difficulty: number): Question {
  let s = seed >>> 0

  const rnd = () =>
    ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)

  const ri = (a: number, b: number) =>
    Math.floor(rnd() * (b - a + 1)) + a

  const gcd = (a: number, b: number) => {
    while (b) {
      ;[a, b] = [b, a % b]
    }
    return a || 1
  }

  const den = ri(3, 5 + difficulty)
  const num = ri(1, den - 1)
  const reps = ri(2, 2 + difficulty)

  const n = num * reps
  const g = gcd(n, den)
  const sn = n / g
  const sd = den / g

  const answer = sd === 1 ? `${sn} km` : `${sn}/${sd} km`

  let options = [
    answer,
    `${num}/${den * reps} km`,
    `${num + reps}/${den} km`,
    `${num}/${den} km`,
  ]

  options = [...new Set(options)]

  while (options.length < 4) {
    options.push(`${ri(1, 9)}/${ri(2, 10)} km`)
  }

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }

  return {
    skill: 'fractions_apply',
    difficulty,
    seed,
    prompt: `Una ruta mide ${num}/${den} km. Si la recorres ${reps} veces, ¿qué distancia total haces?`,
    options: options.slice(0, 4),
    answerIndex: options.slice(0, 4).indexOf(answer),
    solution: `Multiplicamos ${num}/${den} × ${reps}. Resultado: ${answer}.`,
    tags: ['modelizacion', 'multiplicacion_fracciones'],
  }
}

export default function RealMission() {
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [seed, setSeed] = useState(20260811)
  const [difficulty, setDifficulty] = useState(2)
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const [mastery, setMastery] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)

  const startedAt = useRef<number>(Date.now())

  const q = useMemo(
    () => makeQuestion(seed, difficulty),
    [seed, difficulty]
  )

  useEffect(() => {
    const id = localStorage.getItem('levelup_player_id')
    setPlayerId(id)
    startedAt.current = Date.now()
  }, [])

  async function answer(index: number) {
    if (answered || !playerId) return

    setAnswered(true)
    setSaving(true)

    const correct = index === q.answerIndex
    const responseMs = Math.max(1, Date.now() - startedAt.current)

    const supabase = createSupabaseBrowserClient()

    if (!supabase) {
      setFeedback('Supabase no configurado.')
      setSaving(false)
      return
    }

    const { data, error } = await supabase.rpc(
      'submit_levelup_attempt',
      {
        p_player_id: playerId,
        p_skill_id: q.skill,
        p_correct: correct,
        p_response_ms: responseMs,
        p_difficulty: q.difficulty,
        p_seed: q.seed,
        p_prompt: q.prompt,
        p_diagnostic_tags: q.tags,
      }
    )

    setSaving(false)

    if (error) {
      setFeedback('Error guardando progreso: ' + error.message)
      return
    }

    const result = data as {
      xp_awarded: number
      mastery: number
      confidence: number
      difficulty: number
    }

    setXpEarned(result.xp_awarded)
    setMastery(Number(result.mastery))
    setDifficulty(Number(result.difficulty))

    setFeedback(
      (correct ? '✓ Correcto. ' : '↻ Incorrecto. ') +
        q.solution +
        ` · ${result.xp_awarded} XP guardados.`
    )
  }

  function next() {
    setSeed((s) => s + 37)
    setFeedback('')
    setXpEarned(0)
    setAnswered(false)
    startedAt.current = Date.now()
  }

  if (!playerId) {
    return (
      <section className="card">
        <h1>Selecciona jugador</h1>

        <p className="muted">
          Entra primero en la pantalla Jugador para cargar el perfil.
        </p>

        <Link className="btn primary" href="/player">
          IR A JUGADOR
        </Link>
      </section>
    )
  }

  return (
    <>
      <section className="card">
        <span className="tag">
          MISIÓN REAL · FRACCIONES · {difficulty}/5
        </span>

        <h1>Primera misión persistente</h1>

        <p style={{ fontSize: 24, fontWeight: 900 }}>
          {q.prompt}
        </p>

        <div className="answers">
          {q.options.map((o, i) => (
            <button
              key={i}
              className="answer"
              disabled={answered || saving}
              onClick={() => answer(i)}
            >
              {String.fromCharCode(65 + i)} · {o}
            </button>
          ))}
        </div>

        {saving && (
          <p className="muted">
            Guardando respuesta en Supabase...
          </p>
        )}

        {feedback && (
          <>
            <div
              className="metric"
              style={{ marginTop: 16 }}
            >
              <b>{feedback}</b>

              {mastery !== null && (
                <p className="muted">
                  Dominio actual de la habilidad: {mastery}/100
                </p>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 14,
                flexWrap: 'wrap',
              }}
            >
              <button
                className="btn primary"
                onClick={next}
              >
                SIGUIENTE RETO
              </button>

              <Link
                className="btn dark"
                href="/player"
              >
                VER XP GUARDADA
              </Link>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h2>Qué se guarda</h2>

        <p className="muted">
          Acierto/error · tiempo de respuesta · dificultad · seed ·
          etiquetas de diagnóstico · XP · dominio · confianza.
        </p>

        {xpEarned > 0 && (
          <span className="tag">
            +{xpEarned} XP EN SUPABASE
          </span>
        )}
      </section>
    </>
  )
}
