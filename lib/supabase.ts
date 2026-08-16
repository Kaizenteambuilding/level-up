import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

export function createSupabaseBrowserClient(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) return null

  return createBrowserClient<Database>(url, key)
}
