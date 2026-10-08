import { createClient } from '@supabase/supabase-js'
import { publicEnv } from '@/lib/env'
import type { Database } from './database.types'

/**
 * Klijent bez sesije, za javne stranice. Vidi samo ono što RLS dozvoljava
 * posetiocu (is_public = true), pa je bezbedno keširati njegove rezultate.
 */
export function createPublicClient() {
  const { supabaseUrl, supabaseKey } = publicEnv()
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
