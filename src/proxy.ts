import { NextResponse, type NextRequest } from 'next/server'
import { redirectKeepingCookies, refreshSession } from '@/lib/supabase/proxy-session'

/**
 * Radi samo za admin deo, admin API i stranicu za prijavu, tako da javne
 * stranice ostaju statične i brze. Ovo je brza provera za preusmerenje;
 * prava zaštita su provere u server akcijama i RLS u bazi.
 */
export async function proxy(request: NextRequest) {
  const { response, userId } = await refreshSession(request)
  const { pathname } = request.nextUrl

  const isAdminArea = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')

  if (!userId && isAdminArea) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Nisi prijavljen.' }, { status: 401 })
    }
    const login = new URL('/prijava', request.url)
    login.searchParams.set('dalje', pathname)
    return redirectKeepingCookies(login, response)
  }

  if (userId && pathname === '/prijava') {
    return redirectKeepingCookies(new URL('/admin', request.url), response)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/prijava'],
}
