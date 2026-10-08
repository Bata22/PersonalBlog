import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isSupabaseConfigured, publicEnv } from '@/lib/env'
import type { Database } from './database.types'

/**
 * Osvežava Supabase sesiju pre nego što se stranica izrenderuje
 * (obrazac koji @supabase/ssr zahteva) i vraća id prijavljenog korisnika.
 */
export async function refreshSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  if (!isSupabaseConfigured()) return { response, userId: null }

  const { supabaseUrl, supabaseKey } = publicEnv()
  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value)
      },
    },
  })

  // getClaims proverava potpis JWT-a; ne veruj sesiji iz kolačića bez toga.
  const { data } = await supabase.auth.getClaims()
  return { response, userId: data?.claims?.sub ?? null }
}

/** Preusmerenje koje zadržava osvežene kolačiće sesije. */
export function redirectKeepingCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url)
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie)
  return redirect
}
