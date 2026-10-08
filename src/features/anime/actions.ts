'use server'

import { XP_RULES } from '@/config/xp'
import { ownerOrNull } from '@/features/auth/session'
import { createMilestone } from '@/features/library/milestones'
import { t } from '@/i18n/sr'
import { CACHE_TAGS } from '@/lib/cache-tags'
import { isoDateInZone } from '@/lib/dates'
import { serverEnv } from '@/lib/env-server'
import { userMessage } from '@/lib/errors'
import { invalidate } from '@/lib/invalidate'
import { fail, ok, type ActionResult } from '@/lib/result'
import { slugify, uniqueSlug } from '@/lib/slug'
import { fetchMalAnimeList } from './mal'

type SyncSummary = { added: number; updated: number; completed: number }

/**
 * Uvozi/osvežava listu sa MyAnimeList-a.
 *  - Prvi uvoz: jedno zbirno dostignuće za sve već odgledane naslove.
 *  - Svaki sledeći: dostignuće za svaki naslov koji je u međuvremenu završen.
 */
export async function syncAnimeFromMal(): Promise<ActionResult<SyncSummary>> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  const { malClientId } = serverEnv()
  if (!malClientId) return fail(t.errors.missingKey('MAL_CLIENT_ID'))

  const { supabase, userId } = owner
  try {
    const { data: profile } = await supabase.from('profiles').select('mal_username').eq('id', userId).single()
    if (!profile?.mal_username) return fail(t.anime.needUsername)

    const [list, existingRes] = await Promise.all([
      fetchMalAnimeList(profile.mal_username, malClientId),
      supabase.from('anime').select('id, mal_id, slug, status, score, episodes_watched'),
    ])
    if (existingRes.error) throw existingRes.error
    const existing = existingRes.data
    const firstImport = existing.length === 0
    const byMalId = new Map(existing.filter((a) => a.mal_id !== null).map((a) => [a.mal_id!, a]))
    const usedSlugs = new Set(existing.map((a) => a.slug))

    let added = 0
    let updated = 0
    const newlyCompleted: number[] = []

    const rows = list.map((item) => {
      const before = byMalId.get(item.malId)
      let slug = before?.slug
      if (!slug) {
        slug = uniqueSlug(slugify(item.title) || 'anime', usedSlugs, 'anime')
        usedSlugs.add(slug)
        added++
      } else if (
        before &&
        (before.status !== item.status || before.score !== item.score || before.episodes_watched !== item.episodesWatched)
      ) {
        updated++
      }
      if (!firstImport && item.status === 'completed' && before?.status !== 'completed') newlyCompleted.push(item.malId)
      return {
        owner_id: userId,
        mal_id: item.malId,
        slug,
        title: item.title,
        image_url: item.imageUrl,
        status: item.status,
        score: item.score,
        episodes_watched: item.episodesWatched,
        episodes_total: item.episodesTotal,
        mal_updated_at: item.updatedAt,
      }
    })

    const idByMal = new Map<number, { id: string; title: string; is_public: boolean }>()
    for (let i = 0; i < rows.length; i += 500) {
      const { data, error } = await supabase
        .from('anime')
        .upsert(rows.slice(i, i + 500), { onConflict: 'owner_id,mal_id' })
        .select('id, mal_id, title, is_public')
      if (error) throw error
      for (const row of data) if (row.mal_id !== null) idByMal.set(row.mal_id, row)
    }

    const today = isoDateInZone(new Date())
    if (firstImport) {
      const count = list.filter((item) => item.status === 'completed').length
      if (count > 0) {
        await createMilestone(owner, {
          role: 'anime',
          event: 'anime_import',
          title: t.anime.importMilestone(count),
          xp: Math.min(XP_RULES.milestones.animeImportMax, count * XP_RULES.milestones.animeImportPerItem),
          occurredOn: today,
          isPublic: true,
          count,
        })
      }
    } else {
      for (const malId of newlyCompleted) {
        const anime = idByMal.get(malId)
        if (!anime) continue
        await createMilestone(owner, {
          role: 'anime',
          event: 'anime_completed',
          title: t.anime.completedMilestone(anime.title),
          xp: XP_RULES.milestones.animeCompleted,
          occurredOn: today,
          isPublic: anime.is_public,
          subject: { anime_id: anime.id },
        })
      }
    }

    invalidate(CACHE_TAGS.anime, CACHE_TAGS.entries, CACHE_TAGS.xp)
    return ok({ added, updated, completed: firstImport ? 0 : newlyCompleted.length })
  } catch (error) {
    return fail(userMessage(error, 'syncAnimeFromMal'))
  }
}
