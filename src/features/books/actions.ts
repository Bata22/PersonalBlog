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
import { bookCandidateSchema, type BookCandidate } from './openlibrary'

const statusSchema = z.enum(['zelim', 'citam', 'procitano', 'odustao'])

const addSchema = z.union([
  z.object({ source: z.literal('openlibrary'), candidate: bookCandidateSchema, status: statusSchema }),
  z.object({
    source: z.literal('rucno'),
    title: z.string().trim().min(1, 'Upiši naslov.').max(300),
    authors: z.string().trim().max(300),
    status: statusSchema,
  }),
])

export type AddBookInput =
  | { source: 'openlibrary'; candidate: BookCandidate; status: z.infer<typeof statusSchema> }
  | { source: 'rucno'; title: string; authors: string; status: z.infer<typeof statusSchema> }

export async function addBook(input: AddBookInput): Promise<ActionResult<{ id: string }>> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  const parsed = addSchema.safeParse(input)
  if (!parsed.success) return fail(t.errors.validation, zodFieldErrors(parsed.error))
  const data = parsed.data
  const { supabase, userId } = owner

  const fields =
    data.source === 'openlibrary'
      ? {
          title: data.candidate.title,
          authors: data.candidate.authors,
          cover_url: data.candidate.coverUrl,
          openlibrary_key: data.candidate.key,
          isbn: data.candidate.isbn,
          pages: data.candidate.pages,
          first_published: data.candidate.year,
        }
      : {
          title: data.title,
          authors: data.authors.split(',').map((a) => a.trim()).filter(Boolean).slice(0, 5),
        }

  if (data.source === 'openlibrary') {
    const { data: existing } = await supabase.from('books').select('id').eq('openlibrary_key', data.candidate.key).maybeSingle()
    if (existing) return fail(t.books.alreadyAdded)
  }

  const base = slugify(fields.title) || 'knjiga'
  const { data: taken } = await supabase.from('books').select('slug').like('slug', `${base}%`)
  const slug = uniqueSlug(base, (taken ?? []).map((r) => r.slug), 'knjiga')

  const today = isoDateInZone(new Date())
  const { data: created, error } = await supabase
    .from('books')
    .insert({
      ...fields,
      owner_id: userId,
      slug,
      status: data.status,
      started_on: data.status === 'citam' ? today : null,
    })
    .select('id')
    .single()
  if (error) return fail(t.errors.generic)

  invalidate(CACHE_TAGS.books)
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
  startedOn: optionalDate,
  finishedOn: optionalDate,
})

export type UpdateBookInput = z.input<typeof updateSchema>

export async function updateBook(input: UpdateBookInput): Promise<ActionResult<{ milestoneXp: number }>> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) return fail(t.errors.validation, zodFieldErrors(parsed.error))
  const data = parsed.data

  try {
    const { data: before } = await owner.supabase.from('books').select('id, title, status, is_public').eq('id', data.id).maybeSingle()
    if (!before) return fail(t.errors.notFound)

    const finishedOn = data.status === 'procitano' ? (data.finishedOn ?? isoDateInZone(new Date())) : data.finishedOn
    const { error } = await owner.supabase
      .from('books')
      .update({ status: data.status, rating: data.rating, started_on: data.startedOn, finished_on: finishedOn })
      .eq('id', data.id)
    if (error) throw error

    let milestoneXp = 0
    if (data.status === 'procitano' && before.status !== 'procitano') {
      const milestone = await createMilestone(owner, {
        role: 'books',
        event: 'book_finished',
        title: t.books.finishedMilestone(before.title),
        xp: XP_RULES.milestones.bookFinished,
        occurredOn: finishedOn ?? isoDateInZone(new Date()),
        isPublic: before.is_public,
        subject: { book_id: before.id },
      })
      if (milestone) milestoneXp = XP_RULES.milestones.bookFinished
    }

    invalidate(CACHE_TAGS.books, CACHE_TAGS.entries, CACHE_TAGS.xp)
    return ok({ milestoneXp })
  } catch (error) {
    return fail(userMessage(error, 'updateBook'))
  }
}

export async function deleteBook(id: string): Promise<ActionResult> {
  const owner = await ownerOrNull()
  if (!owner) return fail(t.errors.forbidden)
  if (!z.uuid().safeParse(id).success) return fail(t.errors.notFound)

  try {
    const { data: notes } = await owner.supabase.from('entries').select('id').eq('book_id', id)
    for (const note of notes ?? []) await removeEntryMedia(owner.supabase, note.id)
    const { error } = await owner.supabase.from('books').delete().eq('id', id)
    if (error) throw error
    invalidate(CACHE_TAGS.books, CACHE_TAGS.entries, CACHE_TAGS.xp)
    return ok(null)
  } catch (error) {
    return fail(userMessage(error, 'deleteBook'))
  }
}
