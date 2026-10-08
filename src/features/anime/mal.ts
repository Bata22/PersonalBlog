import 'server-only'
import { t } from '@/i18n/sr'
import { UserError } from '@/lib/errors'

/**
 * Zvanični MyAnimeList API v2 — za javnu listu dovoljan je Client ID
 * (https://myanimelist.net/apiconfig). Lista na MAL-u mora biti javna.
 */

export type MalStatus = 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch'

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

type MalItem = {
  node: { id: number; title: string; main_picture?: { medium?: string; large?: string }; num_episodes?: number }
  list_status: { status: MalStatus; score?: number; num_episodes_watched?: number; updated_at?: string }
}

const STATUSES = new Set<MalStatus>(['watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'])
const MAX_PAGES = 20

export async function fetchMalAnimeList(username: string, clientId: string): Promise<MalAnime[]> {
  const first = new URL(`https://api.myanimelist.net/v2/users/${encodeURIComponent(username)}/animelist`)
  first.searchParams.set('fields', 'list_status,num_episodes')
  first.searchParams.set('limit', '1000')
  first.searchParams.set('nsfw', 'true')

  const out: MalAnime[] = []
  let next: string | null = first.toString()

  for (let page = 0; next && page < MAX_PAGES; page++) {
    let response: Response
    try {
      response = await fetch(next, {
        headers: { 'X-MAL-CLIENT-ID': clientId },
        signal: AbortSignal.timeout(12000),
        cache: 'no-store',
      })
    } catch {
      throw new UserError(t.errors.externalApi('MyAnimeList'))
    }
    if (response.status === 401) throw new UserError(t.errors.missingKey('MAL_CLIENT_ID'))
    if (response.status === 403 || response.status === 404) throw new UserError(t.anime.malPrivate)
    if (!response.ok) throw new UserError(t.errors.externalApi('MyAnimeList'))

    const json = (await response.json()) as { data?: MalItem[]; paging?: { next?: string } }
    for (const item of json.data ?? []) {
      if (!STATUSES.has(item.list_status?.status)) continue
      const image = item.node.main_picture?.medium ?? item.node.main_picture?.large ?? null
      out.push({
        malId: item.node.id,
        title: item.node.title.slice(0, 300),
        imageUrl: image?.startsWith('https://') ? image : null,
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
