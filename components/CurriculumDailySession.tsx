'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import {
  generateFirstEvaluationQuestion,
  GeneratedQuestion,
} from '@/lib/firstEvaluationGenerators'

type SkillRow = {
  id: string
  name: string
  generator_key: string
  unit_id: string
}

type SkillState = {
  skill_id: string
  mastery: number
  confidence: number
  difficulty: number
}

const FIRST_EVAL_UNITS = ['M01', 'M02', 'M03', 'M04', 'M05']
const SESSION_LENGTH = 10

export default function CurriculumDailySession() {
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [skills, setSkills] = useState<SkillRow[]>([])
  const [states, setStates] = useState<Record<string, SkillState>>({})
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null)
  const [seed, setSeed] = useState(20260812)
  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [xp, setXp] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [loading, setLoading] = useState(true)
  const questionStarted = useRef(Date.now())

  useEffect(() => {
    ;(async () => {
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

      const { data: skillRows, error: skillsError } = await supabase
        .from('skills')
        .select('id,name,generator_key,unit_id')
        .in('unit_id', FIRST_EVAL_UNITS)
        .eq('active', true)

      if (skillsError) {
        setFeedback(skillsError.message)
        setLoading(false)
        return
      }

      const { data: stateRows } = await supabase
        .from('player_skill_state')
        .select('skill_id,mastery,confidence,difficulty')
        .eq('player_id', id)

      const stateMap: Record<string, SkillState> = {}
      ;(stateRows ?? []).forEach((s: any) => {
        stateMap[s.skill_id] = s
      })

      setSkills((skillRows ?? []) as SkillRow[])
      setStates(stateMap)
      setLoading(false)
    })()
  }, [])

  function chooseSkill(currentIndex: number) {
    if (!skills.length) return null

    const ranked = [...skills].sort((a, b) => {
      const am = states[a.id]?.mastery ?? 0
      const bm = states[b.id]?.mastery ?? 0
      if (am !== bm) return am - bm
      return a.id.localeCompare(b.id)
    })

    const mode = currentIndex % 10

    if (mode <= 5) {
      return ranked[currentIndex % Math.min(8, ranked.length)]
    }

    if (mode <= 8) {
      return skills[(currentIndex * 3) % skills.length]
    }

    return skills[(currentIndex * 7 + 3) % skills.length]
  }

  useEffect(() => {
    if (loading || !skills.length || index >= SESSION_LENGTH) return

    const skill = chooseSkill(index)
    if (!skill) return

    const difficulty = states[skill.id]?.difficulty ?? 2

    setQuestion(
      generateFirstEvaluationQuestion(
        skill,
        difficulty,
        seed
      )
    )

    setAnswered(false)
    setFeedback('')
    questionStarted.current = Date.now()
  }, [loading, index, seed, skills.length])

  async function submit(optionIndex: number) {
    if (answered || !playerId || !question) return

    setAnswered(true)

    const ok = optionIndex === question.answerIndex
    const responseMs = Math.max(
      1,
      Date.now() - questionStarted.current
    )

    const supabase = createSupabaseBrowserClient()
    if (!supabase) return

    const { data, error } = await supabase.rpc(
      'submit_levelup_attempt',
      {
        p_player_id: playerId,
        p_skill_id: question.skillId,
        p_correct: ok,
        p_response_ms: responseMs,
        p_difficulty: question.difficulty,
        p_seed: question.seed,
        p_prompt: question.prompt,
        p_diagnostic_tags: question.tags,
      }
    )

    if (error) {
      setFeedback('Error: ' + error.message)
      return
    }

    const result = data as {
      xp_awarded: number
      mastery: number
      confidence: number
      difficulty: number
    }

    setXp((value) => value + Number(result.xp_awarded))

    if (ok) {
      setCorrect((value) => value + 1)
    }

    setStates((current) => ({
      ...current,
      [question.skillId]: {
        skill_id: question.skillId,
        mastery: Number(result.mastery),
        confidence: Number(result.confidence),
        difficulty: Number(result.difficulty),
      },
    }))

    setFeedback(
      (ok ? '✓ Correcto. ' : '↻ Incorrecto. ') +
        question.solution +
        ` · ${result.xp_awarded} XP · dominio ${result.mastery}/100`
    )
  }

  function next() {
    setSeed((s) => s + 37)
    setIndex((i) => i + 1)
  }

  if (loading) {
    return (
      <section className="card">
        <p className="muted">
          Cargando Curriculum Engine...
        </p>
      </section>
    )
  }

  if (!playerId) {
    return (
      <section className="card">
        <h1>Sin jugador</h1>
        <Link href="/player" className="btn primary">
          IR A JUGADOR
        </Link>
      </section>
    )
  }

  if (index >= SESSION_LENGTH) {
    const accuracy = Math.round(
      (correct / SESSION_LENGTH) * 100
    )

    return (
      <section
        className="card"
        style={{
          textAlign: 'center',
          padding: 45,
        }}
      >
        <div style={{ fontSize: 90 }}>🏆</div>

        <span className="tag">
          CURRICULUM ENGINE
        </span>

        <h1>Sesión completada</h1>

        <p className="muted">
          {SESSION_LENGTH} retos · {accuracy}% precisión · +{xp} XP
        </p>

        <p className="muted">
          La próxima sesión priorizará las habilidades con menor dominio.
        </p>

        <Link href="/player" className="btn primary">
          CONTINUAR AVENTURA
        </Link>
      </section>
    )
  }

  if (!question) {
    return (
      <section className="card">
        <p className="muted">
          Preparando el siguiente reto...
        </p>
      </section>
    )
  }

  return (
    <>
      <section className="card">
        <span className="tag">
          1ª EVALUACIÓN · CURRICULUM ENGINE
        </span>

        <h1>
          Reto {index + 1} de {SESSION_LENGTH}
        </h1>

        <p className="muted">
          LEVEL UP selecciona habilidades según el dominio real del jugador.
        </p>

        <div className="bar">
          <i
            style={{
              width: `${Math.round(
                (index / SESSION_LENGTH) * 100
              )}%`,
            }}
          />
        </div>
      </section>

      <section className="card">
        <span className="tag">
          {question.label} · dificultad {question.difficulty}/5
        </span>

        <p
          style={{
            fontSize: 24,
            fontWeight: 900,
          }}
        >
          {question.prompt}
        </p>

        <div className="answers">
          {question.options.map((option, i) => (
            <button
              key={i}
              className="answer"
              disabled={answered}
              onClick={() => submit(i)}
            >
              {String.fromCharCode(65 + i)} · {option}
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
              {index + 1 === SESSION_LENGTH
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
              ganados en la sesión
            </p>
          </div>

          <div className="metric">
            <b>
              {correct}/{index + (answered ? 1 : 0)}
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
