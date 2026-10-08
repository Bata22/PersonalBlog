import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { publicEnv } from '@/lib/env'
import { serverEnv } from '@/lib/env-server'
import type { Database } from './database.types'

/**
 * Klijent sa tajnim ključem — zaobilazi RLS. Koristi ga SAMO cron ruta za
 * podsetnik, gde nema prijavljenog korisnika. Nikad ga ne izlaži klijentu.
 */
export function createSecretClient() {
  const { supabaseUrl } = publicEnv()
  const { supabaseSecretKey } = serverEnv()
  if (!supabaseSecretKey) {
    throw new Error('SUPABASE_SECRET_KEY nije podešen (potreban za podsetnik).')
  }
  return createClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
