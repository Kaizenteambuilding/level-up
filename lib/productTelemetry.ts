import { createSupabaseBrowserClient } from './supabase'

export type ProductEvent = 'onboarding_opened' | 'onboarding_avatar_saved' | 'onboarding_mission_opened' | 'onboarding_completed' | 'world_opened' | 'mission_started' | 'mission_completed' | 'client_error' | 'beta_feedback'

export async function reportProductEvent(playerId: string | null, eventName: ProductEvent, route: string) {
  if (!playerId || !/^\/[a-z0-9/?=&_-]{0,120}$/.test(route)) return
  const supabase = createSupabaseBrowserClient()
  if (!supabase) return
  await supabase.rpc('report_levelup_product_event', { p_player_id: playerId, p_event_name: eventName, p_route: route })
}
