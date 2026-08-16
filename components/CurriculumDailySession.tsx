'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import {
  generateFirstEvaluationQuestion,
  GeneratedQuestion,
} from '@/lib/firstEvaluationGenerators'
import { userFacingError } from '@/lib/userFacingError'

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
  last_practiced_at?: string | null
}

const ACTIVE_CURRICULUM_UNITS = ['M01','M02','M03','M04','M05','M06','M07','M08','M09','M10','M11','M12','M13','M14','M15']
const SESSION_LENGTH = 10

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function retryJwtFuture<T extends { error?: { message?: string } | null }>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let result = await operation()
  for (let attempt = 1; attempt < attempts; attempt++) {
    const message = result.error?.message ?? ''
    if (!message.toLowerCase().includes('jwt issued at future')) break
    await sleep(700 * attempt)
    result = await operation()
  }
  return result
}

export default function CurriculumDailySession() {
  const [forcedSkillId, setForcedSkillId] = useState<string | null>(null)
  const [queryReady, setQueryReady] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setForcedSkillId(params.get('skill'))
    setQueryReady(true)
  }, [])

  const [playerId, setPlayerId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [skills, setSkills] = useState<SkillRow[]>([])
  const [states, setStates] = useState<Record<string, SkillState>>({})
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null)
  const [seed, setSeed] = useState(() => Date.now())
  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [xp, setXp] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [testAttempts, setTestAttempts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [closing, setClosing] = useState(false)
  const [sessionClosed, setSessionClosed] = useState(false)
  const [closeError, setCloseError] = useState('')
  const closeStarted = useRef(false)
  const answerLocked = useRef(false)
  const nextLocked = useRef(false)
  const questionStarted = useRef(Date.now())
  const recentTemplates = useRef<string[]>([])
  const recentFamilies = useRef<string[]>([])
  const recentSkillIds = useRef<string[]>([])
  const recentUnitIds = useRef<string[]>([])
  const questionPrompt = useRef<HTMLParagraphElement>(null)
  const nextButton = useRef<HTMLButtonElement>(null)

  function questionTemplate(prompt: string) {
    return prompt.toLowerCase().replace(/\d+(?:[.,]\d+)?\/\d+(?:[.,]\d+)?/g, '#/#').replace(/\d+(?:[.,]\d+)?/g, '#').replace(/\s+/g, ' ').trim()
  }

  const testMode = Boolean(forcedSkillId)

  useEffect(() => {
    if (question) questionPrompt.current?.focus()
  }, [question])

  useEffect(() => {
    if (feedback && answered) nextButton.current?.focus()
  }, [answered, feedback])

  useEffect(() => {
    if (!queryReady) return
    ;(async () => {
      const id = localStorage.getItem('levelup_player_id')
      setPlayerId(id)
      if (!id) { setLoading(false); return }
      const supabase = createSupabaseBrowserClient()
      if (!supabase) { setLoadError('Supabase no está configurado.'); setLoading(false); return }

      if (!forcedSkillId) {
        const { data: openedSession, error: openSessionError } = await retryJwtFuture(async () =>
          await supabase.rpc('open_levelup_session', { p_player_id: id })
        )
        if (openSessionError) { setLoadError(userFacingError(openSessionError, 'No se pudo abrir la misión.')); setLoading(false); return }

        const openedSessionId = String((openedSession as { session_id?: string } | null)?.session_id ?? '')
        if (!openedSessionId) { setLoadError('No se pudo confirmar la misión abierta.'); setLoading(false); return }
        setSessionId(openedSessionId)

        const { data: previousAttempts, error: attemptsError } = await retryJwtFuture(async () =>
          await supabase
            .from('attempts')
            .select('correct,xp_awarded,skill_id,prompt_snapshot,diagnostic_tags')
            .eq('session_id', openedSessionId)
            .order('created_at', { ascending: true })
            .order('id', { ascending: true })
        )
        if (attemptsError) { setLoadError(userFacingError(attemptsError, 'No se pudo recuperar la misión.')); setLoading(false); return }

        const attempts = previousAttempts ?? []
        if (attempts.length > 0) {
          setIndex(Math.min(SESSION_LENGTH, attempts.length))
          setCorrect(attempts.filter((attempt: any) => attempt.correct === true).length)
          setXp(attempts.reduce((sum: number, attempt: any) => sum + Number(attempt.xp_awarded ?? 0), 0))

          const rememberedAttempts = attempts.slice(-10).reverse()
          recentTemplates.current = rememberedAttempts
            .map((attempt: any) => questionTemplate(String(attempt.prompt_snapshot ?? '')))
            .filter(Boolean)
            .slice(0, 10)

          recentSkillIds.current = Array.from(
            new Set(
              rememberedAttempts
                .map((attempt: any) => String(attempt.skill_id ?? ''))
                .filter(Boolean)
            )
          ).slice(0, 5)

          recentFamilies.current = rememberedAttempts
            .flatMap((attempt: any) => {
              const tags = Array.isArray(attempt.diagnostic_tags)
                ? attempt.diagnostic_tags
                : []
              return tags
                .filter((tag: unknown) => typeof tag === 'string' && tag.startsWith('family:'))
                .map((tag: string) => `${attempt.skill_id}:${tag}`)
            })
            .slice(0, 9)
        } else {
          const { data: recentAttempts } = await retryJwtFuture(async () =>
            await supabase
              .from('attempts')
              .select('skill_id,prompt_snapshot,diagnostic_tags')
              .eq('player_id', id)
              .order('created_at', { ascending: false })
              .limit(20)
          )

          const rememberedAttempts = recentAttempts ?? []
          recentTemplates.current = Array.from(
            new Set(
              rememberedAttempts
                .map((attempt: any) => questionTemplate(String(attempt.prompt_snapshot ?? '')))
                .filter(Boolean)
            )
          ).slice(0, 10)
          recentFamilies.current = rememberedAttempts
            .flatMap((attempt: any) => {
              const tags = Array.isArray(attempt.diagnostic_tags)
                ? attempt.diagnostic_tags
                : []
              return tags
                .filter((tag: unknown) => typeof tag === 'string' && tag.startsWith('family:'))
                .map((tag: string) => `${attempt.skill_id}:${tag}`)
            })
            .filter((family: string, index: number, families: string[]) => families.indexOf(family) === index)
            .slice(0, 9)

        }
      }

      const loadSkills = async () => {
        let skillsQuery = supabase.from('skills').select('id,name,generator_key,unit_id').eq('active', true)
        if (forcedSkillId) skillsQuery = skillsQuery.eq('id', forcedSkillId)
        else skillsQuery = skillsQuery.in('unit_id', ACTIVE_CURRICULUM_UNITS)
        return await skillsQuery
      }
      const { data: skillRows, error: skillsError } = await retryJwtFuture(loadSkills)
      if (skillsError) { setLoadError(userFacingError(skillsError, 'No se pudo cargar el currículo.')); setLoading(false); return }
      if (!skillRows || skillRows.length === 0) { setLoadError(forcedSkillId ? `No encuentro la habilidad ${forcedSkillId}.` : 'No encuentro habilidades activas para el repaso de matemáticas.'); setLoading(false); return }

      const typedSkillRows = skillRows as SkillRow[]
      if (!forcedSkillId && recentSkillIds.current.length > 0) {
        const unitBySkill = new Map(typedSkillRows.map((skill) => [skill.id, skill.unit_id]))
        recentUnitIds.current = Array.from(
          new Set(
            recentSkillIds.current
              .map((skillId) => unitBySkill.get(skillId) ?? '')
              .filter(Boolean)
          )
        ).slice(0, 4)
      }

      const { data: stateRows, error: stateError } = await retryJwtFuture(async () => await supabase.from('player_skill_state').select('skill_id,mastery,confidence,difficulty,priority,last_practiced_at').eq('player_id', id))
      if (stateError) { setLoadError(userFacingError(stateError, 'No se pudo cargar el progreso adaptativo.')); setLoading(false); return }
      const stateMap: Record<string, SkillState> = {}
      ;(stateRows ?? []).forEach((s: any) => { stateMap[s.skill_id] = s })
      setSkills(typedSkillRows)
      setStates(stateMap)
      setLoading(false)
    })()
  }, [forcedSkillId, queryReady])

  function chooseSkill(currentIndex: number) {
    if (!skills.length) return null
    if (forcedSkillId) return skills.find((skill) => skill.id === forcedSkillId) ?? skills[0]
    const now = Date.now()
    const recentSkills = new Set(recentSkillIds.current)
    const recentUnits = recentUnitIds.current
    const mixedSeed = (salt: number) => {
      let x = (seed ^ Math.imul(currentIndex + 1, 0x9e3779b9) ^ salt) >>> 0
      x ^= x >>> 16; x = Math.imul(x, 0x7feb352d) >>> 0; x ^= x >>> 15; x = Math.imul(x, 0x846ca68b) >>> 0; x ^= x >>> 16
      return x >>> 0
    }
    const skillSalt = (skillId: string) => {
      let hash = 2166136261
      for (let i = 0; i < skillId.length; i++) {
        hash ^= skillId.charCodeAt(i)
        hash = Math.imul(hash, 16777619)
      }
      return hash >>> 0
    }
    const pickFrom = (items: SkillRow[], salt: number) => items.length ? items[mixedSeed(salt) % items.length] : null
    const scored = skills.map((skill) => {
      const state = states[skill.id]
      const mastery = state?.mastery ?? 50
      const confidence = state?.confidence ?? 35
      const priority = state?.priority ?? 60
      const lastPracticed = state?.last_practiced_at ? new Date(state.last_practiced_at).getTime() : 0
      const daysSincePractice = lastPracticed ? Math.max(0, (now - lastPracticed) / 86_400_000) : 30
      const needScore = (100 - mastery) * 0.52 + (100 - confidence) * 0.23 + priority * 0.12
      const unseenBonus = state ? 0 : 12
      const recencyBonus = Math.min(14, daysSincePractice * 1.5)
      const recentUnitPenalty = recentUnits[0] === skill.unit_id ? 3 : recentUnits.slice(0, 3).includes(skill.unit_id) ? 1 : 0
      const recentSkillPenalty = recentSkills.has(skill.id) ? 1000 : 0
      const tieBreaker = mixedSeed(skillSalt(skill.id))
      return { skill, state, score: needScore + unseenBonus + recencyBonus - recentUnitPenalty - recentSkillPenalty, lastPracticed, mastery, tieBreaker }
    })
    const mode = currentIndex % 10
    if (mode <= 5) return pickFrom([...scored].sort((a,b) => b.score-a.score || b.tieBreaker-a.tieBreaker).slice(0, Math.min(6, scored.length)).map(i=>i.skill), 0x13579bdf) ?? skills[0]
    if (mode <= 7) return pickFrom([...scored].sort((a,b) => a.lastPracticed !== b.lastPracticed ? a.lastPracticed-b.lastPracticed : b.score-a.score || b.tieBreaker-a.tieBreaker).slice(0, Math.min(10, scored.length)).map(i=>i.skill), 0x2468ace0) ?? skills[0]
    if (mode === 8) {
      const maintenance = scored.filter(i=>i.state && i.mastery>=70).sort((a,b)=>a.lastPracticed!==b.lastPracticed?a.lastPracticed-b.lastPracticed:b.score-a.score || b.tieBreaker-a.tieBreaker).slice(0,8).map(i=>i.skill)
      if (maintenance.length) return pickFrom(maintenance, 0x55aa55aa) ?? skills[0]
    }
    return pickFrom([...scored].sort((a,b)=>b.score-a.score || b.tieBreaker-a.tieBreaker).slice(0,Math.min(24,scored.length)).map(i=>i.skill),0xa5a5a5a5) ?? skills[0]
  }

  useEffect(() => {
    if (loading || !skills.length || (!testMode && index >= SESSION_LENGTH)) return
    const skill = chooseSkill(index)
    if (!skill) return
    const difficulty = states[skill.id]?.difficulty ?? 1
    let candidateSeed = seed
    let nextQuestion = generateFirstEvaluationQuestion(skill, difficulty, candidateSeed)
    for (let attempt = 0; attempt < 80; attempt++) {
      const template = questionTemplate(nextQuestion.prompt)
      const family = nextQuestion.tags.find((tag) => tag.startsWith('family:'))
      const repeatsTemplate = family ? false : recentTemplates.current.includes(template)
      const repeatsFamily = family ? recentFamilies.current.includes(`${skill.id}:${family}`) : false
      if (!repeatsTemplate && !repeatsFamily) break
      candidateSeed = (seed + Math.imul(attempt + 1, 0x9e3779b9)) >>> 0
      nextQuestion = generateFirstEvaluationQuestion(skill, difficulty, candidateSeed)
    }
    const template = questionTemplate(nextQuestion.prompt)
    const family = nextQuestion.tags.find((tag) => tag.startsWith('family:'))
    recentTemplates.current = [template, ...recentTemplates.current.filter((item) => item !== template)].slice(0, 10)
    if (family) {
      const familyKey = `${skill.id}:${family}`
      recentFamilies.current = [familyKey, ...recentFamilies.current.filter((item) => item !== familyKey)].slice(0, skill.id === 'M11S06' ? 9 : 3)
    }
    if (!testMode) {
      recentSkillIds.current = [skill.id, ...recentSkillIds.current.filter((id) => id !== skill.id)].slice(0, 5)
      recentUnitIds.current = [skill.unit_id, ...recentUnitIds.current.filter((id) => id !== skill.unit_id)].slice(0, 4)
    }
    nextLocked.current = false
    setQuestion(nextQuestion); setAnswered(false); setSelectedOptionIndex(null); setFeedback(''); questionStarted.current = Date.now()
  }, [loading, index, seed, skills.length, forcedSkillId, testMode])

  useEffect(() => {
    if (testMode || !sessionId || !playerId || index < SESSION_LENGTH || closeStarted.current) return
    closeStarted.current = true
    setClosing(true)
    setCloseError('')
    ;(async () => {
      const supabase = createSupabaseBrowserClient()
      if (!supabase) { setCloseError('No se pudo conectar para guardar el cierre.'); setClosing(false); closeStarted.current = false; return }
      const { data, error } = await retryJwtFuture(async () =>
        await supabase.rpc('complete_levelup_session', {
          p_session_id: sessionId,
        })
      )
      if (error) { setCloseError(userFacingError(error, 'No se pudo guardar el cierre de la sesión.')); setClosing(false); closeStarted.current = false; return }
      const result = data as { completed?: boolean; attempts?: number; xp_earned?: number }
      if (!result?.completed || Number(result.attempts) !== SESSION_LENGTH) { setCloseError('No se pudo confirmar el cierre completo de la sesión.'); setClosing(false); closeStarted.current = false; return }
      setXp(Number(result.xp_earned ?? 0))
      setSessionClosed(true)
      setClosing(false)
    })()
  }, [index, sessionId, playerId, testMode])

  async function submit(optionIndex: number) {
    if (
      answerLocked.current ||
      answered ||
      !playerId ||
      !question ||
      (!testMode && !sessionId)
    ) return
    answerLocked.current = true
    setAnswered(true)
    setSelectedOptionIndex(optionIndex)
    const ok = optionIndex === question.answerIndex
    // Match the server-side bound while allowing a mission left open in a tab
    // to continue normally after a long pause.
    const responseMs = Math.min(
      3_600_000,
      Math.max(1, Date.now() - questionStarted.current)
    )

    if (testMode) {
      setTestAttempts((value) => value + 1)
      if (ok) setCorrect((value) => value + 1)
      setFeedback(ok ? '✓ Correcto · modo prueba, sin guardar progreso' : '↻ Incorrecto · modo prueba, sin guardar progreso')
      return
    }

    if (!sessionId) {
      answerLocked.current = false
      setAnswered(false)
      setSelectedOptionIndex(null)
      return
    }
    const activeSessionId = sessionId

    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      setFeedback('No se pudo conectar. Inténtalo de nuevo.')
      answerLocked.current = false
      setAnswered(false)
      setSelectedOptionIndex(null)
      return
    }
    const { data, error } = await retryJwtFuture(async () => await supabase.rpc('submit_levelup_attempt', { p_player_id: playerId, p_skill_id: question.skillId, p_correct: ok, p_response_ms: responseMs, p_difficulty: question.difficulty, p_seed: question.seed, p_prompt: question.prompt, p_session_id: activeSessionId, p_diagnostic_tags: question.tags }))
    if (error) {
      // The RPC may have committed before a network response was lost, or a
      // second tab may have advanced the same session. Reconcile from the
      // persisted attempts before presenting a retry that could never succeed.
      const { data: persistedAttempts, error: recoveryError } = await supabase
        .from('attempts')
        .select('question_seed,correct,xp_awarded')
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })

      if (!recoveryError && persistedAttempts) {
        const persistedCorrect = persistedAttempts.filter((attempt) => attempt.correct === true).length
        const persistedXp = persistedAttempts.reduce((sum, attempt) => sum + Number(attempt.xp_awarded ?? 0), 0)
        const currentWasRecorded = persistedAttempts.some(
          (attempt) => Number(attempt.question_seed) === question.seed
        )

        if (persistedAttempts.length >= SESSION_LENGTH) {
          setCorrect(persistedCorrect)
          setXp(persistedXp)
          setSelectedOptionIndex(null)
          setIndex(SESSION_LENGTH)
          return
        }

        if (currentWasRecorded) {
          setCorrect(persistedCorrect)
          setXp(persistedXp)
          setSelectedOptionIndex(null)
          setFeedback('✓ Esta respuesta ya estaba guardada · avance recuperado')
          return
        }
      }

      setFeedback(userFacingError(error, 'No se pudo guardar la respuesta. Inténtalo de nuevo.'))
      answerLocked.current = false
      setAnswered(false)
      setSelectedOptionIndex(null)
      return
    }
    const result = data as { xp_awarded:number; mastery:number; confidence:number; difficulty:number; priority?:number }
    setXp((value) => value + Number(result.xp_awarded))
    if (ok) setCorrect((value) => value + 1)
    setStates((current) => ({ ...current, [question.skillId]: { skill_id:question.skillId, mastery:Number(result.mastery), confidence:Number(result.confidence), difficulty:Number(result.difficulty), priority:Number.isFinite(Number(result.priority)) ? Number(result.priority) : Math.max(1,Math.min(100,Math.round(50+(50-Number(result.mastery))*0.8+(50-Number(result.confidence))*0.4))), last_practiced_at:new Date().toISOString() } }))
    setFeedback((ok ? '✓ Correcto' : '↻ Incorrecto') + ` · ${result.xp_awarded} XP · dominio ${result.mastery}/100`)
  }

  function next() {
    if (nextLocked.current) return
    nextLocked.current = true
    answerLocked.current = false
    setSeed((s) => (Math.imul(s, 1664525) + 1013904223) >>> 0)
    if (testMode) { setAnswered(false); setFeedback(''); questionStarted.current = Date.now(); return }
    setIndex((i) => i + 1)
  }

  if (loading) return <section className="card"><p className="muted">Cargando Curriculum Engine...</p></section>
  if (loadError) return <section className="card" role="alert"><span className="tag">ERROR DE CARGA</span><h1>No se puede preparar la misión</h1><p className="muted">{loadError}</p><Link href="/player" className="btn primary">VOLVER AL JUGADOR</Link></section>
  if (!playerId) return <section className="card"><h1>Sin jugador</h1><Link href="/player" className="btn primary">IR A JUGADOR</Link></section>

  if (!testMode && index >= SESSION_LENGTH) {
    const accuracy = Math.round((correct / SESSION_LENGTH) * 100)
    if (!sessionClosed) {
      return (
        <section className="card" style={{ textAlign:'center', padding:45 }}>
          <div style={{ fontSize:70 }}>💾</div>
          <span className="tag">GUARDANDO RESULTADOS</span>
          <h1>{closing ? 'Cerrando la misión...' : 'La misión está pendiente de guardar'}</h1>
          <p className="muted" role={closeError ? 'alert' : 'status'} aria-live="polite">{closeError || 'Estamos confirmando XP, minutos y progreso antes de volver al jugador.'}</p>
          {!closing && closeError && <button className="btn primary" type="button" onClick={() => { closeStarted.current = false; setCloseError(''); setIndex(SESSION_LENGTH - 1); setTimeout(() => setIndex(SESSION_LENGTH), 0) }}>REINTENTAR GUARDADO</button>}
        </section>
      )
    }
    return (
      <section className="card" style={{ textAlign:'center', padding:45 }}>
        <div style={{ fontSize:90 }}>🏆</div>
        <span className="tag">CURRICULUM ENGINE</span>
        <h1>Sesión completada</h1>
        <p className="muted">{SESSION_LENGTH} retos · {accuracy}% precisión · +{xp} XP</p>
        <p className="muted">Resultados guardados. La próxima sesión priorizará las habilidades con menor dominio.</p>
        <Link href="/player" className="btn primary">CONTINUAR AVENTURA</Link>
      </section>
    )
  }

  if (!question) return <section className="card"><p className="muted">Preparando el siguiente reto...</p></section>

  return <>
    <section className="card">
      <span className="tag">{testMode ? `🧪 MODO PRUEBA · ${question.skillId}` : 'REPASO DE MATEMÁTICAS · CURRICULUM ENGINE'}</span>
      <h1>{testMode ? 'Prueba de habilidad' : `Reto ${index + 1} de ${SESSION_LENGTH}`}</h1>
      <p className="muted">{testMode ? 'Esta pantalla fuerza una habilidad concreta para poder validar su generador.' : 'LEVEL UP selecciona habilidades según el dominio real del jugador.'}</p>
      {!testMode && <div className="bar" role="progressbar" aria-label="Progreso de la misión" aria-valuemin={0} aria-valuemax={SESSION_LENGTH} aria-valuenow={index}><i style={{ width:`${Math.round((index/SESSION_LENGTH)*100)}%` }} /></div>}
    </section>
    <section className="card">
      <span className="tag">{question.label} · dificultad {question.difficulty}/5</span>
      {!testMode && <div className="metric" style={{ marginTop:14, marginBottom:18 }}><b>🎯 REFUERZO PERSONALIZADO</b><p className="muted" style={{ marginBottom:0 }}>{(() => { const state=states[question.skillId]; if(!state)return 'Esta habilidad es nueva. LEVEL UP la incluye para conocer tu punto de partida.'; const mastery=state.mastery; if(mastery<50)return `Esta habilidad tiene ${mastery}% de dominio. LEVEL UP la ha priorizado para reforzarla.`; if(mastery<75)return `Tienes ${mastery}% de dominio. Vamos a consolidar esta habilidad.`; return `Tienes ${mastery}% de dominio. Este reto ayudará a mantenerla fuerte.` })()}</p></div>}
      <p ref={questionPrompt} tabIndex={-1} style={{ fontSize:24, fontWeight:900 }}>{question.prompt}</p>
      <div className="answers">{question.options.map((option,i) => {
        const isCorrectOption = answered && i === question.answerIndex
        const isSelectedWrong = answered && i === selectedOptionIndex && !isCorrectOption
        const resultLabel = isCorrectOption ? ' · ✓ Correcta' : isSelectedWrong ? ' · ✕ Tu respuesta' : ''
        return <button key={i} className={`answer${isCorrectOption ? ' correct' : ''}${isSelectedWrong ? ' incorrect' : ''}`} type="button" disabled={answered} onClick={()=>submit(i)} aria-label={`${String.fromCharCode(65+i)}. ${option}${resultLabel}`}>{String.fromCharCode(65+i)} · {option}{resultLabel}</button>
      })}</div>
      {answered && !feedback && <div className="metric" style={{ marginTop:16 }} role="status" aria-live="polite"><b>Guardando respuesta...</b></div>}
      {feedback && <div className="metric" style={{ marginTop:16 }} role={answered ? 'status' : 'alert'} aria-live="polite"><b>{feedback}</b></div>}
      {answered && feedback && <><div className="metric" style={{ marginTop:10 }}><b>💡 Por qué</b><p className="muted" style={{ marginBottom:0 }}>{question.solution}</p></div><button ref={nextButton} className="btn primary" type="button" style={{ marginTop:14 }} onClick={next}>{testMode?'GENERAR OTRA DE ESTA HABILIDAD':index+1===SESSION_LENGTH?'TERMINAR SESIÓN':'SIGUIENTE RETO'}</button></>}
    </section>
    <section className="card"><div className="grid two"><div className="metric"><b>{xp} XP</b><p className="muted">ganados en esta pantalla</p></div><div className="metric"><b>{correct}/{testMode ? testAttempts : index+(answered?1:0)}</b><p className="muted">aciertos</p></div></div></section>
  </>
}
