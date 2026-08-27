'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { evaluateSpanishWriting, generateSpanishWritingTask, spanishWritingSkillIds, type SpanishWritingTask, type WritingEvaluation } from '@/lib/spanishWritingTasks'

const SESSION_LENGTH = 10
const SKILL_IDS = spanishWritingSkillIds()
const SKILL_LABELS: Record<string, string> = {
  L04S01: 'Tildes y acentuación',
  L04S02: 'Ortografía de letras',
  L04S03: 'Puntuación',
  L04S04: 'Corrección y revisión',
  L05S01: 'Narración',
  L05S02: 'Descripción',
  L05S03: 'Exposición y explicación',
  L05S04: 'Planificación y revisión',
}

type ReplayTask = SpanishWritingTask & { difficulty: number; seed: number; label: string }

function wordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0
}

function exactMinimum(task: ReplayTask) {
  const criterion = task.criteria.find((item) => item.type === 'min_words')
  if (!criterion || criterion.type !== 'min_words') return null
  const extraWords = task.id.startsWith('edit-') ? 0 : Math.max(0, Math.min(8, (task.difficulty - 1) * 2))
  return criterion.value + extraWords
}

function buildTask(index: number, runSeed: number): ReplayTask {
  const skillId = SKILL_IDS[index % SKILL_IDS.length]
  const difficulty = 1 + (index % 5)
  const seed = (runSeed + Math.imul(index + 1, 0x9e3779b9)) >>> 0
  const task = generateSpanishWritingTask(skillId, seed)
  return { ...task, difficulty, seed, label: SKILL_LABELS[skillId] ?? skillId }
}

export default function SpanishWritingReplay() {
  const [runSeed, setRunSeed] = useState(() => Date.now() >>> 0)
  const [index, setIndex] = useState(0)
  const [response, setResponse] = useState('')
  const [evaluation, setEvaluation] = useState<WritingEvaluation | null>(null)
  const [correct, setCorrect] = useState(0)
  const task = useMemo(() => buildTask(index, runSeed), [index, runSeed])
  const minimum = exactMinimum(task)
  const words = wordCount(response)

  function submit() {
    if (!response.trim() || evaluation) return
    const result = evaluateSpanishWriting(task, response, task.difficulty)
    setEvaluation(result)
    if (result.ok) setCorrect((value) => value + 1)
  }

  function next() {
    if (!evaluation) return
    setResponse('')
    setEvaluation(null)
    setIndex((value) => value + 1)
  }

  function restart() {
    setRunSeed(Date.now() >>> 0)
    setIndex(0)
    setResponse('')
    setEvaluation(null)
    setCorrect(0)
  }

  if (index >= SESSION_LENGTH) {
    return <section className="card" style={{ textAlign: 'center', padding: 45 }}><div style={{ fontSize: 72 }}>✍️🔁</div><span className="tag">PRÁCTICA LIBRE COMPLETADA</span><h1>10 encargos de repaso</h1><p className="muted">{correct} de {SESSION_LENGTH} textos cumplieron todos los criterios. Esta repetición no guarda intentos, XP, monedas ni otra finalización diaria.</p><div className="action-row" style={{ justifyContent: 'center' }}><button className="btn primary" type="button" onClick={restart}>PRACTICAR OTRA VEZ</button><Link className="btn dark" href="/zone/language">VOLVER A LA BIBLIOTECA</Link></div></section>
  }

  const progress = index + Number(Boolean(evaluation))
  return <div className="mission-console"><section className="card mission-control"><div><span className="tag">📚 LENGUA · PRÁCTICA LIBRE</span><h1>Encargo {index + 1} de {SESSION_LENGTH}</h1><p className="muted">Repaso sin recompensas ni cambios de progreso. Puedes repetirlo tantas veces como quieras.</p></div><Link className="btn dark mission-exit" href="/zone/language">SALIR A LA BIBLIOTECA</Link><div className="energy-track" role="progressbar" aria-valuemin={0} aria-valuemax={SESSION_LENGTH} aria-valuenow={progress}>{Array.from({ length: SESSION_LENGTH }, (_, position) => <span key={position} className={position < progress ? 'charged' : position === index ? 'active' : ''}>{position < progress ? '⚡' : position + 1}</span>)}</div></section><div className="mission-stage"><aside className="mission-core"><span className="mission-avatar">✍️</span><span className="core-city">🔁</span><div className="core-orb">⚡</div><b>Repaso {Math.round((progress / SESSION_LENGTH) * 100)}%</b><span>{correct} validados</span><small>Sin XP · sin monedas · sin persistencia</small></aside><section className="card mission-question"><span className="tag">{task.label} · dificultad {task.difficulty}/5</span><h2>{task.title}</h2><p style={{ fontSize: 22, fontWeight: 800 }}>{task.prompt}</p><p className="muted">💡 {task.hint}</p><div className="metric" style={{ marginTop: 14 }}><b>🎯 Debes cumplir</b><ul>{task.criteria.map((criterion) => <li key={criterion.code}>{criterion.type === 'min_words' && minimum !== null ? `Mínimo: ${minimum} palabras` : criterion.label}</li>)}</ul></div><div className="metric" style={{ marginTop: 14, marginBottom: 10 }}>{minimum === null ? <><b>📝 Sin mínimo de palabras</b><p className="muted" style={{ margin: '6px 0 0' }}>Corrige sin necesidad de alargar · {words} palabras escritas</p></> : <><b>📝 Objetivo: mínimo {minimum} palabras</b><p className="muted" style={{ margin: '6px 0 0' }}>{words} / {minimum} palabras</p></>}</div><textarea aria-label="Tu texto" value={response} disabled={Boolean(evaluation)} onChange={(event) => setResponse(event.target.value)} rows={8} maxLength={1800} placeholder="Escribe aquí tu respuesta…" style={{ width: '100%', resize: 'vertical', padding: 16, borderRadius: 14, font: 'inherit' }} />{!evaluation && <div className="action-row" style={{ marginTop: 14 }}><button className="btn primary" type="button" onClick={submit} disabled={!response.trim()}>REVISAR TEXTO</button><span className="muted">Práctica libre: no se guardará este intento.</span></div>}{evaluation && <><div className="metric" style={{ marginTop: 16 }}><b>{evaluation.ok ? '✓ Texto validado' : `↻ ${evaluation.met}/${evaluation.total} criterios cumplidos`}</b><p className="muted">{evaluation.wordCount} palabras · {evaluation.sentenceCount} oraciones</p><ul>{evaluation.checks.map((check) => <li key={check.code}>{check.met ? '✓' : '↻'} {check.code === 'words' && minimum !== null ? `Mínimo: ${minimum} palabras` : check.label}</li>)}</ul></div><button className="btn primary" type="button" style={{ marginTop: 14 }} onClick={next}>{index + 1 === SESSION_LENGTH ? 'TERMINAR REPASO' : 'SIGUIENTE ENCARGO'}</button></>}</section></div></div>
}
