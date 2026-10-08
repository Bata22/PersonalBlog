import { cacheLife, cacheTag } from 'next/cache'
import { siteConfig } from '@/config/site'
import { CACHE_TAGS } from '@/lib/cache-tags'
import { isSupabaseConfigured } from '@/lib/env'
import { createPublicClient } from '@/lib/supabase/public'
import type { SessionClient } from '@/lib/supabase/server'

// Upiti su napisani kao doslovni stringovi (as const) da bi supabase-js
// iz njih izveo tačne TypeScript tipove redova.

/** Kolone za liste i kartice (bez punog teksta). */
const CARD_SELECT =
  'id, slug, title, excerpt, kind, occurred_on, xp, is_public, branch_id, metadata, video_urls, book_id, game_id, anime_id, published_at, created_at, updated_at, media(id, bucket, path, thumb_path, width, height, alt, position)' as const

/** Kolone za stranicu jednog upisa (isto + tekst). */
const FULL_SELECT =
  'id, slug, title, excerpt, kind, occurred_on, xp, is_public, branch_id, metadata, video_urls, book_id, game_id, anime_id, published_at, created_at, updated_at, content, media(id, bucket, path, thumb_path, width, height, alt, position)' as const

export type SubjectFilter = { column: 'book_id' | 'game_id' | 'anime_id'; id: string }

export type FeedParams = {
  page?: number
  branchIds?: string[]
  subject?: SubjectFilter
  pageSize?: number
}

function sortMedia<T extends { media: { position: number }[] }>(rows: T[]): T[] {
  for (const row of rows) row.media.sort((a, b) => a.position - b.position)
  return rows
}

/** Javni spisak upisa (keširan; osvežava se pri svakom čuvanju upisa). */
export async function getPublicFeed({ page = 1, branchIds, subject, pageSize = siteConfig.pageSize }: FeedParams = {}) {
  'use cache'
  cacheLife('days')
  cacheTag(CACHE_TAGS.entries)
  if (!isSupabaseConfigured()) return { items: [], hasMore: false }

  const from = (page - 1) * pageSize
  let query = createPublicClient()
    .from('entries')
    .select(CARD_SELECT)
    .eq('is_public', true)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize)
  if (branchIds?.length) query = query.in('branch_id', branchIds)
  if (subject) query = query.eq(subject.column, subject.id)

  const { data, error } = await query
  if (error) throw error
  return { items: sortMedia(data.slice(0, pageSize)), hasMore: data.length > pageSize }
}

export type EntryCard = Awaited<ReturnType<typeof getPublicFeed>>['items'][number]

export async function getPublicEntry(slug: string) {
  'use cache'
  cacheLife('days')
  cacheTag(CACHE_TAGS.entries, CACHE_TAGS.entry(slug))
  if (!isSupabaseConfigured()) return null

  const { data, error } = await createPublicClient()
    .from('entries')
    .select(FULL_SELECT)
    .eq('slug', slug)
    .eq('is_public', true)
    .maybeSingle()
  if (error) throw error
  return data ? sortMedia([data])[0] : null
}

export type FullEntry = NonNullable<Awaited<ReturnType<typeof getPublicEntry>>>

/** Za sitemap i RSS. */
export async function getPublicEntryIndex() {
  'use cache'
  cacheLife('days')
  cacheTag(CACHE_TAGS.entries)
  if (!isSupabaseConfigured()) return []

  const { data, error } = await createPublicClient()
    .from('entries')
    .select('slug, title, excerpt, occurred_on, published_at, updated_at, branch_id')
    .eq('is_public', true)
    .order('occurred_on', { ascending: false })
    .limit(5000)
  if (error) throw error
  return data
}

// ---------- vlasnik (admin): svi upisi, bez keša ----------

export async function getOwnerFeed(
  supabase: SessionClient,
  { page = 1, branchIds, subject, pageSize = 20, visibility }: FeedParams & { visibility?: 'public' | 'private' },
) {
  const from = (page - 1) * pageSize
  let query = supabase
    .from('entries')
    .select(CARD_SELECT)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, from + pageSize)
  if (branchIds?.length) query = query.in('branch_id', branchIds)
  if (subject) query = query.eq(subject.column, subject.id)
  if (visibility) query = query.eq('is_public', visibility === 'public')

  const { data, error } = await query
  if (error) throw error
  return { items: sortMedia(data.slice(0, pageSize)), hasMore: data.length > pageSize }
}

export async function getOwnerEntry(supabase: SessionClient, id: string) {
  const { data, error } = await supabase.from('entries').select(FULL_SELECT).eq('id', id).maybeSingle()
  if (error) throw error
  return data ? sortMedia([data])[0] : null
}

/** XP po danu za poslednjih N dana (za tablu). */
export async function getOwnerRecentXp(supabase: SessionClient, sinceIsoDate: string) {
  const { data, error } = await supabase
    .from('entries')
    .select('branch_id, xp, occurred_on')
    .gte('occurred_on', sinceIsoDate)
  if (error) throw error
  return data
}
