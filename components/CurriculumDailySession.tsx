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
  priority: number
}
const FIRST_EVAL_UNITS = ['M01', 'M02', 'M03', 'M04', 'M05']
const SESSION_LENGTH = 10

export default function CurriculumDailySession() {
    const [forcedSkillId, setForcedSkillId] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setForcedSkillId(params.get('skill'))
  }, [])

  const [playerId, setPlayerId] = useState<string | null>(null)
const [sessionId, setSessionId] = useState<string | null>(null)
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
  const [loadError, setLoadError] = useState('')
  const questionStarted = useRef(Date.now())

  const testMode = Boolean(forcedSkillId)

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
        setLoadError('Supabase no está configurado.')
        setLoading(false)
        return
      }
if (!forcedSkillId) {
  const { data: sessionData, error: sessionError } = await supabase
    .from('study_sessions')
    .insert({
      player_id: id,
      mode: 'daily',
      phase: 'warmup',
    })
    .select('id')
    .single()

  if (sessionError) {
    setLoadError('No se pudo crear la sesión: ' + sessionError.message)
    setLoading(false)
    return
  }

  setSessionId(sessionData.id)
}

      let skillsQuery = supabase
        .from('skills')
        .select('id,name,generator_key,unit_id')
        .eq('active', true)

      if (forcedSkillId) {
        skillsQuery = skillsQuery.eq('id', forcedSkillId)
      } else {
        skillsQuery = skillsQuery.in('unit_id', FIRST_EVAL_UNITS)
      }

      const { data: skillRows, error: skillsError } = await skillsQuery

      if (skillsError) {
        setLoadError(skillsError.message)
        setLoading(false)
        return
      }

      if (!skillRows || skillRows.length === 0) {
        setLoadError(
          forcedSkillId
            ? `No encuentro la habilidad ${forcedSkillId}.`
            : 'No encuentro habilidades activas para la 1ª evaluación.'
        )
        setLoading(false)
        return
      }

      const { data: stateRows } = await supabase
        .from('player_skill_state')
        .select('skill_id,mastery,confidence,difficulty,priority')
        .eq('player_id', id)

      const stateMap: Record<string, SkillState> = {}

      ;(stateRows ?? []).forEach((s: any) => {
        stateMap[s.skill_id] = s
      })

      setSkills(skillRows as SkillRow[])
      setStates(stateMap)
      setLoading(false)
    })()
  }, [forcedSkillId])

  function chooseSkill(currentIndex: number) {
    if (!skills.length) return null

    if (forcedSkillId) {
      return skills.find((skill) => skill.id === forcedSkillId) ?? skills[0]
    }

    const ranked = [...skills].sort((a, b) => {
  const ap = states[a.id]?.priority ?? 50
  const bp = states[b.id]?.priority ?? 50

  if (ap !== bp) return bp - ap

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
    if (
      loading ||
      !skills.length ||
      (!testMode && index >= SESSION_LENGTH)
    ) {
      return
    }

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
  }, [
    loading,
    index,
    seed,
    skills.length,
    forcedSkillId,
    testMode,
  ])
useEffect(() => {
  if (
    testMode ||
    !sessionId ||
    !playerId ||
    index < SESSION_LENGTH
  ) {
    return
  }

  ;(async () => {
    const supabase = createSupabaseBrowserClient()

    if (!supabase) return

    const finishedAt = new Date().toISOString()

    const { error } = await supabase
      .from('study_sessions')
      .update({
        ended_at: finishedAt,
        completed_at: finishedAt,
        completed: true,
        xp_earned: xp,
        phase: 'done',
      })
      .eq('id', sessionId)
      .eq('player_id', playerId)

    if (error) {
      console.error('No se pudo cerrar la sesión:', error)
    }
  })()
}, [index, sessionId, playerId, testMode, xp])
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
p_session_id: sessionId,
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
    priority: Math.max(
      1,
      Math.min(
        100,
        Math.round(
          50 +
            (50 - Number(result.mastery)) * 0.8 +
            (50 - Number(result.confidence)) * 0.4
        )
      )
    ),
  },
}))

    setFeedback(
  (ok ? '✓ Correcto' : '↻ Incorrecto') +
    ` · ${result.xp_awarded} XP · dominio ${result.mastery}/100`
)
  }

  function next() {
    setSeed((s) => s + 37)

    if (testMode) {
      setAnswered(false)
      setFeedback('')
      questionStarted.current = Date.now()
      return
    }

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

  if (loadError) {
    return (
      <section className="card">
        <span className="tag">ERROR DE CARGA</span>
        <h1>No se puede preparar la misión</h1>
        <p className="muted">{loadError}</p>
        <Link href="/player" className="btn primary">
          VOLVER AL JUGADOR
        </Link>
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

  if (!testMode && index >= SESSION_LENGTH) {
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
          {testMode
            ? `🧪 MODO PRUEBA · ${question.skillId}`
            : '1ª EVALUACIÓN · CURRICULUM ENGINE'}
        </span>

        <h1>
          {testMode
            ? 'Prueba de habilidad'
            : `Reto ${index + 1} de ${SESSION_LENGTH}`}
        </h1>

        <p className="muted">
          {testMode
            ? 'Esta pantalla fuerza una habilidad concreta para poder validar su generador.'
            : 'LEVEL UP selecciona habilidades según el dominio real del jugador.'}
        </p>

        {!testMode && (
          <div className="bar">
            <i
              style={{
                width: `${Math.round(
                  (index / SESSION_LENGTH) * 100
                )}%`,
              }}
            />
          </div>
        )}
      </section>

      <section className="card">
        <span className="tag">
          {question.label} · dificultad {question.difficulty}/5
        </span>
{!testMode && (
  <div
    className="metric"
    style={{
      marginTop: 14,
      marginBottom: 18,
    }}
  >
    <b>🎯 REFUERZO PERSONALIZADO</b>

    <p className="muted" style={{ marginBottom: 0 }}>
      {(() => {
        const mastery = states[question.skillId]?.mastery ?? 0

        if (mastery < 50) {
          return `Esta habilidad tiene ${mastery}% de dominio. LEVEL UP la ha priorizado para reforzarla.`
        }

        if (mastery < 75) {
          return `Tienes ${mastery}% de dominio. Vamos a consolidar esta habilidad.`
        }

        return `Tienes ${mastery}% de dominio. Este reto ayudará a mantenerla fuerte.`
      })()}
    </p>
  </div>
)}
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
            <div
  className="metric"
  style={{ marginTop: 10 }}
>
  <b>💡 Por qué</b>
  <p className="muted" style={{ marginBottom: 0 }}>
    {question.solution}
  </p>
</div>

            <button
              className="btn primary"
              style={{ marginTop: 14 }}
              onClick={next}
            >
              {testMode
                ? 'GENERAR OTRA DE ESTA HABILIDAD'
                : index + 1 === SESSION_LENGTH
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
              ganados en esta pantalla
            </p>
          </div>

          <div className="metric">
            <b>
              {correct}/
              {testMode
                ? answered
                  ? 1
                  : 0
                : index + (answered ? 1 : 0)}
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
