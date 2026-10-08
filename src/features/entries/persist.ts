import 'server-only'
import type { Viewer } from '@/features/auth/session'
import { collectMediaIds, docToPlainText, makeExcerpt, sanitizeDoc } from '@/features/editor/doc'
import { syncEntryMedia } from '@/features/media/server'
import { MAX_MEDIA_PER_ENTRY } from '@/features/media/types'
import { calculateXp, countWords, type XpInput } from '@/features/xp/calculate'
import { t } from '@/i18n/sr'
import { UserError } from '@/lib/errors'
import { slugify, uniqueSlug } from '@/lib/slug'
import type { Json } from '@/lib/supabase/database.types'
import { youtubeId, youtubeWatchUrl } from '@/lib/youtube'
import { describeMetadata } from './describe'
import type { ParsedEntryInput } from './schema'

export type PersistResult = { id: string; slug: string; previousSlug: string | null; xp: number }

/**
 * Jedno mesto koje upisuje upis u bazu — koriste ga obične objave, dnevnik
 * i beleške iz biblioteke. XP se uvek računa ovde, na serveru.
 */
export async function persistEntry(
  owner: Viewer,
  input: ParsedEntryInput,
  options: { streakDays?: number; slugBase?: string } = {},
): Promise<PersistResult> {
  const { supabase, userId } = owner

  const { data: branch } = await supabase.from('branches').select('id').eq('id', input.branchId).maybeSingle()
  if (!branch) throw new UserError(t.errors.notFound)

  const doc = input.content ? sanitizeDoc(input.content) : null
  const plain = docToPlainText(doc)
  const mediaIds = [...new Set([...input.mediaIds, ...collectMediaIds(doc)])].slice(0, MAX_MEDIA_PER_ENTRY)
  const videoUrls = [...new Set(input.videoUrls.map((url) => youtubeWatchUrl(youtubeId(url)!)))]

  const words =
    input.kind === 'journal'
      ? countWords(`${input.metadata.did} ${input.metadata.restNote ?? ''} ${plain}`)
      : countWords(plain)

  const xp = calculateXp({
    kind: input.kind,
    metadata: input.metadata,
    words,
    images: mediaIds.length,
    videos: videoUrls.length,
    streakDays: options.streakDays,
  } as XpInput).total

  const excerpt = makeExcerpt(plain || describeMetadata(input.kind, input.metadata)) || null

  const row = {
    branch_id: input.branchId,
    kind: input.kind,
    title: input.title,
    content: (doc ?? null) as Json | null,
    excerpt,
    metadata: input.metadata as Json,
    video_urls: videoUrls,
    is_public: input.isPublic,
    xp,
    occurred_on: input.occurredOn,
    book_id: input.bookId ?? null,
    game_id: input.gameId ?? null,
    anime_id: input.animeId ?? null,
  }

  let id: string
  let slug: string
  let previousSlug: string | null = null

  if (input.id) {
    const { data: existing } = await supabase.from('entries').select('id, slug').eq('id', input.id).maybeSingle()
    if (!existing) throw new UserError(t.errors.notFound)
    // Slug se ne menja pri izmeni: linkovi i Google ostaju ispravni.
    const { error } = await supabase.from('entries').update(row).eq('id', existing.id)
    if (error) throw error
    id = existing.id
    slug = existing.slug
    previousSlug = existing.slug
  } else {
    const base = slugify(options.slugBase ?? input.title) || input.kind
    const { data: taken } = await supabase.from('entries').select('slug').like('slug', `${base}%`)
    slug = uniqueSlug(base, (taken ?? []).map((r) => r.slug))
    const { data: created, error } = await supabase
      .from('entries')
      .insert({ ...row, slug, owner_id: userId })
      .select('id')
      .single()
    if (error) {
      if (error.code === '23505' && input.kind === 'journal') throw new UserError('Za taj dan već postoji upis u dnevniku.')
      throw error
    }
    id = created.id
  }

  await syncEntryMedia({ supabase, ownerId: userId, entryId: id, mediaIds, alts: input.mediaAlts, isPublic: input.isPublic })

  return { id, slug, previousSlug, xp }
}
