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
  last_practiced_at?: string | null
}

const ACTIVE_CURRICULUM_UNITS = ['M01','M02','M03','M04','M05','M06','M07','M08','M09','M10','M11','M12','M13','M14','M15']
const SESSION_LENGTH = 10
const RESUME_WINDOW_MS = 24 * 60 * 60 * 1000

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
  const [feedback, setFeedback] = useState('')
  const [xp, setXp] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [closing, setClosing] = useState(false)
  const [sessionClosed, setSessionClosed] = useState(false)
  const [closeError, setCloseError] = useState('')
  const closeStarted = useRef(false)
  const questionStarted = useRef(Date.now())
  const recentTemplates = useRef<string[]>([])
  const recentFamilies = useRef<string[]>([])
  const recentSkillIds = useRef<string[]>([])
  const recentUnitIds = useRef<string[]>([])

  function questionTemplate(prompt: string) {
    return prompt.toLowerCase().replace(/\d+(?:[.,]\d+)?\/\d+(?:[.,]\d+)?/g, '#/#').replace(/\d+(?:[.,]\d+)?/g, '#').replace(/\s+/g, ' ').trim()
  }

  const testMode = Boolean(forcedSkillId)

  useEffect(() => {
    if (!queryReady) return
    ;(async () => {
      const id = localStorage.getItem('levelup_player_id')
      setPlayerId(id)
      if (!id) { setLoading(false); return }
      const supabase = createSupabaseBrowserClient()
      if (!supabase) { setLoadError('Supabase no está configurado.'); setLoading(false); return }

      if (!forcedSkillId) {
        const resumeSince = new Date(Date.now() - RESUME_WINDOW_MS).toISOString()
        const { data: openSession, error: openSessionError } = await retryJwtFuture(async () => await supabase.from('study_sessions').select('id,started_at').eq('player_id', id).eq('mode', 'daily').eq('completed', false).is('ended_at', null).gte('started_at', resumeSince).order('started_at', { ascending: false }).limit(1).maybeSingle())
        if (openSessionError) { setLoadError('No se pudo revisar la sesión anterior: ' + openSessionError.message); setLoading(false); return }
        if (openSession) {
          const { data: previousAttempts, error: attemptsError } = await retryJwtFuture(async () => await supabase.from('attempts').select('correct,xp_awarded,skill_id,prompt_snapshot,diagnostic_tags').eq('session_id', openSession.id).order('created_at', { ascending: true }))
          if (attemptsError) { setLoadError('No se pudo recuperar la sesión anterior: ' + attemptsError.message); setLoading(false); return }
          const attempts = previousAttempts ?? []
          setSessionId(openSession.id)
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

          const { data: sessionData, error: sessionError } = await retryJwtFuture(async () => await supabase.from('study_sessions').insert({ player_id: id, mode: 'daily', phase: 'warmup' }).select('id').single())
          if (sessionError) { setLoadError('No se pudo crear la sesión: ' + sessionError.message); setLoading(false); return }
          setSessionId(sessionData.id)
        }
      }

      const loadSkills = async () => {
        let skillsQuery = supabase.from('skills').select('id,name,generator_key,unit_id').eq('active', true)
        if (forcedSkillId) skillsQuery = skillsQuery.eq('id', forcedSkillId)
        else skillsQuery = skillsQuery.in('unit_id', ACTIVE_CURRICULUM_UNITS)
        return await skillsQuery
      }
      const { data: skillRows, error: skillsError } = await retryJwtFuture(loadSkills)
      if (skillsError) { setLoadError(skillsError.message); setLoading(false); return }
      if (!skillRows || skillRows.length === 0) { setLoadError(forcedSkillId ? `No encuentro la habilidad ${forcedSkillId}.` : 'No encuentro habilidades activas para la 1ª evaluación.'); setLoading(false); return }

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
      if (stateError) { setLoadError('No se pudo cargar el progreso adaptativo: ' + stateError.message); setLoading(false); return }
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
      return { skill, state, score: needScore + unseenBonus + recencyBonus - recentUnitPenalty - recentSkillPenalty, lastPracticed, mastery }
    })
    const mode = currentIndex % 10
    if (mode <= 5) return pickFrom([...scored].sort((a,b) => b.score-a.score).slice(0, Math.min(6, scored.length)).map(i=>i.skill), 0x13579bdf) ?? skills[0]
    if (mode <= 7) return pickFrom([...scored].sort((a,b) => a.lastPracticed !== b.lastPracticed ? a.lastPracticed-b.lastPracticed : b.score-a.score).slice(0, Math.min(10, scored.length)).map(i=>i.skill), 0x2468ace0) ?? skills[0]
    if (mode === 8) {
      const maintenance = scored.filter(i=>i.state && i.mastery>=70).sort((a,b)=>a.lastPracticed!==b.lastPracticed?a.lastPracticed-b.lastPracticed:b.score-a.score).slice(0,8).map(i=>i.skill)
      if (maintenance.length) return pickFrom(maintenance, 0x55aa55aa) ?? skills[0]
    }
    return pickFrom([...scored].sort((a,b)=>b.score-a.score).slice(0,Math.min(24,scored.length)).map(i=>i.skill),0xa5a5a5a5) ?? skills[0]
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
    setQuestion(nextQuestion); setAnswered(false); setFeedback(''); questionStarted.current = Date.now()
  }, [loading, index, seed, skills.length, forcedSkillId, testMode])

  useEffect(() => {
    if (testMode || !sessionId || !playerId || index < SESSION_LENGTH || closeStarted.current) return
    closeStarted.current = true
    setClosing(true)
    setCloseError('')
    ;(async () => {
      const supabase = createSupabaseBrowserClient()
      if (!supabase) { setCloseError('No se pudo conectar para guardar el cierre.'); setClosing(false); closeStarted.current = false; return }
      const { data: sessionAttempts, error: attemptsError } = await retryJwtFuture(async () => await supabase.from('attempts').select('xp_awarded,response_ms').eq('session_id', sessionId))
      if (attemptsError) { setCloseError('No se pudo verificar el cierre de la sesión.'); setClosing(false); closeStarted.current = false; return }
      const attempts = sessionAttempts ?? []
      if (attempts.length < SESSION_LENGTH) { setCloseError('Falta guardar parte de la sesión. Inténtalo de nuevo.'); setClosing(false); closeStarted.current = false; return }
      const finishedAt = new Date().toISOString()
      const sessionXp = attempts.reduce((sum: number, attempt: any) => sum + Number(attempt.xp_awarded ?? 0), 0)
      const activeMs = attempts.reduce((sum: number, attempt: any) => sum + Number(attempt.response_ms ?? 0), 0)
      const actualMinutes = Math.min(180, Math.max(1, Math.round(activeMs / 60_000)))
      setXp(sessionXp)
      const { data: closedSession, error } = await supabase.from('study_sessions').update({ ended_at: finishedAt, completed_at: finishedAt, completed: true, xp_earned: sessionXp, actual_minutes: actualMinutes, phase: 'done' }).eq('id', sessionId).eq('player_id', playerId).eq('completed', false).select('id').maybeSingle()
      if (error) { setCloseError('No se pudo guardar el cierre de la sesión.'); setClosing(false); closeStarted.current = false; return }
      if (!closedSession) {
        const { data: existing } = await supabase.from('study_sessions').select('id,completed').eq('id', sessionId).eq('player_id', playerId).maybeSingle()
        if (!existing?.completed) { setCloseError('No se pudo confirmar el cierre de la sesión.'); setClosing(false); closeStarted.current = false; return }
      }
      setSessionClosed(true)
      setClosing(false)
    })()
  }, [index, sessionId, playerId, testMode])

  async function submit(optionIndex: number) {
    if (answered || !playerId || !question) return
    setAnswered(true)
    const ok = optionIndex === question.answerIndex
    const responseMs = Math.max(1, Date.now() - questionStarted.current)
    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      setFeedback('No se pudo conectar. Inténtalo de nuevo.')
      setAnswered(false)
      return
    }
    const { data, error } = await retryJwtFuture(async () => await supabase.rpc('submit_levelup_attempt', { p_player_id: playerId, p_skill_id: question.skillId, p_correct: ok, p_response_ms: responseMs, p_difficulty: question.difficulty, p_seed: question.seed, p_prompt: question.prompt, p_session_id: sessionId, p_diagnostic_tags: question.tags }))
    if (error) { setFeedback('Error: ' + error.message); setAnswered(false); return }
    const result = data as { xp_awarded:number; mastery:number; confidence:number; difficulty:number; priority?:number }
    setXp((value) => value + Number(result.xp_awarded))
    if (ok) setCorrect((value) => value + 1)
    setStates((current) => ({ ...current, [question.skillId]: { skill_id:question.skillId, mastery:Number(result.mastery), confidence:Number(result.confidence), difficulty:Number(result.difficulty), priority:Number.isFinite(Number(result.priority)) ? Number(result.priority) : Math.max(1,Math.min(100,Math.round(50+(50-Number(result.mastery))*0.8+(50-Number(result.confidence))*0.4))), last_practiced_at:new Date().toISOString() } }))
    setFeedback((ok ? '✓ Correcto' : '↻ Incorrecto') + ` · ${result.xp_awarded} XP · dominio ${result.mastery}/100`)
  }

  function next() {
    setSeed((s) => (Math.imul(s, 1664525) + 1013904223) >>> 0)
    if (testMode) { setAnswered(false); setFeedback(''); questionStarted.current = Date.now(); return }
    setIndex((i) => i + 1)
  }

  if (loading) return <section className="card"><p className="muted">Cargando Curriculum Engine...</p></section>
  if (loadError) return <section className="card"><span className="tag">ERROR DE CARGA</span><h1>No se puede preparar la misión</h1><p className="muted">{loadError}</p><Link href="/player" className="btn primary">VOLVER AL JUGADOR</Link></section>
  if (!playerId) return <section className="card"><h1>Sin jugador</h1><Link href="/player" className="btn primary">IR A JUGADOR</Link></section>

  if (!testMode && index >= SESSION_LENGTH) {
    const accuracy = Math.round((correct / SESSION_LENGTH) * 100)
    if (!sessionClosed) {
      return (
        <section className="card" style={{ textAlign:'center', padding:45 }}>
          <div style={{ fontSize:70 }}>💾</div>
          <span className="tag">GUARDANDO RESULTADOS</span>
          <h1>{closing ? 'Cerrando la misión...' : 'La misión está pendiente de guardar'}</h1>
          <p className="muted">{closeError || 'Estamos confirmando XP, minutos y progreso antes de volver al jugador.'}</p>
          {!closing && closeError && <button className="btn primary" onClick={() => { closeStarted.current = false; setCloseError(''); setIndex(SESSION_LENGTH - 1); setTimeout(() => setIndex(SESSION_LENGTH), 0) }}>REINTENTAR GUARDADO</button>}
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
      <span className="tag">{testMode ? `🧪 MODO PRUEBA · ${question.skillId}` : '1ª EVALUACIÓN · CURRICULUM ENGINE'}</span>
      <h1>{testMode ? 'Prueba de habilidad' : `Reto ${index + 1} de ${SESSION_LENGTH}`}</h1>
      <p className="muted">{testMode ? 'Esta pantalla fuerza una habilidad concreta para poder validar su generador.' : 'LEVEL UP selecciona habilidades según el dominio real del jugador.'}</p>
      {!testMode && <div className="bar"><i style={{ width:`${Math.round((index/SESSION_LENGTH)*100)}%` }} /></div>}
    </section>
    <section className="card">
      <span className="tag">{question.label} · dificultad {question.difficulty}/5</span>
      {!testMode && <div className="metric" style={{ marginTop:14, marginBottom:18 }}><b>🎯 REFUERZO PERSONALIZADO</b><p className="muted" style={{ marginBottom:0 }}>{(() => { const mastery=states[question.skillId]?.mastery??0; if(mastery<50)return `Esta habilidad tiene ${mastery}% de dominio. LEVEL UP la ha priorizado para reforzarla.`; if(mastery<75)return `Tienes ${mastery}% de dominio. Vamos a consolidar esta habilidad.`; return `Tienes ${mastery}% de dominio. Este reto ayudará a mantenerla fuerte.` })()}</p></div>}
      <p style={{ fontSize:24, fontWeight:900 }}>{question.prompt}</p>
      <div className="answers">{question.options.map((option,i)=><button key={i} className="answer" disabled={answered} onClick={()=>submit(i)}>{String.fromCharCode(65+i)} · {option}</button>)}</div>
      {feedback && <><div className="metric" style={{ marginTop:16 }}><b>{feedback}</b></div><div className="metric" style={{ marginTop:10 }}><b>💡 Por qué</b><p className="muted" style={{ marginBottom:0 }}>{question.solution}</p></div><button className="btn primary" style={{ marginTop:14 }} onClick={next}>{testMode?'GENERAR OTRA DE ESTA HABILIDAD':index+1===SESSION_LENGTH?'TERMINAR SESIÓN':'SIGUIENTE RETO'}</button></>}
    </section>
    <section className="card"><div className="grid two"><div className="metric"><b>{xp} XP</b><p className="muted">ganados en esta pantalla</p></div><div className="metric"><b>{correct}/{testMode ? answered ? 1 : 0 : index+(answered?1:0)}</b><p className="muted">aciertos</p></div></div></section>
  </>
}
