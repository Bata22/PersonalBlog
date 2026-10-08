'use server'

import { z } from 'zod'
import { ownerOrNull } from '@/features/auth/session'
import { removeEntryMedia } from '@/features/media/server'
import { t } from '@/i18n/sr'
import { userMessage } from '@/lib/errors'
import { invalidate } from '@/lib/invalidate'
import { fail, ok, zodFieldErrors, type ActionResult } from '@/lib/result'
import { persistEntry } from './persist'
import { entryInputSchema, type EntryInput } from './schema'
import { entryTags } from './tags'

export async function saveEntry(input: EntryInput): Promise<ActionResult<{ id: string; slug: string; xp: number }>> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)

  const parsed = entryInputSchema.safeParse(input)
  if (!parsed.success) return fail(t.errors.validation, zodFieldErrors(parsed.error))
  if (parsed.data.kind === 'journal') return fail(t.errors.validation)

  try {
    const result = await persistEntry(owner, parsed.data)
    invalidate(
      ...(entryTags([result.slug], {
        book: Boolean(parsed.data.bookId),
        game: Boolean(parsed.data.gameId),
        anime: Boolean(parsed.data.animeId),
      })),
    )
    return ok({ id: result.id, slug: result.slug, xp: result.xp })
  } catch (error) {
    return fail(userMessage(error, 'saveEntry'))
  }
}

export async function deleteEntry(id: string): Promise<ActionResult> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  if (!z.uuid().safeParse(id).success) return fail(t.errors.notFound)

  try {
    const { data: entry } = await owner.supabase
      .from('entries')
      .select('id, slug, book_id, game_id, anime_id')
      .eq('id', id)
      .maybeSingle()
    if (!entry) return fail(t.errors.notFound)

    await removeEntryMedia(owner.supabase, entry.id)
    const { error } = await owner.supabase.from('entries').delete().eq('id', entry.id)
    if (error) throw error

    invalidate(
      ...(entryTags([entry.slug], {
        book: Boolean(entry.book_id),
        game: Boolean(entry.game_id),
        anime: Boolean(entry.anime_id),
      })),
    )
    return ok(null)
  } catch (error) {
    return fail(userMessage(error, 'deleteEntry'))
  }
}
