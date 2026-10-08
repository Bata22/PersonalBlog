import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { publicEnv } from '@/lib/env'
import type { Database } from './database.types'

/**
 * Klijent sa sesijom prijavljenog korisnika (čita kolačiće).
 * Koristi se u admin delu i u server akcijama; upiti idu kroz RLS kao vlasnik.
 */
export async function createSessionClient() {
  const cookieStore = await cookies()
  const { supabaseUrl, supabaseKey } = publicEnv()

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Pozvano iz Server Component-a, gde se kolačići ne mogu menjati.
          // Sesiju osvežava src/proxy.ts pre svakog zahteva ka admin delu.
        }
      },
    },
  })
}

export type SessionClient = Awaited<ReturnType<typeof createSessionClient>>
