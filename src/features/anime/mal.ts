import 'server-only'
import { t } from '@/i18n/sr'
import { UserError } from '@/lib/errors'
import { MAL_STATUSES, type AnimeCandidate, type AnimeListValues, type MalStatus } from './model'

/**
 * Zvanični MyAnimeList API v2.
 *  - Čitanje javne liste i pretraga baze: dovoljan je Client ID.
 *  - Izmene liste: traži povezan nalog (vidi mal-auth.ts).
 */

export type { MalStatus } from './model'
export { MAL_STATUSES } from './model'

const API = 'https://api.myanimelist.net/v2'
const TIMEOUT_MS = 12000

export type MalAnime = {
  malId: number
  title: string
  imageUrl: string | null
  status: MalStatus
  score: number | null
  episodesWatched: number
  episodesTotal: number | null
  updatedAt: string | null
}

type MalNode = {
  id: number
  title: string
  main_picture?: { medium?: string; large?: string }
  num_episodes?: number
  media_type?: string
  start_season?: { year?: number }
  alternative_titles?: { en?: string }
}

type MalItem = {
  node: MalNode
  list_status: { status: MalStatus; score?: number; num_episodes_watched?: number; updated_at?: string }
}

const STATUSES = new Set<MalStatus>(MAL_STATUSES)

export class MalUnauthorizedError extends Error {}

/** Slika samo sa MAL CDN-a (CSP dozvoljava samo njega). */
function malImage(node: MalNode): string | null {
  const image = node.main_picture?.medium ?? node.main_picture?.large ?? null
  return image && /^https:\/\/cdn\.myanimelist\.net\/[\w\-./]+$/.test(image) ? image : null
}

function toCandidate(node: MalNode): AnimeCandidate {
  const titleEn = node.alternative_titles?.en?.trim() || null
  return {
    malId: node.id,
    title: node.title.slice(0, 300),
    titleEn: titleEn && titleEn !== node.title ? titleEn.slice(0, 300) : null,
    imageUrl: malImage(node),
    episodesTotal: node.num_episodes ? node.num_episodes : null,
    mediaType: node.media_type ?? null,
    year: node.start_season?.year ?? null,
  }
}

async function malGet(url: URL | string, clientId: string): Promise<Response> {
  try {
    return await fetch(url, {
      headers: { 'X-MAL-CLIENT-ID': clientId },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
  } catch {
    throw new UserError(t.errors.externalApi('MyAnimeList'))
  }
}

const CANDIDATE_FIELDS = 'num_episodes,media_type,start_season,alternative_titles'

/** Pretraga MAL baze po nazivu ("frieren", "shingeki"). MAL traži bar 3 slova. */
export async function searchMalAnime(query: string, clientId: string): Promise<AnimeCandidate[]> {
  if (query.trim().length < 3) return []
  const url = new URL(`${API}/anime`)
  url.searchParams.set('q', query.trim().slice(0, 64))
  url.searchParams.set('limit', '8')
  url.searchParams.set('fields', CANDIDATE_FIELDS)

  const response = await malGet(url, clientId)
  if (response.status === 401 || response.status === 403) throw new UserError(t.errors.missingKey('MAL_CLIENT_ID'))
  if (response.status === 400) return []
  if (!response.ok) throw new UserError(t.errors.externalApi('MyAnimeList'))
  const json = (await response.json()) as { data?: { node: MalNode }[] }
  return (json.data ?? []).map((item) => toCandidate(item.node))
}

/** Podaci o jednom anime-u (pri dodavanju se ne veruje onome što pošalje pregledač). */
export async function fetchMalAnimeDetails(malId: number, clientId: string): Promise<AnimeCandidate | null> {
  const url = new URL(`${API}/anime/${malId}`)
  url.searchParams.set('fields', CANDIDATE_FIELDS)
  const response = await malGet(url, clientId)
  if (response.status === 404) return null
  if (response.status === 401 || response.status === 403) throw new UserError(t.errors.missingKey('MAL_CLIENT_ID'))
  if (!response.ok) throw new UserError(t.errors.externalApi('MyAnimeList'))
  return toCandidate((await response.json()) as MalNode)
}

/** Izmena (ili dodavanje) jednog anime-a na tvojoj MAL listi. Traži povezan nalog. */
export async function updateMalListStatus(
  accessToken: string,
  malId: number,
  update: AnimeListValues,
): Promise<{ updatedAt: string | null }> {
  let response: Response
  try {
    response = await fetch(`${API}/anime/${malId}/my_list_status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        status: update.status,
        score: String(update.score),
        num_watched_episodes: String(update.episodesWatched),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
  } catch {
    throw new UserError(t.errors.externalApi('MyAnimeList'))
  }
  if (response.status === 401) throw new MalUnauthorizedError()
  if (!response.ok) throw new UserError(t.errors.externalApi('MyAnimeList'))
  const json = (await response.json()) as { updated_at?: string }
  return { updatedAt: json.updated_at ?? null }
}

/** Korisničko ime povezanog MAL naloga. */
export async function fetchMalUsername(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${API}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!response.ok) return null
    const json = (await response.json()) as { name?: string }
    return json.name && /^[\w-]{2,16}$/.test(json.name) ? json.name : null
  } catch {
    return null
  }
}

const MAX_PAGES = 20

/** Cela javna lista korisnika (za "Osveži sa MyAnimeList-a"). */
export async function fetchMalAnimeList(username: string, clientId: string): Promise<MalAnime[]> {
  const first = new URL(`${API}/users/${encodeURIComponent(username)}/animelist`)
  first.searchParams.set('fields', 'list_status,num_episodes')
  first.searchParams.set('limit', '1000')
  first.searchParams.set('nsfw', 'true')

  const out: MalAnime[] = []
  let next: string | null = first.toString()

  for (let page = 0; next && page < MAX_PAGES; page++) {
    const response = await malGet(next, clientId)
    if (response.status === 401) throw new UserError(t.errors.missingKey('MAL_CLIENT_ID'))
    if (response.status === 403 || response.status === 404) throw new UserError(t.anime.malPrivate)
    if (!response.ok) throw new UserError(t.errors.externalApi('MyAnimeList'))

    const json = (await response.json()) as { data?: MalItem[]; paging?: { next?: string } }
    for (const item of json.data ?? []) {
      if (!STATUSES.has(item.list_status?.status)) continue
      out.push({
        malId: item.node.id,
        title: item.node.title.slice(0, 300),
        imageUrl: malImage(item.node),
        status: item.list_status.status,
        score: item.list_status.score ? Math.min(10, Math.max(0, item.list_status.score)) : null,
        episodesWatched: Math.max(0, item.list_status.num_episodes_watched ?? 0),
        episodesTotal: item.node.num_episodes ? item.node.num_episodes : null,
        updatedAt: item.list_status.updated_at ?? null,
      })
    }

    // sledeća strana samo sa istog servera
    const candidate = json.paging?.next
    next = candidate && new URL(candidate).hostname === 'api.myanimelist.net' ? candidate : null
  }

  return out
}
