import { NextResponse, type NextRequest } from 'next/server'
import { ownerOrNull } from '@/features/auth/session'
import { fetchMalUsername } from '@/features/anime/mal'
import { completeAuthorization, MAL_OAUTH_COOKIE, MAL_OAUTH_COOKIE_PATH, type PendingAuth } from '@/features/anime/mal-auth'
import { t } from '@/i18n/sr'
import type { MalNoticeCode } from '@/features/anime/mal-notice'
import { UserError } from '@/lib/errors'

function readPending(raw: string | undefined): PendingAuth | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<PendingAuth>
    return value.verifier && value.state && value.redirectUri ? (value as PendingAuth) : null
  } catch {
    return null
  }
}

/** MAL vraća ovde posle odobrenja: provera, zamena koda za tokene, nazad na Anime. */
export async function GET(request: NextRequest) {
  const owner = await ownerOrNull()
  if (!owner) return NextResponse.redirect(new URL('/prijava', request.url))

  const params = request.nextUrl.searchParams
  const pending = readPending(request.cookies.get(MAL_OAUTH_COOKIE)?.value)
  const back = new URL('/admin/anime', request.url)

  const finish = (code: MalNoticeCode) => {
    back.searchParams.set('mal', code)
    const response = NextResponse.redirect(back)
    response.cookies.set(MAL_OAUTH_COOKIE, '', { path: MAL_OAUTH_COOKIE_PATH, maxAge: 0 })
    return response
  }

  const code = params.get('code')
  if (params.get('error') || !code) return finish('odbijeno')
  if (!pending || params.get('state') !== pending.state) return finish('ponovo')

  try {
    const accessToken = await completeAuthorization(owner.userId, code, pending)

    // ako korisničko ime još nije upisano u Podešavanjima, uzmi ga sa naloga
    const { data: profile } = await owner.supabase.from('profiles').select('mal_username').eq('id', owner.userId).single()
    if (!profile?.mal_username) {
      const name = await fetchMalUsername(accessToken)
      if (name) await owner.supabase.from('profiles').update({ mal_username: name }).eq('id', owner.userId)
    }
    return finish('povezan')
  } catch (error) {
    if (!(error instanceof UserError)) console.error('[mal povratak]', error)
    return finish(error instanceof UserError && error.message === t.anime.malReconnect ? 'ponovo' : 'greska')
  }
}
