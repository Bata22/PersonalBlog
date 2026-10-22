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
import { z } from 'zod'
import type { Viewer } from '@/features/auth/session'
import { fetchMalAnimeDetails, fetchMalAnimeList, updateMalListStatus } from './mal'
import { forgetMalTokens, withMalToken } from './mal-auth'
import { MAL_STATUSES, normalizeListValues, type AnimeListValues } from './model'

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

const listValuesSchema = z.object({
  status: z.enum(MAL_STATUSES),
  score: z.number().int().min(0).max(10),
  episodesWatched: z.number().int().min(0).max(100000),
})

const updateSchema = listValuesSchema.extend({ animeId: z.uuid() })
const addSchema = listValuesSchema.extend({
  malId: z.number().int().positive().max(10_000_000),
  /** Za "Odgledano": završen danas (dostignuće +25 XP) ili ranije (samo upis na listu). */
  finishedToday: z.boolean().default(false),
})

export type AnimeUpdateInput = z.infer<typeof updateSchema>
export type AnimeAddInput = z.input<typeof addSchema>

type AnimeRef = { id: string; title: string; is_public: boolean }

/**
 * XP za izmenu liste: +5 za svaku sačuvanu izmenu (privatan upis), a kad
 * anime postane "Odgledano" i dostignuće "Odgledao" (+25, vidljivo kao anime).
 */
async function rewardListChange(
  owner: Viewer,
  anime: AnimeRef,
  title: string,
  completedNow: boolean,
): Promise<number> {
  const today = isoDateInZone(new Date())
  await createMilestone(owner, {
    role: 'anime',
    event: 'anime_update',
    title,
    xp: XP_RULES.milestones.animeUpdate,
    occurredOn: today,
    isPublic: false,
    subject: { anime_id: anime.id },
  })
  let xp: number = XP_RULES.milestones.animeUpdate
  if (completedNow) {
    const created = await createMilestone(owner, {
      role: 'anime',
      event: 'anime_completed',
      title: t.anime.completedMilestone(anime.title),
      xp: XP_RULES.milestones.animeCompleted,
      occurredOn: today,
      isPublic: anime.is_public,
      subject: { anime_id: anime.id },
    })
    if (created) xp += XP_RULES.milestones.animeCompleted
  }
  return xp
}

const episodesLabel = (values: AnimeListValues, total: number | null) => `${values.episodesWatched}/${total ?? '?'}`

/**
 * Izmena anime-a koji je već na listi: šalje se na MAL, upisuje kod nas i
 * donosi XP. MAL je izvor istine, pa se bez povezanog naloga ništa ne menja.
 */
export async function updateAnimeOnMal(input: AnimeUpdateInput): Promise<ActionResult<{ xp: number }>> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) return fail(t.errors.validation)

  const { supabase, userId } = owner
  try {
    const { data: anime, error } = await supabase
      .from('anime')
      .select('id, mal_id, title, status, score, episodes_watched, episodes_total, is_public')
      .eq('id', parsed.data.animeId)
      .maybeSingle()
    if (error) throw error
    if (!anime) return fail(t.errors.notFound)
    if (anime.mal_id === null) return fail(t.anime.malNotFromMal)
    const malId = anime.mal_id

    const values = normalizeListValues(parsed.data, anime.episodes_total)
    const unchanged =
      anime.status === values.status && (anime.score ?? 0) === values.score && anime.episodes_watched === values.episodesWatched
    if (unchanged) return fail(t.anime.noChanges)

    const result = await withMalToken(userId, (token) => updateMalListStatus(token, malId, values))

    const { error: saveError } = await supabase
      .from('anime')
      .update({
        status: values.status,
        score: values.score || null,
        episodes_watched: values.episodesWatched,
        mal_updated_at: result.updatedAt ?? new Date().toISOString(),
      })
      .eq('id', anime.id)
    if (saveError) throw saveError

    const xp = await rewardListChange(
      owner,
      anime,
      t.anime.updateMilestone(anime.title, episodesLabel(values, anime.episodes_total), t.anime.statuses[values.status]),
      values.status === 'completed' && anime.status !== 'completed',
    )
    invalidate(CACHE_TAGS.anime, CACHE_TAGS.entries, CACHE_TAGS.xp)
    return ok({ xp })
  } catch (error) {
    return fail(userMessage(error, 'updateAnimeOnMal'))
  }
}

/**
 * Novi anime na listi (gledam, odgledao, planiram...): podaci se uzimaju sa
 * MAL-a po id-ju, upisuje se na MAL i kod nas, i donosi XP kao izmena.
 */
export async function addAnimeToList(input: AnimeAddInput): Promise<ActionResult<{ id: string; xp: number }>> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  const parsed = addSchema.safeParse(input)
  if (!parsed.success) return fail(t.errors.validation)
  const { malClientId } = serverEnv()
  if (!malClientId) return fail(t.errors.missingKey('MAL_CLIENT_ID'))

  const { supabase, userId } = owner
  const { malId, finishedToday } = parsed.data
  try {
    const { data: existing, error: existingError } = await supabase.from('anime').select('id').eq('mal_id', malId).maybeSingle()
    if (existingError) throw existingError
    if (existing) return fail(t.anime.alreadyOnList)

    const details = await fetchMalAnimeDetails(malId, malClientId)
    if (!details) return fail(t.errors.notFound)

    const values = normalizeListValues(parsed.data, details.episodesTotal)
    const result = await withMalToken(userId, (token) => updateMalListStatus(token, malId, values))

    const base = slugify(details.title) || 'anime'
    const { data: taken } = await supabase.from('anime').select('slug').like('slug', `${base}%`)
    const { data: created, error } = await supabase
      .from('anime')
      .insert({
        owner_id: userId,
        mal_id: malId,
        slug: uniqueSlug(base, (taken ?? []).map((row) => row.slug), 'anime'),
        title: details.title,
        image_url: details.imageUrl,
        status: values.status,
        score: values.score || null,
        episodes_watched: values.episodesWatched,
        episodes_total: details.episodesTotal,
        mal_updated_at: result.updatedAt ?? new Date().toISOString(),
      })
      .select('id, title, is_public')
      .single()
    if (error) throw error

    const xp = await rewardListChange(
      owner,
      created,
      t.anime.addedMilestone(details.title, t.anime.statuses[values.status]),
      values.status === 'completed' && finishedToday,
    )
    invalidate(CACHE_TAGS.anime, CACHE_TAGS.entries, CACHE_TAGS.xp)
    return ok({ id: created.id, xp })
  } catch (error) {
    return fail(userMessage(error, 'addAnimeToList'))
  }
}

export async function disconnectMal(): Promise<ActionResult> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  try {
    await forgetMalTokens(owner.userId)
    return ok(null)
  } catch (error) {
    return fail(userMessage(error, 'disconnectMal'))
  }
}
