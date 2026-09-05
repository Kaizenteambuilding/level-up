'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { userFacingError } from '@/lib/userFacingError'

const SESSION_LENGTH = 10
const MODE = 'english_listening'
const NETWORK_TIMEOUT_MS = 12_000
const RECENT_PROMPT_WINDOW = 80

type ListeningItem = {
  skillId: string
  difficulty: number
  spoken: string
  question: string
  options: [string, string, string, string]
  answerIndex: number
  solution: string
}

type SkillState = { mastery: number; priority: number; difficulty: number }
type PracticeOpenResult = { data: unknown; error: { message?: string } | null }

const BANK: ListeningItem[] = [
  { skillId: 'E01S01', difficulty: 1, spoken: 'Hi, my name is Emma and I am twelve years old.', question: 'How old is Emma?', options: ['Ten','Eleven','Twelve','Thirteen'], answerIndex: 2, solution: 'Emma says: “I am twelve years old.”' },
  { skillId: 'E01S01', difficulty: 1, spoken: 'I live in Bristol with my parents and my little brother.', question: 'Where does the speaker live?', options: ['Bristol','London','Oxford','Leeds'], answerIndex: 0, solution: 'The speaker says: “I live in Bristol.”' },
  { skillId: 'E01S01', difficulty: 2, spoken: 'My birthday is on the fifteenth of March.', question: 'When is the birthday?', options: ['March 5th','March 15th','May 15th','March 50th'], answerIndex: 1, solution: 'The date heard is the fifteenth of March.' },
  { skillId: 'E01S01', difficulty: 2, spoken: 'My favourite subject is science because I love experiments.', question: 'What is the favourite subject?', options: ['Maths','English','Science','History'], answerIndex: 2, solution: 'The speaker explicitly says “My favourite subject is science.”' },
  { skillId: 'E01S04', difficulty: 1, spoken: 'Please open your books on page twenty-four.', question: 'What should the students do?', options: ['Close their books','Open page 24','Write page 42','Stand up'], answerIndex: 1, solution: 'The instruction is to open the books on page twenty-four.' },
  { skillId: 'E01S04', difficulty: 1, spoken: 'Work in pairs and compare your answers.', question: 'How should students work?', options: ['Alone','In pairs','In groups of four','With the teacher'], answerIndex: 1, solution: 'The key instruction is “Work in pairs.”' },
  { skillId: 'E01S04', difficulty: 2, spoken: 'Listen carefully and underline the correct answer.', question: 'What action comes after listening?', options: ['Circle the title','Underline the correct answer','Close the notebook','Read aloud'], answerIndex: 1, solution: 'The instruction says to underline the correct answer.' },
  { skillId: 'E02S04', difficulty: 1, spoken: 'I get up at seven o clock and have breakfast at half past seven.', question: 'What time is breakfast?', options: ['7:00','7:15','7:30','8:00'], answerIndex: 2, solution: 'Half past seven means 7:30.' },
  { skillId: 'E02S04', difficulty: 1, spoken: 'After school, I do my homework before I play video games.', question: 'What happens first after school?', options: ['Video games','Homework','Dinner','Football'], answerIndex: 1, solution: 'Homework happens before video games.' },
  { skillId: 'E02S04', difficulty: 2, spoken: 'On Tuesdays I have basketball practice from six until seven fifteen.', question: 'When does basketball finish?', options: ['6:15','6:45','7:00','7:15'], answerIndex: 3, solution: 'The practice lasts until seven fifteen.' },
  { skillId: 'E03S03', difficulty: 1, spoken: 'The library is next to the bank and opposite the park.', question: 'What is opposite the library?', options: ['The bank','The park','The school','The station'], answerIndex: 1, solution: 'The library is opposite the park.' },
  { skillId: 'E03S03', difficulty: 2, spoken: 'My sister has got long curly hair and green eyes.', question: 'What kind of hair does the sister have?', options: ['Short straight hair','Long curly hair','Short curly hair','Long black hair'], answerIndex: 1, solution: 'The description says “long curly hair.”' },
  { skillId: 'E03S03', difficulty: 2, spoken: 'There are two chairs beside the desk and a lamp on the desk.', question: 'Where is the lamp?', options: ['Under the desk','On the desk','Beside the chair','Near the door'], answerIndex: 1, solution: 'The speaker says the lamp is on the desk.' },
  { skillId: 'E04S04', difficulty: 2, spoken: 'First we visited the museum, then we had lunch, and finally we went to the beach.', question: 'What happened last?', options: ['The museum','Lunch','The beach','The hotel'], answerIndex: 2, solution: '“Finally” introduces the last event: going to the beach.' },
  { skillId: 'E04S04', difficulty: 3, spoken: 'Yesterday I missed the bus, so I walked to school and arrived ten minutes late.', question: 'Why did the speaker walk to school?', options: ['The weather was nice','The bus was missed','School was closed','A friend called'], answerIndex: 1, solution: 'The speaker walked because they missed the bus.' },
  { skillId: 'E05S01', difficulty: 1, spoken: 'You can borrow my calculator, but you cannot use my phone.', question: 'What can be borrowed?', options: ['The phone','The calculator','A laptop','A book'], answerIndex: 1, solution: 'Permission is given for the calculator.' },
  { skillId: 'E05S01', difficulty: 2, spoken: 'Can you help me carry these boxes, please?', question: 'What is the speaker asking for?', options: ['Directions','Permission to leave','Help carrying boxes','A drink'], answerIndex: 2, solution: 'The request is for help carrying boxes.' },
  { skillId: 'E05S02', difficulty: 2, spoken: 'Visitors must show their tickets at the entrance.', question: 'What must visitors show?', options: ['Their passports','Their tickets','Their phones','Their bags'], answerIndex: 1, solution: 'The rule requires visitors to show tickets.' },
  { skillId: 'E05S02', difficulty: 2, spoken: 'You must not feed the animals in this area.', question: 'What is prohibited?', options: ['Taking photos','Feeding the animals','Walking slowly','Reading signs'], answerIndex: 1, solution: '“Must not” marks the prohibition against feeding animals.' },
  { skillId: 'E05S03', difficulty: 2, spoken: 'This weekend we are going to visit my grandparents in York.', question: 'What is the plan?', options: ['Visit grandparents','Study at home','Go swimming','Travel to France'], answerIndex: 0, solution: 'The plan is to visit grandparents in York.' },
  { skillId: 'E05S03', difficulty: 3, spoken: 'I am going to save twenty euros each month because I want to buy a new bike.', question: 'Why is the speaker saving money?', options: ['For a phone','For a trip','For a bike','For a game'], answerIndex: 2, solution: 'The reason given is to buy a new bike.' },
  { skillId: 'E05S04', difficulty: 1, spoken: 'Would you like some orange juice?', question: 'What is being offered?', options: ['Orange juice','Coffee','Water','Milk'], answerIndex: 0, solution: 'The offer is orange juice.' },
  { skillId: 'E05S04', difficulty: 2, spoken: 'Excuse me, how can I get to the train station?', question: 'What information does the speaker need?', options: ['A price','Directions','A timetable','A ticket'], answerIndex: 1, solution: 'The speaker is asking how to get somewhere, so they need directions.' },
  { skillId: 'E05S04', difficulty: 2, spoken: 'Why do not we meet outside the cinema at quarter to six?', question: 'What time is suggested?', options: ['5:15','5:30','5:45','6:15'], answerIndex: 2, solution: 'Quarter to six is 5:45.' },
  { skillId: 'E06S02', difficulty: 2, spoken: 'The sports centre opens at nine, but the swimming pool does not open until ten.', question: 'When does the pool open?', options: ['8:00','9:00','9:30','10:00'], answerIndex: 3, solution: 'The pool opens at ten.' },
  { skillId: 'E06S02', difficulty: 3, spoken: 'The red bus goes directly to the city centre, while the blue bus stops at the hospital first.', question: 'Which bus goes directly to the city centre?', options: ['The red bus','The blue bus','Both buses','Neither bus'], answerIndex: 0, solution: 'The red bus is described as going directly to the city centre.' },
  { skillId: 'E06S02', difficulty: 3, spoken: 'The school trip costs eighteen pounds, including transport and lunch, but not the museum ticket.', question: 'What is NOT included in the eighteen pounds?', options: ['Transport','Lunch','Museum ticket','The school trip'], answerIndex: 2, solution: 'The museum ticket is explicitly excluded.' },
  { skillId: 'E06S04', difficulty: 2, spoken: 'Please queue here and have your ticket ready.', question: 'What should people do?', options: ['Wait in line with their ticket ready','Sit down','Buy food','Leave the building'], answerIndex: 0, solution: 'Queue means wait in line, and the ticket should be ready.' },
  { skillId: 'E06S04', difficulty: 3, spoken: 'Tickets are sold out for tonight, but there are still seats available tomorrow.', question: 'What can someone still do?', options: ['Buy a ticket for tonight','Buy a ticket for tomorrow','Enter for free tonight','Reserve a table'], answerIndex: 1, solution: 'Tonight is sold out, but tomorrow still has seats.' },
  { skillId: 'E06S04', difficulty: 3, spoken: 'The café is closed on Sundays, so we need to meet there on Saturday instead.', question: 'Why are they meeting on Saturday?', options: ['Saturday is cheaper','Sunday is too busy','The café is closed on Sunday','They have school on Sunday'], answerIndex: 2, solution: 'The café is closed on Sundays.' },
]

