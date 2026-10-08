'use server'

import { z } from 'zod'
import { ownerOrNull } from '@/features/auth/session'
import { entryTags } from '@/features/entries/tags'
import { syncEntryMedia } from '@/features/media/server'
import { t } from '@/i18n/sr'
import { CACHE_TAGS } from '@/lib/cache-tags'
import { userMessage } from '@/lib/errors'
import { invalidate } from '@/lib/invalidate'
import { fail, ok, type ActionResult } from '@/lib/result'

const schema = z.object({
  target: z.enum(['entry', 'book', 'game', 'anime']),
  id: z.uuid(),
  isPublic: z.boolean(),
})

export type VisibilityTarget = z.infer<typeof schema>['target']

const LIBRARY = {
  book: { table: 'books', tag: CACHE_TAGS.books },
  game: { table: 'games', tag: CACHE_TAGS.games },
  anime: { table: 'anime', tag: CACHE_TAGS.anime },
} as const

/**
 * Jedan prekidač javno/privatno za sve (upise i stavke biblioteke).
 * Za upis se i slike premeštaju u odgovarajući bucket. XP ostaje isti.
 */
export async function setVisibility(target: VisibilityTarget, id: string, isPublic: boolean): Promise<ActionResult> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  const parsed = schema.safeParse({ target, id, isPublic })
  if (!parsed.success) return fail(t.errors.validation)
  const { supabase, userId } = owner

  try {
    if (parsed.data.target === 'entry') {
      const { data: entry, error } = await supabase
        .from('entries')
        .update({ is_public: parsed.data.isPublic })
        .eq('id', parsed.data.id)
        .select('id, slug, book_id, game_id, anime_id, media(id, position)')
        .maybeSingle()
      if (error) throw error
      if (!entry) return fail(t.errors.notFound)

      const mediaIds = [...entry.media].sort((a, b) => a.position - b.position).map((m) => m.id)
      await syncEntryMedia({ supabase, ownerId: userId, entryId: entry.id, mediaIds, isPublic: parsed.data.isPublic })
      invalidate(
        ...entryTags([entry.slug], {
          book: Boolean(entry.book_id),
          game: Boolean(entry.game_id),
          anime: Boolean(entry.anime_id),
        }),
      )
      return ok(null)
    }

    const { table, tag } = LIBRARY[parsed.data.target]
    const { error } = await supabase.from(table).update({ is_public: parsed.data.isPublic }).eq('id', parsed.data.id)
    if (error) throw error
    invalidate(tag)
    return ok(null)
  } catch (error) {
    return fail(userMessage(error, 'setVisibility'))
  }
}
