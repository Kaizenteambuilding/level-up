'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { isAuthenticationExpired, userFacingError } from '@/lib/userFacingError'
import { fetchCompletedActivity, fetchCompletedSkillEvidence } from '@/lib/progressQueries'
import { gameRank, levelProgress } from '@/lib/gameProgression'

type Player = { id:string; alias:string; xp:number; coins:number; level:number; daily_target_minutes:number }
type LastSession = { id:string; started_at:string; ended_at:string|null; completed:boolean; xp_earned:number }
type ActivitySession = { started_at:string; ended_at:string|null; actual_minutes:number|null }
type PrioritySkill = { skill_id:string; mastery:number; confidence:number; difficulty:number; priority:number; last_practiced_at:string|null; name:string }

const ACTIVE_CURRICULUM_UNITS = ['M01','M02','M03','M04','M05','M06','M07','M08','M09','M10','M11','M12','M13','M14','M15']
const SESSION_LENGTH = 10
const RESUME_WINDOW_MS = 24 * 60 * 60 * 1000

function localDayKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear(); const month = String(date.getMonth()+1).padStart(2,'0'); const day = String(date.getDate()).padStart(2,'0')
  return `${year}-${month}-${day}`
}
function previousLocalDay(date: Date) { const copy=new Date(date); copy.setHours(12,0,0,0); copy.setDate(copy.getDate()-1); return copy }
function sessionMinutes(session: ActivitySession) {
  const stored=Number(session.actual_minutes); if(Number.isFinite(stored)&&stored>0) return Math.min(180,Math.max(1,Math.round(stored)))
  if(!session.ended_at) return 0
  const elapsed=new Date(session.ended_at).getTime()-new Date(session.started_at).getTime(); if(!Number.isFinite(elapsed)||elapsed<=0) return 0
  return Math.min(180,Math.max(1,Math.round(elapsed/60000)))
}
function activitySummary(sessions: ActivitySession[]) {
  const trainingDays=new Set(sessions.map(s=>localDayKey(s.started_at))); const today=new Date(); const todayKey=localDayKey(today)
  const todayMinutes=sessions.filter(s=>localDayKey(s.started_at)===todayKey).reduce((sum,s)=>sum+sessionMinutes(s),0)
  let cursor=new Date(today); cursor.setHours(12,0,0,0); if(!trainingDays.has(localDayKey(cursor))) cursor=previousLocalDay(cursor)
  let streak=0; while(trainingDays.has(localDayKey(cursor))){streak+=1;cursor=previousLocalDay(cursor)}
  return {todayMinutes,totalTrainingDays:trainingDays.size,streak}
}

