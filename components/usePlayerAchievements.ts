'use client'

import { useEffect, useMemo, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { DemoAchievementContext, DemoGameState, demoAchievements } from '@/lib/demoGame'
import type { DemoPlayer } from './DemoGameShell'

type BossAchievementSummary = {
  boss_wins?: number
  boss_subjects_defeated?: number
  perfect_boss_wins?: number
  cleared_boss_terms?: number
}

const EMPTY_BOSS_SUMMARY: Required<BossAchievementSummary> = {
  boss_wins: 0,
  boss_subjects_defeated: 0,
  perfect_boss_wins: 0,
  cleared_boss_terms: 0,
}

export function usePlayerAchievements(player: DemoPlayer | null, game: DemoGameState) {
  const [bossSummary, setBossSummary] = useState(EMPTY_BOSS_SUMMARY)

  useEffect(() => {
    if (!player?.id) return
    let cancelled = false
    ;(async () => {
      const supabase = createSupabaseBrowserClient()
      if (!supabase) return
      const db = supabase as any
      const { data, error } = await db.rpc('get_levelup_achievement_summary', { p_player_id: player.id })
      if (cancelled || error || !data) return
      setBossSummary({
        boss_wins: Number(data.boss_wins ?? 0),
        boss_subjects_defeated: Number(data.boss_subjects_defeated ?? 0),
        perfect_boss_wins: Number(data.perfect_boss_wins ?? 0),
        cleared_boss_terms: Number(data.cleared_boss_terms ?? 0),
      })
    })()
    return () => { cancelled = true }
  }, [player?.id])

  return useMemo(() => {
    const context: DemoAchievementContext = {
      totalMissions: player?.totalMissions ?? 0,
      streakDays: player?.streakDays ?? 0,
      level: player?.level ?? 1,
      bossWins: bossSummary.boss_wins,
      bossSubjectsDefeated: bossSummary.boss_subjects_defeated,
      perfectBossWins: bossSummary.perfect_boss_wins,
      clearedBossTerms: bossSummary.cleared_boss_terms,
    }
    return demoAchievements(game, context)
  }, [bossSummary, game, player?.level, player?.streakDays, player?.totalMissions])
}
