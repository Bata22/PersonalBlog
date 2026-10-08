import 'server-only'
import { z } from 'zod'
import { serverEnv } from '@/lib/env-server'
import { t } from '@/i18n/sr'
import { UserError } from '@/lib/errors'

/**
 * Katalog igara. Trenutno RAWG (besplatan ključ, pretraga po delu naziva:
 * "assas" → Assassin's Creed). Ako jednog dana pređeš na IGDB, menja se
 * samo ovaj fajl — ostatak aplikacije zna samo za GameCandidate.
 */

export const gameCandidateSchema = z.object({
  externalId: z.string().regex(/^\d{1,12}$/),
  name: z.string().min(1).max(300),
  released: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  coverUrl: z.string().regex(/^https:\/\/media\.rawg\.io\/[\w\-./]+$/).nullable(),
  platforms: z.array(z.string().max(60)).max(12),
})

export type GameCandidate = z.infer<typeof gameCandidateSchema>

type RawgGame = {
  id: number
  name: string
  released: string | null
  background_image: string | null
  platforms?: { platform: { name: string } }[] | null
}

/** Manja slika sa RAWG CDN-a (širina 640 px) umesto pune pozadine. */
function smallCover(url: string | null): string | null {
  if (!url) return null
  return url.replace('media.rawg.io/media/', 'media.rawg.io/media/resize/640/-/')
}

export async function searchGames(query: string): Promise<GameCandidate[]> {
  const { rawgApiKey } = serverEnv()
  if (!rawgApiKey) throw new UserError(t.errors.missingKey('RAWG_API_KEY'))

  const url = new URL('https://api.rawg.io/api/games')
  url.searchParams.set('key', rawgApiKey)
  url.searchParams.set('search', query)
  url.searchParams.set('page_size', '8')

  let response: Response
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(8000), cache: 'no-store' })
  } catch {
    throw new UserError(t.errors.externalApi('RAWG'))
  }
  if (response.status === 401 || response.status === 403) throw new UserError(t.errors.missingKey('RAWG_API_KEY'))
  if (!response.ok) throw new UserError(t.errors.externalApi('RAWG'))

  const json = (await response.json()) as { results?: RawgGame[] }
  const candidates = (json.results ?? []).map((game) => ({
    externalId: String(game.id),
    name: game.name,
    released: game.released ?? null,
    coverUrl: smallCover(game.background_image),
    platforms: (game.platforms ?? []).map((p) => p.platform.name).slice(0, 12),
  }))
  return candidates.filter((c) => gameCandidateSchema.safeParse(c).success)
}
