'use server'

import { z } from 'zod'
import { XP_RULES } from '@/config/xp'
import { ownerOrNull } from '@/features/auth/session'
import { createMilestone } from '@/features/library/milestones'
import { removeEntryMedia } from '@/features/media/server'
import { t } from '@/i18n/sr'
import { CACHE_TAGS } from '@/lib/cache-tags'
import { isIsoDate, isoDateInZone } from '@/lib/dates'
import { userMessage } from '@/lib/errors'
import { invalidate } from '@/lib/invalidate'
import { fail, ok, zodFieldErrors, type ActionResult } from '@/lib/result'
import { slugify, uniqueSlug } from '@/lib/slug'
import { gameCandidateSchema, type GameCandidate } from './catalog'

const statusSchema = z.enum(['zelim', 'igram', 'presao', 'odustao'])
type GameStatus = z.infer<typeof statusSchema>

const addSchema = z.union([
  z.object({ source: z.literal('rawg'), candidate: gameCandidateSchema, status: statusSchema }),
  z.object({ source: z.literal('rucno'), name: z.string().trim().min(1, 'Upiši naziv.').max(300), status: statusSchema }),
])

export type AddGameInput =
  | { source: 'rawg'; candidate: GameCandidate; status: GameStatus }
  | { source: 'rucno'; name: string; status: GameStatus }

export async function addGame(input: AddGameInput): Promise<ActionResult<{ id: string }>> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  const parsed = addSchema.safeParse(input)
  if (!parsed.success) return fail(t.errors.validation, zodFieldErrors(parsed.error))
  const data = parsed.data
  const { supabase, userId } = owner

  const fields =
    data.source === 'rawg'
      ? {
          name: data.candidate.name,
          cover_url: data.candidate.coverUrl,
          released: data.candidate.released,
          platforms: data.candidate.platforms,
          source: 'rawg' as const,
          external_id: data.candidate.externalId,
        }
      : { name: data.name, source: 'rucno' as const }

  if (data.source === 'rawg') {
    const { data: existing } = await supabase
      .from('games')
      .select('id')
      .eq('source', 'rawg')
      .eq('external_id', data.candidate.externalId)
      .maybeSingle()
    if (existing) return fail(t.games.alreadyAdded)
  }

  const base = slugify(fields.name) || 'igra'
  const { data: taken } = await supabase.from('games').select('slug').like('slug', `${base}%`)
  const slug = uniqueSlug(base, (taken ?? []).map((r) => r.slug), 'igra')

  const { data: created, error } = await supabase
    .from('games')
    .insert({
      ...fields,
      owner_id: userId,
      slug,
      status: data.status,
      started_on: data.status === 'igram' ? isoDateInZone(new Date()) : null,
    })
    .select('id')
    .single()
  if (error) return fail(t.errors.generic)

  invalidate(CACHE_TAGS.games)
  return ok({ id: created.id })
}

const optionalDate = z
  .string()
  .refine((v) => v === '' || isIsoDate(v), 'Neispravan datum.')
  .transform((v) => v || null)

const updateSchema = z.object({
  id: z.uuid(),
  status: statusSchema,
  rating: z.number().int().min(1).max(10).nullable(),
  hoursPlayed: z.number().min(0).max(100000).nullable(),
  startedOn: optionalDate,
  finishedOn: optionalDate,
})

export type UpdateGameInput = z.input<typeof updateSchema>

export async function updateGame(input: UpdateGameInput): Promise<ActionResult<{ milestoneXp: number }>> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) return fail(t.errors.validation, zodFieldErrors(parsed.error))
  const data = parsed.data

  try {
    const { data: before } = await owner.supabase.from('games').select('id, name, status, is_public').eq('id', data.id).maybeSingle()
    if (!before) return fail(t.errors.notFound)

    const finishedOn = data.status === 'presao' ? (data.finishedOn ?? isoDateInZone(new Date())) : data.finishedOn
    const { error } = await owner.supabase
      .from('games')
      .update({
        status: data.status,
        rating: data.rating,
        hours_played: data.hoursPlayed,
        started_on: data.startedOn,
        finished_on: finishedOn,
      })
      .eq('id', data.id)
    if (error) throw error

    let milestoneXp = 0
    if (data.status === 'presao' && before.status !== 'presao') {
      const milestone = await createMilestone(owner, {
        role: 'games',
        event: 'game_finished',
        title: t.games.finishedMilestone(before.name),
        xp: XP_RULES.milestones.gameFinished,
        occurredOn: finishedOn ?? isoDateInZone(new Date()),
        isPublic: before.is_public,
        subject: { game_id: before.id },
      })
      if (milestone) milestoneXp = XP_RULES.milestones.gameFinished
    }

    invalidate(CACHE_TAGS.games, CACHE_TAGS.entries, CACHE_TAGS.xp)
    return ok({ milestoneXp })
  } catch (error) {
    return fail(userMessage(error, 'updateGame'))
  }
}

export async function deleteGame(id: string): Promise<ActionResult> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  if (!z.uuid().safeParse(id).success) return fail(t.errors.notFound)

  try {
    const { data: notes } = await owner.supabase.from('entries').select('id').eq('game_id', id)
    for (const note of notes ?? []) await removeEntryMedia(owner.supabase, note.id)
    const { error } = await owner.supabase.from('games').delete().eq('id', id)
    if (error) throw error
    invalidate(CACHE_TAGS.games, CACHE_TAGS.entries, CACHE_TAGS.xp)
    return ok(null)
  } catch (error) {
    return fail(userMessage(error, 'deleteGame'))
  }
}
