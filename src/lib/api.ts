import 'server-only'
import { ownerOrNull } from '@/features/auth/session'
import { t } from '@/i18n/sr'
import { userMessage } from './errors'

/**
 * Zajednička logika za admin pretragu (knjige, igre): provera vlasnika,
 * provera upita, jedinstven oblik odgovora i grešaka.
 */
export async function adminSearch<T>(request: Request, search: (query: string) => Promise<T[]>, context: string) {
  const owner = await ownerOrNull()
  if (!owner) return Response.json({ error: t.errors.notSignedIn }, { status: 401 })

  const query = new URL(request.url).searchParams.get('q')?.trim() ?? ''
  if (query.length < 2 || query.length > 100) return Response.json({ results: [] })

  try {
    const results = await search(query)
    return Response.json({ results }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    return Response.json({ error: userMessage(error, context) }, { status: 502 })
  }
}
