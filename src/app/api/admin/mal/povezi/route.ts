import { NextResponse, type NextRequest } from 'next/server'
import { ownerOrNull } from '@/features/auth/session'
import { MAL_OAUTH_COOKIE, MAL_OAUTH_COOKIE_PATH, startAuthorization } from '@/features/anime/mal-auth'
import type { MalNoticeCode } from '@/features/anime/mal-notice'
import { serverEnv } from '@/lib/env-server'

/**
 * Prvi korak povezivanja MAL naloga: pamti proveru (state + PKCE) u kolačiću
 * i šalje na MyAnimeList da odobriš pristup.
 */
export async function GET(request: NextRequest) {
  const owner = await ownerOrNull()
  if (!owner) return NextResponse.redirect(new URL('/prijava', request.url))

  // Povratna adresa mora tačno da se poklapa sa "App Redirect URL" na MAL-u.
  const redirectUri = new URL('/api/admin/mal/povratak', request.nextUrl.origin).toString()
  try {
    const { url, pending } = startAuthorization(redirectUri)
    const response = NextResponse.redirect(url)
    response.cookies.set(MAL_OAUTH_COOKIE, JSON.stringify(pending), {
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      path: MAL_OAUTH_COOKIE_PATH,
      maxAge: 600,
    })
    return response
  } catch {
    const code: MalNoticeCode = serverEnv().malClientSecret && serverEnv().malClientId ? 'greska' : 'kljuc'
    const back = new URL('/admin/anime', request.url)
    back.searchParams.set('mal', code)
    return NextResponse.redirect(back)
  }
}
