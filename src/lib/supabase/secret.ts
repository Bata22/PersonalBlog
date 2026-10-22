import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { publicEnv } from '@/lib/env'
import { serverEnv } from '@/lib/env-server'
import type { Database } from './database.types'

/**
 * Klijent sa tajnim ključem — zaobilazi RLS. Koriste ga samo cron ruta za
 * podsetnik (nema prijavljenog korisnika) i MAL tokeni (tabela bez ikakvog
 * pristupa preko API-ja), uvek posle provere. Nikad ga ne izlaži klijentu.
 */
export function createSecretClient() {
  const { supabaseUrl } = publicEnv()
  const { supabaseSecretKey } = serverEnv()
  if (!supabaseSecretKey) {
    throw new Error('SUPABASE_SECRET_KEY nije podešen (potreban za podsetnik i MAL nalog).')
  }
  return createClient<Database>(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