export default function PlayerDashboard() {
  const router=useRouter(); const [player,setPlayer]=useState<Player|null>(null); const [lastSession,setLastSession]=useState<LastSession|null>(null)
  const [sessionCorrect,setSessionCorrect]=useState(0); const [sessionAttempts,setSessionAttempts]=useState(0); const [openMissionProgress,setOpenMissionProgress]=useState<number|null>(null)
  const [openMissionProgressUnknown,setOpenMissionProgressUnknown]=useState(false); const [prioritySkills,setPrioritySkills]=useState<PrioritySkill[]>([])
  const [todayMinutes,setTodayMinutes]=useState(0); const [trainingDays,setTrainingDays]=useState(0); const [streak,setStreak]=useState(0)
  const [loading,setLoading]=useState(true); const [message,setMessage]=useState(''); const [dataWarnings,setDataWarnings]=useState<string[]>([])

  async function load() {
    setLoading(true); const supabase=createSupabaseBrowserClient(); if(!supabase){setMessage('Supabase no configurado.');setLoading(false);return}
    const {data:{user},error:userError}=await supabase.auth.getUser()
    if(!user&&(!userError||isAuthenticationExpired(userError))){localStorage.removeItem('levelup_player_id');router.replace('/login');return}
    if(userError||!user){setMessage(userFacingError(userError,'No se pudo comprobar tu sesión.'));setLoading(false);return}
    const savedPlayerId=localStorage.getItem('levelup_player_id'); let currentPlayer:Player|null=null
    if(savedPlayerId){const {data:savedPlayer,error:savedPlayerError}=await supabase.from('players').select('id,alias,xp,coins,level,daily_target_minutes').eq('id',savedPlayerId).maybeSingle(); if(savedPlayerError){setMessage(userFacingError(savedPlayerError,'No se pudo cargar el jugador seleccionado.'));setLoading(false);return} if(savedPlayer) currentPlayer=savedPlayer as Player; else localStorage.removeItem('levelup_player_id')}
    if(!currentPlayer){const {data:availablePlayers,error:playersError}=await supabase.from('players').select('id,alias,xp,coins,level,daily_target_minutes').order('alias',{ascending:true}); if(playersError){setMessage(userFacingError(playersError,'No se pudieron cargar los jugadores.'));setLoading(false);return} const players=(availablePlayers??[]) as Player[]; if(players.length===0){setMessage('Todavía no hay ningún jugador creado.');setLoading(false);return} if(players.length>1){router.replace('/parent/setup');return} currentPlayer=players[0];localStorage.setItem('levelup_player_id',currentPlayer.id)}
    const warnings:string[]=[]; setPlayer(currentPlayer);setMessage('');setDataWarnings([])
    const resumeSince=new Date(Date.now()-RESUME_WINDOW_MS).toISOString(); const {data:openSession,error:openSessionError}=await supabase.from('study_sessions').select('id').eq('player_id',currentPlayer.id).eq('mode','daily').eq('completed',false).is('ended_at',null).gte('started_at',resumeSince).order('started_at',{ascending:false}).limit(1).maybeSingle()
    if(openSessionError){warnings.push('No se pudo comprobar si hay una expedición diaria guardada.');setOpenMissionProgress(null);setOpenMissionProgressUnknown(false)} else if(openSession){const {count,error:countError}=await supabase.from('attempts').select('id',{count:'exact',head:true}).eq('session_id',openSession.id); if(countError||count===null){warnings.push('No se pudo cargar el avance exacto de la expedición guardada.');setOpenMissionProgress(null);setOpenMissionProgressUnknown(true)} else {setOpenMissionProgress(Math.min(SESSION_LENGTH,Number(count)));setOpenMissionProgressUnknown(false)}} else {setOpenMissionProgress(null);setOpenMissionProgressUnknown(false)}
    const [{data:activityData,error:activityError},{data:sessionData,error:sessionError},{data:stateData,error:stateError},{data:skillEvidenceData,error:skillEvidenceError}]=await Promise.all([
      fetchCompletedActivity(supabase,currentPlayer.id),
      supabase.from('study_sessions').select('id,started_at,ended_at,completed,xp_earned').eq('player_id',currentPlayer.id).eq('mode','daily').eq('completed',true).eq('phase','done').order('started_at',{ascending:false}).limit(1).maybeSingle(),
      supabase.from('player_skill_state').select(`skill_id,mastery,confidence,difficulty,priority,last_practiced_at,skills!inner (name,unit_id)`).eq('player_id',currentPlayer.id).eq('skills.active',true).in('skills.unit_id',ACTIVE_CURRICULUM_UNITS).order('priority',{ascending:false}),
      fetchCompletedSkillEvidence(supabase,currentPlayer.id)
    ])
    if(activityError) warnings.push('No se pudieron cargar el tiempo, los días de entrenamiento y la racha.'); else {const summary=activitySummary((activityData??[]) as ActivitySession[]);setTodayMinutes(summary.todayMinutes);setTrainingDays(summary.totalTrainingDays);setStreak(summary.streak)}
    if(sessionError) warnings.push('No se pudo cargar la última expedición diaria completada.'); else if(sessionData){setLastSession(sessionData as LastSession);const {data:attemptsData,error:attemptsError}=await supabase.from('attempts').select('correct').eq('session_id',sessionData.id);if(attemptsError)warnings.push('No se pudieron cargar los resultados de la última expedición.');const attempts=attemptsError?[]:attemptsData??[];setSessionAttempts(attempts.length);setSessionCorrect(attempts.filter((a:any)=>a.correct===true).length)} else {setLastSession(null);setSessionAttempts(0);setSessionCorrect(0)}
    if(stateError||skillEvidenceError) warnings.push('No se pudieron cargar las recomendaciones adaptativas.'); else if(stateData&&stateData.length>0){const completedCounts=skillEvidenceData?.attempts??{};setPrioritySkills(stateData.filter((s:any)=>Number(completedCounts[s.skill_id]??0)>=2&&(Number(s.mastery)<70||Number(s.confidence)<60)).slice(0,3).map((s:any)=>({...s,name:s.skills?.name??s.skill_id})))}
    setDataWarnings(warnings);setLoading(false)
  }
  useEffect(()=>{load()},[])
  if(loading)return <section className="card loading-card" role="status" aria-live="polite"><div><div className="loading-dot" aria-hidden="true"/><p className="muted">Cargando partida…</p></div></section>
  if(!player)return <section className="card"><h1>Primero crea un jugador</h1><p className="muted">{message}</p><div className="action-row"><button className="btn primary" type="button" onClick={load}>REINTENTAR</button><Link href="/parent/setup" className="btn dark">IR A JUGADORES</Link></div></section>

  const accuracy=sessionAttempts>0?Math.round((sessionCorrect/sessionAttempts)*100):0; const target=Math.max(1,Number(player.daily_target_minutes)||35); const dailyProgress=Math.min(100,Math.round((todayMinutes/target)*100)); const hasOpenMission=openMissionProgress!==null||openMissionProgressUnknown; const gameLevel=levelProgress(player.xp,player.level)
  const completedToday=!hasOpenMission&&Boolean(lastSession?.ended_at)&&localDayKey(lastSession!.ended_at!)===localDayKey(new Date())
  const missionHref=completedToday?'/world':'/mission'
  const missionLabel=hasOpenMission?(openMissionProgressUnknown?'▶ CONTINUAR EXPEDICIÓN':`▶ CONTINUAR EXPEDICIÓN · ${openMissionProgress}/${SESSION_LENGTH}`):completedToday?'✓ EXPEDICIÓN DE HOY COMPLETADA':'▶ EXPEDICIÓN DE HOY'

  return <>
    <section className="card hero"><span className="tag">🎮 PARTIDA DE HOY</span><h1>{player.alias}</h1><p className="muted">Nivel {gameLevel.level} · {gameRank(gameLevel.level)} · {player.xp} XP · 🪙 {player.coins} · 🔥 {streak} días de racha</p>
      {hasOpenMission&&<div className="metric" style={{marginTop:14}}><b>{openMissionProgressUnknown?'⏯ Expedición en curso':`⏯ Expedición en curso · ${openMissionProgress}/${SESSION_LENGTH}`}</b><p className="muted" style={{marginBottom:0}}>{openMissionProgressUnknown?'Tu expedición está guardada. No se ha podido leer el progreso exacto en este momento.':'Tu progreso está guardado. Puedes continuar exactamente donde lo dejaste.'}</p></div>}
      {completedToday&&<div className="metric" style={{marginTop:14}}><b>✅ Expedición diaria completada</b><p className="muted" style={{marginBottom:0}}>Tu expedición de hoy ya está guardada. Explora el mundo, revisa tus recompensas y vuelve mañana para una nueva expedición.</p></div>}
      <div className="action-row" style={{marginTop:14}}><Link href="/world" className="btn dark">🗺️ VOLVER AL MUNDO</Link><Link href={missionHref} className="btn primary" style={{fontSize:18,padding:'16px 22px'}}>{missionLabel}</Link><Link href="/parent/setup" className="btn dark">👥 CAMBIAR JUGADOR</Link><Link href="/parent" className="btn dark">👨‍👦 PANEL PADRE</Link></div>
    </section>
    {dataWarnings.length>0&&<section className="card"><span className="tag">⚠️ DATOS PARCIALES</span><h2>No se ha podido actualizar todo el dashboard</h2><p className="muted">Los datos visibles pueden estar incompletos. No interpretes un cero o un bloque vacío como falta de progreso.</p><ul className="muted">{dataWarnings.map(w=><li key={w}>{w}</li>)}</ul><button className="btn dark" type="button" onClick={load}>ACTUALIZAR DATOS</button></section>}
    <section className="card"><span className="tag">📊 ÚLTIMA EXPEDICIÓN</span><h2>Tu última expedición diaria</h2>{lastSession?<div className="grid two"><div className="metric"><b>{accuracy}%</b><p className="muted">{sessionCorrect}/{sessionAttempts} respuestas correctas</p></div><div className="metric"><b>+{lastSession.xp_earned} XP</b><p className="muted">ganados en la última expedición</p></div></div>:<p className="muted">Completa tu primera expedición diaria para ver aquí sus resultados.</p>}</section>
    <section className="card"><span className="tag">🎯 ENTRENAMIENTO ADAPTATIVO</span><h2>LEVEL UP propone practicar</h2>{prioritySkills.length>0?<div style={{display:'grid',gap:10}}>{prioritySkills.map(skill=><div className="metric" key={skill.skill_id}><b>{skill.name}</b><p className="muted">{skill.last_practiced_at?`Dominio ${skill.mastery}% · dificultad ${skill.difficulty}/5`:`Habilidad nueva · dificultad inicial ${skill.difficulty}/5`}</p><div className="bar" role="progressbar" aria-label={`Dominio de ${skill.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={skill.mastery}><i style={{width:`${skill.mastery}%`}}/></div></div>)}</div>:<p className="muted">No hay ahora mismo ninguna habilidad que necesite práctica prioritaria.</p>}</section>
    <section className="card"><h2>Tu progreso</h2><div className="grid two"><div className="metric"><b>Nivel {gameLevel.level} · {gameLevel.percent}%</b><p className="muted">{gameLevel.required?`${gameLevel.current}/${gameLevel.required} XP hacia el siguiente nivel`:'nivel máximo alcanzado'}</p><div className="bar" role="progressbar" aria-label="Progreso del nivel del personaje" aria-valuemin={0} aria-valuemax={100} aria-valuenow={gameLevel.percent}><i style={{width:`${gameLevel.percent}%`}}/></div></div><div className="metric"><b>🔥 {streak}</b><p className="muted">días de racha actual</p></div><div className="metric"><b>{trainingDays}</b><p className="muted">días con entrenamiento completado</p></div><div className="metric"><b>{todayMinutes}/{target} min</b><p className="muted">entrenados hoy · objetivo diario</p><div className="bar" role="progressbar" aria-label="Progreso del objetivo diario" aria-valuemin={0} aria-valuemax={100} aria-valuenow={dailyProgress}><i style={{width:`${dailyProgress}%`}}/></div></div></div></section>
  </>
}
