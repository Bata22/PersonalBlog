import { ownerOrNull } from '@/features/auth/session'
import { searchMalAnime } from '@/features/anime/mal'
import type { AnimeSearchResult } from '@/features/anime/model'
import { t } from '@/i18n/sr'
import { adminSearch } from '@/lib/api'
import { serverEnv } from '@/lib/env-server'
import { UserError } from '@/lib/errors'

/** Pretraga MAL baze za dodavanje na listu; označava ono što je već na listi. */
export async function GET(request: Request) {
  return adminSearch(
    request,
    async (query): Promise<AnimeSearchResult[]> => {
      const { malClientId } = serverEnv()
      if (!malClientId) throw new UserError(t.errors.missingKey('MAL_CLIENT_ID'))
      const results = await searchMalAnime(query, malClientId)
      if (results.length === 0) return []

      // vlasnik je već proveren u adminSearch; getViewer je keširan po zahtevu
      const owner = await ownerOrNull()
      const { data, error } = await owner!.supabase
        .from('anime')
        .select('id, mal_id, status')
        .in(
          'mal_id',
          results.map((r) => r.malId),
        )
      if (error) throw error
      const onList = new Map(data.map((row) => [row.mal_id, { id: row.id, status: row.status }]))
      return results.map((r) => ({ ...r, onList: onList.get(r.malId) ?? null }))
    },
    'searchMalAnime',
  )
}
