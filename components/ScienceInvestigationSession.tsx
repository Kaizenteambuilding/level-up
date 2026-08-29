'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { chooseAdaptiveSkill } from '@/lib/adaptiveEngine'
import { generateCurriculumQuestion } from '@/lib/curriculumQuestionGenerator'
import type { GeneratedQuestion } from '@/lib/firstEvaluationGenerators'
import { userFacingError } from '@/lib/userFacingError'

const SESSION_LENGTH = 10
const MODE = 'science_investigation'
const SKILL_IDS = new Set(['B01S01', 'B01S02', 'B01S03', 'B01S04'])
const TIMEOUT = 12_000
const HISTORY = 80

type SkillRow = { id: string; name: string; generator_key: string; unit_id: string }
type SkillState = { skill_id: string; mastery: number; confidence: number; difficulty: number; priority: number; last_practiced_at?: string | null }
type PracticeOpenResult = { data: unknown; error: { message?: string } | null }

async function timed<T>(value: PromiseLike<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try { return await Promise.race([Promise.resolve(value), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} agotó el tiempo de espera`)), TIMEOUT) })]) }
  finally { if (timer) clearTimeout(timer) }
}
function hash(value: string) { let h = 2166136261; for (let i = 0; i < value.length; i += 1) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
function template(value: string) { return value.toLowerCase().replace(/\d+(?:[.,]\d+)?/g, '#').replace(/\s+/g, ' ').trim() }
function message(error: unknown, fallback: string) { return error instanceof Error && error.message ? `${fallback} ${error.message}.` : fallback }

export default function ScienceInvestigationSession() {
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [skills, setSkills] = useState<SkillRow[]>([])
  const [states, setStates] = useState<Record<string, SkillState>>({})
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null)
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [xp, setXp] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
  const [completedToday, setCompletedToday] = useState(false)
  const [closing, setClosing] = useState(false)
  const recentTemplates = useRef<string[]>([])
  const recentSkillIds = useRef<string[]>([])
  const recentUnitIds = useRef<string[]>([])
  const unitCounts = useRef<Record<string, number>>({})
  const started = useRef(Date.now())
  const seedBase = useMemo(() => hash(sessionId ?? playerId ?? MODE), [sessionId, playerId])

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const id = localStorage.getItem('levelup_player_id')
        if (!id) throw new Error('No hay un jugador seleccionado')
        setPlayerId(id)
        const supabase = createSupabaseBrowserClient(); if (!supabase) throw new Error('Supabase no está configurado')
        const openPractice = supabase.rpc.bind(supabase) as unknown as (name: 'open_levelup_practice_session', args: { p_player_id: string; p_mode: string }) => PromiseLike<PracticeOpenResult>
        const { data: opened, error: openError } = await timed(openPractice('open_levelup_practice_session', { p_player_id: id, p_mode: MODE }), 'La apertura de Cámara de investigación')
        if (!active) return
        if (openError) {
          if ((openError.message ?? '').toLowerCase().includes('practice already completed today')) { setCompletedToday(true); return }
          throw new Error(userFacingError(openError, 'No se pudo abrir Cámara de investigación.'))
        }
        const sid = String((opened as { session_id?: string } | null)?.session_id ?? '')
        if (!sid) throw new Error('El servidor no devolvió una sesión')
        setSessionId(sid)
        const [units, stateRows, attempts, history] = await Promise.all([
          timed(supabase.from('curriculum_units').select('id').eq('subject_id', 'biology_geology').eq('active', true).order('sort_order'), 'La carga del currículo'),
          timed(supabase.from('player_skill_state').select('skill_id,mastery,confidence,difficulty,priority,last_practiced_at').eq('player_id', id), 'La carga del progreso'),
          timed(supabase.from('attempts').select('correct,xp_awarded,skill_id,prompt_snapshot,created_at').eq('session_id', sid).order('created_at'), 'La recuperación de la investigación'),
          timed(supabase.from('attempts').select('skill_id,prompt_snapshot,created_at').eq('player_id', id).like('skill_id', 'B%').order('created_at', { ascending: false }).limit(HISTORY), 'El historial de ciencias'),
        ])
        if (units.error || stateRows.error || attempts.error || history.error || !units.data?.length) throw new Error('No se pudo recuperar el currículo o el progreso')
        const { data: rows, error: skillsError } = await timed(supabase.from('skills').select('id,name,generator_key,unit_id').eq('active', true).in('unit_id', units.data.map((row) => String(row.id))), 'La carga de investigación científica')
        if (skillsError) throw new Error('No se pudieron cargar las habilidades de investigación')
        const loaded = ((rows ?? []) as SkillRow[]).filter((skill) => SKILL_IDS.has(skill.id))
        if (!loaded.length) throw new Error('No hay habilidades de investigación científica disponibles')
        setSkills(loaded)
        const stateMap: Record<string, SkillState> = {}
        for (const row of stateRows.data ?? []) { const skillId = String(row.skill_id ?? ''); if (SKILL_IDS.has(skillId)) stateMap[skillId] = { skill_id: skillId, mastery: Number(row.mastery ?? 50), confidence: Number(row.confidence ?? 50), difficulty: Number(row.difficulty ?? 1), priority: Number(row.priority ?? 50), last_practiced_at: row.last_practiced_at } }
        setStates(stateMap)
        const skillToUnit = new Map(loaded.map((skill) => [skill.id, skill.unit_id]))
        const counts: Record<string, number> = {}
        for (const attempt of attempts.data ?? []) { const skillId = String(attempt.skill_id ?? ''), unitId = skillToUnit.get(skillId); if (!unitId) continue; counts[unitId] = (counts[unitId] ?? 0) + 1; recentSkillIds.current.unshift(skillId); recentUnitIds.current.unshift(unitId) }
        unitCounts.current = counts; recentSkillIds.current = recentSkillIds.current.slice(0, 5); recentUnitIds.current = recentUnitIds.current.slice(0, 3)
        recentTemplates.current = (history.data ?? []).map((row) => template(String(row.prompt_snapshot ?? ''))).filter(Boolean).slice(0, HISTORY)
        setIndex(Math.min(SESSION_LENGTH, attempts.data?.length ?? 0)); setCorrect((attempts.data ?? []).filter((row) => row.correct === true).length); setXp((attempts.data ?? []).reduce((sum, row) => sum + Number(row.xp_awarded ?? 0), 0))
      } catch (cause) { if (active) setError(message(cause, 'No se pudo abrir Cámara de investigación.')) }
      finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (loading || error || question || !sessionId || !skills.length || index >= SESSION_LENGTH) return
    const units = Array.from(new Set(skills.map((skill) => skill.unit_id)))
    const primary = chooseAdaptiveSkill({ skills, states, focusUnitIds: units, reviewUnitIds: [], sessionUnitCounts: unitCounts.current, recentSkillIds: recentSkillIds.current, recentUnitIds: recentUnitIds.current, seed: seedBase, questionIndex: index })
    if (!primary) { setError('No se pudo elegir un reto de investigación.'); return }
    const candidates = [primary, ...skills.filter((skill) => skill.id !== primary.id)]
    const base = (seedBase + Math.imul(index + 1, 0x9e3779b9)) >>> 0
    let generated: GeneratedQuestion | null = null
    for (let c = 0; c < candidates.length && !generated; c += 1) { let seed = (base + Math.imul(c, 0x85ebca6b)) >>> 0; for (let attempt = 0; attempt < 20; attempt += 1) { const next = generateCurriculumQuestion(candidates[c], states[candidates[c].id]?.difficulty ?? 1, seed); if (!recentTemplates.current.includes(template(next.prompt))) { generated = next; break } seed = (seed + 2654435761) >>> 0 } }
    generated ??= generateCurriculumQuestion(primary, states[primary.id]?.difficulty ?? 1, base)
    recentTemplates.current = [template(generated.prompt), ...recentTemplates.current].slice(0, HISTORY)
    setQuestion(generated); setAnswered(false); setSelected(null); setFeedback(''); started.current = Date.now()
  }, [loading, error, question, sessionId, skills, states, seedBase, index])

  useEffect(() => {
    if (!sessionId || index < SESSION_LENGTH || completed || closing) return
    setClosing(true)
    void (async () => { try { const supabase = createSupabaseBrowserClient(); if (!supabase) throw new Error('No se pudo conectar'); const { data, error: closeError } = await timed(supabase.rpc('complete_levelup_session', { p_session_id: sessionId }), 'El cierre de Cámara de investigación'); if (closeError) throw new Error(userFacingError(closeError, 'No se pudo cerrar la investigación.')); const result = data as { completed?: boolean; attempts?: number; xp_earned?: number }; if (!result?.completed || Number(result.attempts) !== SESSION_LENGTH) throw new Error('El servidor no confirmó los 10 retos'); setXp(Number(result.xp_earned ?? xp)); setCompleted(true) } catch (cause) { setError(message(cause, 'No se pudo cerrar Cámara de investigación.')) } finally { setClosing(false) } })()
  }, [index, sessionId, completed, closing, xp])

  async function submit(optionIndex: number) {
    if (answered || !question || !playerId || !sessionId) return
    setAnswered(true); setSelected(optionIndex); const ok = optionIndex === question.answerIndex
    try {
      const supabase = createSupabaseBrowserClient(); if (!supabase) throw new Error('No se pudo conectar')
      const { data, error: submitError } = await timed(supabase.rpc('submit_levelup_attempt', { p_player_id: playerId, p_skill_id: question.skillId, p_correct: ok, p_response_ms: Math.min(3_600_000, Math.max(1, Date.now() - started.current)), p_difficulty: question.difficulty, p_seed: question.seed, p_prompt: question.prompt, p_session_id: sessionId, p_diagnostic_tags: [...question.tags, 'subject:biology_geology', 'science_investigation'] }), 'El guardado del reto')
      if (submitError) throw new Error(userFacingError(submitError, 'No se pudo guardar el reto.'))
      const result = data as { xp_awarded?: number; mastery?: number; confidence?: number; difficulty?: number; priority?: number }
      const unitId = skills.find((skill) => skill.id === question.skillId)?.unit_id
      if (unitId) { unitCounts.current = { ...unitCounts.current, [unitId]: (unitCounts.current[unitId] ?? 0) + 1 }; recentSkillIds.current = [question.skillId, ...recentSkillIds.current.filter((id) => id !== question.skillId)].slice(0, 5); recentUnitIds.current = [unitId, ...recentUnitIds.current].slice(0, 3) }
      setStates((current) => ({ ...current, [question.skillId]: { skill_id: question.skillId, mastery: Number(result.mastery ?? 50), confidence: Number(result.confidence ?? 50), difficulty: Number(result.difficulty ?? 1), priority: Number(result.priority ?? 50), last_practiced_at: new Date().toISOString() } }))
      setXp((value) => value + Number(result.xp_awarded ?? 0)); if (ok) setCorrect((value) => value + 1)
      setFeedback((ok ? '✓ Evidencia bien interpretada' : '↻ Revisa hipótesis, variables y evidencias') + ` · ${Number(result.xp_awarded ?? 0)} XP`)
    } catch (cause) { setAnswered(false); setSelected(null); setFeedback(message(cause, 'No se pudo guardar el reto.')) }
  }

  if (loading) return <section className="card" role="status"><p className="muted">Abriendo Cámara de investigación…</p></section>
  if (completedToday) return <section className="card" style={{ textAlign: 'center', padding: 45 }}><div style={{ fontSize: 72 }}>⚗️✅</div><span className="tag">INVESTIGACIÓN COMPLETADA HOY</span><h1>Experimento terminado</h1><p className="muted">Los 10 retos, el progreso y las recompensas ya están guardados.</p><div className="action-row" style={{ justifyContent: 'center' }}><Link className="btn primary" href="/zone/science">VOLVER AL LABORATORIO</Link><Link className="btn dark" href="/world">VOLVER AL MUNDO</Link></div></section>
  if (error) return <section className="card" role="alert"><span className="tag">CÁMARA DE INVESTIGACIÓN</span><h1>No se puede continuar</h1><p className="muted">{error}</p><div className="action-row"><button className="btn primary" type="button" onClick={() => window.location.reload()}>REINTENTAR</button><Link className="btn dark" href="/zone/science">VOLVER AL LABORATORIO</Link></div></section>
  if (index >= SESSION_LENGTH) { if (!completed) return <section className="card" role="status"><h1>{closing ? 'Validando los 10 retos…' : 'Confirmando resultados…'}</h1></section>; return <section className="card" style={{ textAlign: 'center', padding: 45 }}><div style={{ fontSize: 72 }}>⚗️✨</div><span className="tag">INVESTIGACIÓN SUPERADA</span><h1>Protocolo científico completado</h1><p className="muted">10 retos · {Math.round((correct / SESSION_LENGTH) * 100)}% precisión · +{xp} XP</p><div className="action-row" style={{ justifyContent: 'center' }}><Link className="btn primary" href="/zone/science">VOLVER AL LABORATORIO</Link><Link className="btn dark" href="/world">VOLVER AL MUNDO</Link></div></section> }
  if (!question) return <section className="card" role="status"><p className="muted">Preparando el siguiente reto…</p></section>
  const progress = Math.min(SESSION_LENGTH, index + Number(answered && feedback))
  return <div className="mission-console"><section className="card mission-control"><div><span className="tag">🔬 CIENCIAS · INVESTIGACIÓN</span><h1>Reto {index + 1} de {SESSION_LENGTH}</h1><p className="muted">Hipótesis, variables, pruebas justas, evidencias y fuentes científicas.</p></div><Link className="btn dark mission-exit" href="/zone/science">SALIR AL LABORATORIO</Link><div className="energy-track" role="progressbar" aria-valuemin={0} aria-valuemax={SESSION_LENGTH} aria-valuenow={progress}>{Array.from({ length: SESSION_LENGTH }, (_, position) => <span key={position} className={position < progress ? 'charged' : position === index ? 'active' : ''}>{position < progress ? '⚡' : position + 1}</span>)}</div></section><div className="mission-stage"><aside className="mission-core"><span className="mission-avatar">⚗️</span><span className="core-city">🔬</span><div className="core-orb">⚡</div><b>Protocolo {Math.round((progress / SESSION_LENGTH) * 100)}%</b><span>{correct} aciertos · {xp} XP</span><small>10 retos para validar la investigación</small></aside><section className="card mission-question"><span className="tag">{question.label} · dificultad {question.difficulty}/5</span><p tabIndex={-1} style={{ fontSize: 24, fontWeight: 900 }}>{question.prompt}</p><div className="answers">{question.options.map((option, i) => { const isCorrect = answered && i === question.answerIndex; const isWrong = answered && i === selected && !isCorrect; return <button key={i} className={`answer${isCorrect ? ' correct' : ''}${isWrong ? ' incorrect' : ''}`} disabled={answered} type="button" onClick={() => submit(i)}>{String.fromCharCode(65 + i)} · {option}{isCorrect ? ' · ✓ Correcta' : isWrong ? ' · ✕ Tu respuesta' : ''}</button> })}</div>{feedback && <div className="metric" style={{ marginTop: 16 }}><b>{feedback}</b></div>}{answered && feedback && <><div className="metric" style={{ marginTop: 10 }}><b>🔎 Evidencia científica</b><p className="muted" style={{ marginBottom: 0 }}>{question.solution}</p></div><button className="btn primary" type="button" style={{ marginTop: 14 }} onClick={() => { setQuestion(null); setIndex((value) => value + 1) }}>{index + 1 === SESSION_LENGTH ? 'VALIDAR INVESTIGACIÓN' : 'SIGUIENTE RETO'}</button></>}</section></div></div>
}
