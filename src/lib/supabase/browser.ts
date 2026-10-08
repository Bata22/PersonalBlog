import { createBrowserClient } from '@supabase/ssr'
import { publicEnv } from '@/lib/env'
import type { Database } from './database.types'

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

/** Klijent u pregledaču — služi samo za direktan upload slika u Storage. */
export function getBrowserClient() {
  if (!client) {
    const { supabaseUrl, supabaseKey } = publicEnv()
    client = createBrowserClient<Database>(supabaseUrl, supabaseKey)
  }
  return client
}