async function withTimeout<T>(operation: PromiseLike<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} agotó el tiempo de espera`)), NETWORK_TIMEOUT_MS) }),
    ])
  } finally { if (timer) clearTimeout(timer) }
}

function hashText(value: string) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619) }
  return hash >>> 0
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? `${fallback} ${error.message}.` : fallback
}

export default function EnglishListeningSession() {
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [states, setStates] = useState<Record<string, SkillState>>({})
  const [history, setHistory] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [xp, setXp] = useState(0)
  const [item, setItem] = useState<ListeningItem | null>(null)
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completed, setCompleted] = useState(false)
  const [completedToday, setCompletedToday] = useState(false)
  const [closing, setClosing] = useState(false)
  const [speechAvailable, setSpeechAvailable] = useState(true)
  const questionStarted = useRef(Date.now())
  const sessionSeed = useMemo(() => hashText(sessionId ?? playerId ?? MODE), [sessionId, playerId])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const id = localStorage.getItem('levelup_player_id')
        setPlayerId(id)
        if (!id) throw new Error('No hay un jugador seleccionado')
        setSpeechAvailable(typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window)
        const supabase = createSupabaseBrowserClient()
        if (!supabase) throw new Error('Supabase no está configurado')
        const openPractice = supabase.rpc.bind(supabase) as unknown as (name: 'open_levelup_practice_session', args: { p_player_id: string; p_mode: string }) => PromiseLike<PracticeOpenResult>
        const { data: opened, error: openError } = await withTimeout(openPractice('open_levelup_practice_session', { p_player_id: id, p_mode: MODE }), 'La apertura de Muelle de escucha')
        if (!active) return
        if (openError) {
          if ((openError.message ?? '').toLowerCase().includes('practice already completed today')) { setCompletedToday(true); return }
          throw new Error(userFacingError(openError, 'No se pudo abrir Muelle de escucha.'))
        }
        const openedId = String((opened as { session_id?: string } | null)?.session_id ?? '')
        if (!openedId) throw new Error('El servidor no devolvió un identificador de sesión')
        setSessionId(openedId)
        const [stateResult, attemptsResult, historyResult] = await Promise.all([
          withTimeout(supabase.from('player_skill_state').select('skill_id,mastery,priority,difficulty').eq('player_id', id), 'La carga del progreso de Inglés'),
          withTimeout(supabase.from('attempts').select('correct,xp_awarded,prompt_snapshot').eq('session_id', openedId).order('created_at', { ascending: true }), 'La recuperación del muelle'),
          withTimeout(supabase.from('attempts').select('prompt_snapshot').eq('player_id', id).contains('diagnostic_tags', ['english_listening']).order('created_at', { ascending: false }).limit(RECENT_PROMPT_WINDOW), 'La carga del historial de escucha'),
        ])
        if (stateResult.error) throw new Error(userFacingError(stateResult.error, 'No se pudo cargar el progreso de Inglés.'))
        if (attemptsResult.error) throw new Error(userFacingError(attemptsResult.error, 'No se pudo recuperar el muelle.'))
        if (historyResult.error) throw new Error(userFacingError(historyResult.error, 'No se pudo cargar el historial de escucha.'))
        const stateMap: Record<string, SkillState> = {}
        for (const row of stateResult.data ?? []) {
          if (typeof row.skill_id === 'string' && row.skill_id.startsWith('E')) stateMap[row.skill_id] = { mastery: Number(row.mastery ?? 50), priority: Number(row.priority ?? 50), difficulty: Number(row.difficulty ?? 1) }
        }
        setStates(stateMap)
        const attempts = attemptsResult.data ?? []
        setIndex(Math.min(SESSION_LENGTH, attempts.length))
        setCorrect(attempts.filter((attempt) => attempt.correct === true).length)
        setXp(attempts.reduce((sum, attempt) => sum + Number(attempt.xp_awarded ?? 0), 0))
        setHistory((historyResult.data ?? []).map((row) => String(row.prompt_snapshot ?? '')).filter(Boolean))
      } catch (cause) {
        if (active) setError(errorMessage(cause, 'No se pudo abrir Muelle de escucha.'))
      } finally { if (active) setLoading(false) }
    })()
    return () => { active = false; if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel() }
  }, [])

  useEffect(() => {
    if (loading || error || item || !sessionId || index >= SESSION_LENGTH) return
    const targetDifficulty = Math.max(1, Math.min(5, Math.round(Object.values(states).reduce((sum, state) => sum + state.difficulty, 0) / Math.max(1, Object.keys(states).length))))
    const ranked = BANK.filter((candidate) => !history.includes(`LISTEN: ${candidate.spoken}`)).sort((a, b) => {
      const aState = states[a.skillId] ?? { mastery: 50, priority: 50, difficulty: targetDifficulty }
      const bState = states[b.skillId] ?? { mastery: 50, priority: 50, difficulty: targetDifficulty }
      const aScore = aState.mastery - aState.priority + Math.abs(a.difficulty - aState.difficulty) * 12
      const bScore = bState.mastery - bState.priority + Math.abs(b.difficulty - bState.difficulty) * 12
      if (aScore !== bScore) return aScore - bScore
      return (hashText(a.spoken) ^ sessionSeed ^ index) - (hashText(b.spoken) ^ sessionSeed ^ index)
    })
    const pool = ranked.length ? ranked : BANK
    const next = pool[(sessionSeed + index * 7) % Math.min(pool.length, 8)]
    setItem(next)
    setAnswered(false); setSelected(null); setFeedback(''); questionStarted.current = Date.now()
  }, [loading, error, item, sessionId, index, states, history, sessionSeed])

  useEffect(() => {
    if (!sessionId || index < SESSION_LENGTH || completed || closing) return
    setClosing(true)
    ;(async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        if (!supabase) throw new Error('No se pudo conectar para cerrar el muelle')
        const { data, error: closeError } = await withTimeout(supabase.rpc('complete_levelup_session', { p_session_id: sessionId }), 'El cierre de Muelle de escucha')
        if (closeError) throw new Error(userFacingError(closeError, 'No se pudo cerrar Muelle de escucha.'))
        const result = data as { completed?: boolean; attempts?: number; xp_earned?: number }
        if (!result?.completed || Number(result.attempts) !== SESSION_LENGTH) throw new Error('El servidor no confirmó los 10 audios')
        setXp(Number(result.xp_earned ?? xp)); setCompleted(true)
      } catch (cause) { setError(errorMessage(cause, 'No se pudo cerrar Muelle de escucha.')) } finally { setClosing(false) }
    })()
  }, [sessionId, index, completed, closing, xp])

  function playAudio() {
    if (!item) return
    if (!speechAvailable) { setFeedback('Este navegador no ofrece síntesis de voz. Prueba Chrome, Edge o Safari actualizado.'); return }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(item.spoken)
    utterance.lang = 'en-GB'
    utterance.rate = item.difficulty >= 3 ? 0.92 : 0.86
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }

  async function submit(optionIndex: number) {
    if (answered || !item || !playerId || !sessionId) return
    setAnswered(true); setSelected(optionIndex)
    const ok = optionIndex === item.answerIndex
    try {
      const supabase = createSupabaseBrowserClient()
      if (!supabase) throw new Error('No se pudo conectar')
      const seed = hashText(`${sessionId}:${index}:${item.spoken}`)
      const { data, error: submitError } = await withTimeout(supabase.rpc('submit_levelup_attempt', {
        p_player_id: playerId,
        p_skill_id: item.skillId,
        p_correct: ok,
        p_response_ms: Math.min(3_600_000, Math.max(1, Date.now() - questionStarted.current)),
        p_difficulty: item.difficulty,
        p_seed: seed,
        p_prompt: `LISTEN: ${item.spoken}`,
        p_session_id: sessionId,
        p_diagnostic_tags: ['subject:english', 'english_listening', `listening_difficulty:${item.difficulty}`],
      }), 'El guardado de la respuesta')
      if (submitError) throw new Error(userFacingError(submitError, 'No se pudo guardar la respuesta.'))
      const result = data as { xp_awarded?: number; mastery?: number; priority?: number; difficulty?: number }
      setStates((current) => ({ ...current, [item.skillId]: { mastery: Number(result.mastery ?? 50), priority: Number(result.priority ?? 50), difficulty: Number(result.difficulty ?? item.difficulty) } }))
      setXp((value) => value + Number(result.xp_awarded ?? 0)); if (ok) setCorrect((value) => value + 1)
      setFeedback((ok ? '✓ Escucha correcta' : '↻ Revisa el audio') + ` · ${Number(result.xp_awarded ?? 0)} XP`)
      setHistory((current) => [`LISTEN: ${item.spoken}`, ...current].slice(0, RECENT_PROMPT_WINDOW))
    } catch (cause) { setAnswered(false); setSelected(null); setFeedback(errorMessage(cause, 'No se pudo guardar la respuesta.')) }
  }

  function next() { if (!answered || !feedback) return; window.speechSynthesis?.cancel(); setItem(null); setIndex((value) => value + 1) }

  if (loading) return <section className="card" role="status"><p className="muted">Abriendo Muelle de escucha…</p></section>
  if (completedToday) return <section className="card" style={{ textAlign: 'center', padding: 45 }}><div style={{ fontSize: 72 }}>🎧✅</div><span className="tag">MUELLE COMPLETADO HOY</span><h1>Escucha de hoy terminada</h1><p className="muted">Los 10 audios ya están completados y las recompensas guardadas.</p><div className="action-row" style={{ justifyContent: 'center' }}><Link className="btn primary" href="/zone/english">VOLVER AL PUERTO</Link></div></section>
  if (error) return <section className="card" role="alert"><span className="tag">MUELLE DE ESCUCHA</span><h1>No se puede continuar</h1><p className="muted">{error}</p><div className="action-row"><button className="btn primary" type="button" onClick={() => window.location.reload()}>REINTENTAR</button><Link className="btn dark" href="/zone/english">VOLVER AL PUERTO</Link></div></section>
  if (index >= SESSION_LENGTH) {
    if (!completed) return <section className="card" role="status"><h1>{closing ? 'Validando los 10 audios…' : 'Confirmando resultados…'}</h1></section>
    return <section className="card" style={{ textAlign: 'center', padding: 45 }}><div style={{ fontSize: 72 }}>🎧✅</div><span className="tag">MUELLE SUPERADO</span><h1>Permiso de escucha conseguido</h1><p className="muted">10 audios · {Math.round(correct / SESSION_LENGTH * 100)}% precisión · +{xp} XP</p><div className="action-row" style={{ justifyContent: 'center' }}><Link className="btn primary" href="/zone/english">VOLVER AL PUERTO</Link><Link className="btn dark" href="/world">VOLVER AL MUNDO</Link></div></section>
  }
  if (!item) return <section className="card" role="status"><p className="muted">Preparando el siguiente audio…</p></section>

  const progress = Math.min(SESSION_LENGTH, index + Number(Boolean(answered && feedback)))
  return <div className="mission-console">
    <section className="card mission-control"><div><span className="tag">🎧 INGLÉS · MUELLE DE ESCUCHA</span><h1>Audio {index + 1} de {SESSION_LENGTH}</h1><p className="muted">Escucha primero. El texto no se muestra hasta después de responder.</p></div><Link className="btn dark mission-exit" href="/zone/english">SALIR AL PUERTO</Link><div className="energy-track" role="progressbar" aria-valuemin={0} aria-valuemax={SESSION_LENGTH} aria-valuenow={progress}>{Array.from({ length: SESSION_LENGTH }, (_, position) => <span key={position} className={position < progress ? 'charged' : position === index ? 'active' : ''}>{position < progress ? '⚡' : position + 1}</span>)}</div></section>
    <div className="mission-stage"><aside className="mission-core"><span className="mission-avatar">🎧</span><span className="core-city">🌍</span><div className="core-orb">🔊</div><b>Muelle {Math.round(progress / SESSION_LENGTH * 100)}%</b><span>{correct} aciertos · {xp} XP</span><small>10 audios para completar el distrito</small></aside>
      <section className="card mission-question"><span className="tag">Comprensión oral · dificultad {item.difficulty}/5</span><div style={{ textAlign: 'center', padding: '18px 0' }}><button className="btn primary" type="button" onClick={playAudio}>🔊 {answered ? 'REPETIR AUDIO' : 'REPRODUCIR AUDIO'}</button><p className="muted" style={{ marginTop: 10 }}>Puedes escucharlo más de una vez.</p></div><p style={{ fontSize: 23, fontWeight: 900 }}>{item.question}</p><div className="answers">{item.options.map((option, i) => { const isCorrect = answered && i === item.answerIndex; const isWrong = answered && i === selected && !isCorrect; return <button key={i} className={`answer${isCorrect ? ' correct' : ''}${isWrong ? ' incorrect' : ''}`} disabled={answered} type="button" onClick={() => submit(i)}>{String.fromCharCode(65 + i)} · {option}{isCorrect ? ' · ✓ Correcta' : isWrong ? ' · ✕ Tu respuesta' : ''}</button> })}</div>{feedback && <div className="metric" style={{ marginTop: 16 }}><b>{feedback}</b></div>}{answered && feedback && <><div className="metric" style={{ marginTop: 10 }}><b>📝 Transcripción</b><p className="muted" style={{ marginBottom: 4 }}>{item.spoken}</p><b>💡 Clave</b><p className="muted" style={{ marginBottom: 0 }}>{item.solution}</p></div><button className="btn primary" type="button" style={{ marginTop: 14 }} onClick={next}>{index + 1 === SESSION_LENGTH ? 'VALIDAR MUELLE' : 'SIGUIENTE AUDIO'}</button></>}</section>
    </div>
  </div>
}
